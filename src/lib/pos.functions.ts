import { createServerFn } from "@tanstack/react-start";
import { createRequire } from "module";
import { pecReplyComplete } from "./pec-frame";

/**
 * Physical PEC POS-device bridge.
 *
 * The **connection** is `pec-pos@0.1.0` — the Node port of the PEC tester's
 * `PCPOS` class: its `TcpTransport` opens the socket to the terminal, its
 * `SerialTransport` opens the COM port, and `sendTransaction()` runs the
 * request/response exchange with its own completion rule and timeout.
 *
 * `pec-pos` ships deliberately without a wire codec (that logic lives inside
 * `PCPOSDLL.dll`, which was never published), so the codec plugged into it is
 * `pec-pcpos`'s: `buildMessage()` frames the request, `parseResponse()` reads
 * the reply. The two agree on the PEC framing — `[4-digit total length]`
 * + `RQ` + `[3-digit body length]` + tag blocks — so the terminal sees the
 * same bytes it always did, only the socket code changed.
 *
 * Everything runs on the desk server for the same reason as
 * `pec.functions.ts`: outbound TCP to the terminal or a serial COM port is
 * not reachable from the browser, and the device config stays out of the
 * bundle.
 *
 * Ops:
 *  - `pay`         — send the transaction amount to the device (LAN or serial)
 *  - `test`        — `PCPOS.testConnection()` without sending money
 *  - `banks`       — resolve cardholder bank from a PAN via the BIN table
 *  - `raw`         — one-shot `sendTransaction()` for advanced operators
 *  - `build`       — inspect the wire hex a device charge would send
 *  - `parse`       — parse a raw device response string
 */

export type PosOp =
  | {
      op: "pay";
      amount: number;
      type?: "LAN" | "SERIAL";
      ip?: string;
      port?: number;
      comPort?: string;
      baudRate?: number;
      prCode?: string;
      currency?: string;
      cardholderReceipt?: string;
      merchantReceipt?: string;
      cardholderTitle?: string;
      merchantTitle?: string;
      service?: string;
      serviceGroup?: string;
      timeoutMs?: number;
    }
  | {
      op: "test";
      type?: "LAN" | "SERIAL";
      ip?: string;
      port?: number;
      comPort?: string;
      baudRate?: number;
      timeoutMs?: number;
    }
  | { op: "banks"; pan: string }
  | { op: "raw"; request: unknown; timeoutMs?: number }
  | { op: "build"; amount: number; prCode?: string; currency?: string }
  | { op: "parse"; rawResponse: string };

export type PosDeviceData = {
  bankName?: string;
  body?: string;
  hex?: string;
} & Record<string, string | number | boolean | null>;

export type PosResult = {
  ok: boolean;
  responseCode: string | null;
  message: string;
  data?: PosDeviceData | null;
};

const fail = (message: string): PosResult => ({
  ok: false,
  responseCode: null,
  message,
});

type PcposClient = {
  request: string;
  rawResponse: string;
  testConnection(): Promise<boolean>;
  sendTransaction(): Promise<{ raw: string; parsed: string }>;
};

type Codec = {
  encode(fields: Record<string, unknown>): Buffer | string;
  isComplete(buf: Buffer): boolean;
  decode(raw: string): string;
};

/** The `pec-pos` package surface this bridge uses. */
type PecPosModule = {
  PCPOS: new (opts: Record<string, unknown>) => PcposClient;
  ConnectionType: { LAN: 0; Serial: 1 };
};

/** The `pec-pcpos` surface used as the codec and the BIN/receipt helpers. */
type CodecModule = {
  buildMessage(opts: Record<string, unknown>): { body: string; bytes: Buffer };
  parseResponse(raw: string): Record<string, unknown>;
  getBankNameByPan(pan: string | null | undefined): string;
  sendTransaction(req: Record<string, unknown>): Promise<Record<string, unknown>>;
};

const isPlain = (v: unknown): v is PosDeviceData =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const shallow = (v: Record<string, unknown>): PosDeviceData => {
  const out: Record<string, string | number | boolean | null> = {};
  for (const [k, val] of Object.entries(v)) {
    if (typeof val === "string" || typeof val === "number" || typeof val === "boolean" || val === null)
      out[k] = val;
  }
  return out;
};

const require_ = createRequire(import.meta.url);

/** Try each loader in order; the first that resolves wins. */
function loadFirst<T>(candidates: string[], label: string): T {
  const errors: string[] = [];
  for (const candidate of candidates) {
    try {
      return require_(candidate) as T;
    } catch (error) {
      errors.push(`${candidate}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  throw new Error(`${label} — ${errors.join(" · ")}`);
}

/** Repo-local first (the office checkout keeps both packages outside npm),
 *  an installed copy second — the packages are `file:` dependencies now, so
 *  the bare name resolves in dev and in the built server bundle alike. */
function loadPecPos(): PecPosModule {
  return loadFirst<PecPosModule>(
    ["pec-pos", "../../pec-pos-0.1.0/package/src/index.js"],
    "pec-pos 0.1.0 یافت نشد",
  );
}

function loadCodecModule(): CodecModule {
  return loadFirst<CodecModule>(
    ["pec-pcpos", "../../pec-pcpos/dist/cjs/index.js"],
    "pec-pcpos یافت نشد",
  );
}

/**
 * The codec `pec-pos` asks for. `encode` frames one request, `isComplete`
 * decides whether a reply has fully arrived, `decode` turns the raw reply into
 * the parsed object (JSON, because the PCPOS contract is string in / string
 * out).
 *
 * Framing is the shared PEC rule in `pec-frame.ts`: the four ASCII length
 * digits count the bytes after the prefix, so completeness is
 * `4 + declared` bytes. A reply that does not start with four digits is taken
 * as-is rather than waited on — a terminal that answers with plain text should
 * not hang the register for the full timeout.
 */
function makeCodec(
  mod: CodecModule,
  extra: {
    cardholderReceipt?: string;
    merchantReceipt?: string;
    cardholderTitle?: string;
    merchantTitle?: string;
    service?: string;
  } = {},
): Codec {
  return {
    encode(fields) {
      const built = mod.buildMessage({
        amount: String(fields.amount ?? ""),
        ...(fields.prCode ? { prCode: fields.prCode } : {}),
        ...(fields.currency ? { currency: fields.currency } : {}),
        ...(fields.serviceGroup ? { serviceGroup: fields.serviceGroup } : {}),
        ...(extra.cardholderReceipt ? { cardholderReceipt: extra.cardholderReceipt } : {}),
        ...(extra.merchantReceipt ? { merchantReceipt: extra.merchantReceipt } : {}),
        ...(extra.cardholderTitle ? { cardholderTitle: extra.cardholderTitle } : {}),
        ...(extra.merchantTitle ? { merchantTitle: extra.merchantTitle } : {}),
        ...(extra.service ? { service: extra.service } : {}),
      });
      return built.bytes;
    },
    isComplete(buf) {
      return pecReplyComplete(buf);
    },
    decode(raw) {
      return JSON.stringify(mod.parseResponse(raw));
    },
  };
}

function normalize(resp: Record<string, unknown>): PosResult {
  const responseCode = typeof resp.responseCode === "string" ? resp.responseCode : null;
  const data = isPlain(resp) ? shallow(resp) : null;
  // The raw reply carries framing bytes and possibly CP1256 garbage; the
  // parsed fields are what the receipt toast and the operator care about.
  if (data) delete data.rawResponse;
  return {
    ok: responseCode === "00",
    responseCode,
    message:
      responseCode === "00" ? "تراکنش روی دستگاه تأیید شد" : `پاسخ دستگاه: ${responseCode ?? "نامشخص"}`,
    data,
  };
}

export const posCall = createServerFn({ method: "POST" })
  .validator((input: PosOp) => input)
  .handler(async ({ data }): Promise<PosResult> => {
    let mod: CodecModule;
    try {
      mod = loadCodecModule();
    } catch (error) {
      return fail(`بارگذاری pec-pcpos ناموفق: ${error instanceof Error ? error.message : "خطا"}`);
    }

    try {
      if (data.op === "banks") {
        return {
          ok: true,
          responseCode: null,
          message: "بانک صادرکننده",
          data: { bankName: mod.getBankNameByPan(data.pan) },
        };
      }
      if (data.op === "build") {
        const amount = Math.round(data.amount);
        if (!Number.isFinite(amount) || amount <= 0) return fail("مبلغ نادرست است");
        const built = mod.buildMessage({
          amount: String(amount),
          ...(data.prCode ? { prCode: data.prCode } : {}),
          ...(data.currency ? { currency: data.currency } : {}),
        });
        return {
          ok: true,
          responseCode: null,
          message: "پیام ساخته شد",
          data: { body: built.body, hex: built.bytes.toString("hex") },
        };
      }
      if (data.op === "parse") {
        const parsed = mod.parseResponse(data.rawResponse);
        return { ok: true, responseCode: null, message: "پاسخ تجزیه شد", data: isPlain(parsed) ? shallow(parsed) : null };
      }
      if (data.op === "raw") {
        return normalize(await mod.sendTransaction({ ...(data.request as Record<string, unknown>), timeoutMs: data.timeoutMs }));
      }

      // ── Everything below talks to the terminal through pec-pos ────────────
      let pec: PecPosModule;
      try {
        pec = loadPecPos();
      } catch (error) {
        return fail(`بارگذاری pec-pos ناموفق: ${error instanceof Error ? error.message : "خطا"}`);
      }

      const wantType = data.type ?? "LAN";
      const connectionType = wantType === "LAN" ? pec.ConnectionType.LAN : pec.ConnectionType.Serial;
      const link = {
        connectionType,
        ...(wantType === "LAN" ? { ip: data.ip, port: data.port } : { comPort: data.comPort }),
        ...(data.baudRate ? { baudRate: data.baudRate } : {}),
        // One timeout covers connect + the terminal's own read window (card
        // insertion, PIN, second tap), so a real sale gets 90s unless the
        // caller (connection test) asks for something shorter.
        timeout: data.timeoutMs ?? 90_000,
      };

      if (data.op === "test") {
        // Validate here so a missing device address stays a localized message
        // instead of pec-pos's English constructor error.
        if (wantType === "LAN" && (!data.ip || !data.port)) return fail("آی‌پی و پورت دستگاه را در تنظیمات بگذار");
        if (wantType === "SERIAL" && !data.comPort) return fail("پورت سریال دستگاه را در تنظیمات بگذار");
        const client = new pec.PCPOS({ ...link, codec: makeCodec(mod) });
        const reachable = await client.testConnection();
        return reachable
          ? { ok: true, responseCode: null, message: "دستگاه در دسترس است", data: null }
          : fail(
              wantType === "LAN"
                ? `دستگاه در ${data.ip ?? "؟"}:${data.port ?? "?"} پاسخ نمی‌دهد`
                : "درگاه سریال باز نیست",
            );
      }

      // pay
      const amount = Math.round(data.amount);
      if (!Number.isFinite(amount) || amount <= 0) return fail("مبلغ نادرست است");
      if (wantType === "LAN" && (!data.ip || !data.port)) return fail("آی‌پی و پورت دستگاه را در تنظیمات بگذار");
      if (wantType === "SERIAL" && !data.comPort) return fail("پورت سریال دستگاه را در تنظیمات بگذار");

      const client = new pec.PCPOS({
        ...link,
        amount: String(amount),
        ...(data.prCode ? { prCode: data.prCode } : {}),
        ...(data.currency ? { currency: data.currency } : {}),
        ...(data.serviceGroup ? { serviceGroup: data.serviceGroup } : {}),
        codec: makeCodec(mod, {
          cardholderReceipt: data.cardholderReceipt,
          merchantReceipt: data.merchantReceipt,
          cardholderTitle: data.cardholderTitle,
          merchantTitle: data.merchantTitle,
          service: data.service,
        }),
      });
      const { parsed } = await client.sendTransaction();
      let response: Record<string, unknown>;
      try {
        response = JSON.parse(parsed) as Record<string, unknown>;
      } catch {
        return fail("پاسخ دستگاه قابل خواندن نیست");
      }
      return normalize(response);
    } catch (error) {
      return fail(error instanceof Error ? error.message.slice(0, 240) : "دستگاه در دسترس نیست");
    }
  });
