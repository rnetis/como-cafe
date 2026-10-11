import { createServerFn } from "@tanstack/react-start";
import { createRequire } from "module";

/**
 * Physical PEC POS-device bridge, built on the repo-local `pec-pcpos`
 * package (a pure-Node port of the Intek.PcPosLibrary protocol that the
 * PEC terminals speak). Runs on the desk server for the same reason as
 * `pec.functions.ts`: outbound TCP to the terminal or a serial COM port
 * is not reachable from the browser, and the device config stays out of
 * the bundle.
 *
 * Ops:
 *  - `pay`         — send the transaction amount to the device (LAN or serial)
 *  - `test`        — `PecPcpos.testConnection()` without sending money
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
  | { op: "test"; type?: "LAN" | "SERIAL"; ip?: string; port?: number; comPort?: string; timeoutMs?: number }
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
  sendTransaction(req: Record<string, unknown>): Promise<Record<string, unknown>>;
  testConnection(req: Record<string, unknown>): Promise<boolean>;
  buildRequest(req: Record<string, unknown>): { body: string; bytes: Buffer };
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

type PcposModule = {
  PecPcpos: new (opts?: Record<string, unknown>) => PcposClient;
  sendTransaction(req: Record<string, unknown>): Promise<Record<string, unknown>>;
  getBankNameByPan(pan: string | null | undefined): string;
  buildMessage(opts: Record<string, unknown>): { body: string; bytes: Buffer };
  parseResponse(raw: string): Record<string, unknown>;
};

let cachedModule: PcposModule | null = null;

function loadPcpos(): PcposModule {
  if (!cachedModule) {
    // Server-side CommonJS require: the office checkout keeps pec-pcpos
    // outside npm so its build output stays local; resolve it by absolute
    // path relative to this module, falling back to an npm-installed copy.
    const require = createRequire(import.meta.url);
    try {
      const factory = require("../../pec-pcpos/dist/cjs/index.js") as PcposModule;
      cachedModule = factory;
    } catch {
      const factory = require("pec-pcpos") as unknown as PcposModule;
      cachedModule = factory;
    }
  }
  return cachedModule;
}

function normalize(resp: Record<string, unknown>): PosResult {
  const responseCode = typeof resp.responseCode === "string" ? resp.responseCode : null;
  return {
    ok: responseCode === "00",
    responseCode,
    message:
      responseCode === "00" ? "تراکنش روی دستگاه تأیید شد" : `پاسخ دستگاه: ${responseCode ?? "نامشخص"}`,
    data: isPlain(resp) ? shallow(resp) : null,
  };
}

export const posCall = createServerFn({ method: "POST" })
  .validator((input: PosOp) => input)
  .handler(async ({ data }): Promise<PosResult> => {
    let mod: PcposModule;
    try {
      mod = loadPcpos();
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

      const wantType = data.type ?? "LAN";

      if (data.op === "test") {
        const client = new mod.PecPcpos({
          ...(wantType === "LAN" && data.ip ? { ip: data.ip, port: data.port } : {}),
          ...(wantType === "SERIAL" && data.comPort ? { comPort: data.comPort } : {}),
          ...(data.timeoutMs ? { timeoutMs: data.timeoutMs } : {}),
        });
        const reachable = await client.testConnection({ type: wantType, ip: data.ip, port: data.port, comPort: data.comPort });
        return reachable
          ? { ok: true, responseCode: null, message: "دستگاه در دسترس است", data: null }
          : fail(wantType === "LAN" ? `دستگاه در ${data.ip ?? "؟"}:${data.port ?? "?"} پاسخ نمی‌دهد` : "درگاه سریال باز نیست");
      }

      // pay
      const amount = Math.round(data.amount);
      if (!Number.isFinite(amount) || amount <= 0) return fail("مبلغ نادرست است");
      if (wantType === "LAN" && (!data.ip || !data.port)) return fail("آی‌پی و پورت دستگاه را در تنظیمات بگذار");
      if (wantType === "SERIAL" && !data.comPort) return fail("پورت سریال دستگاه را در تنظیمات بگذار");
      const client = new mod.PecPcpos({
        ...(wantType === "LAN" && data.ip ? { ip: data.ip, port: data.port } : {}),
        ...(data.timeoutMs ? { timeoutMs: data.timeoutMs } : {}),
      });
      const resp = await client.sendTransaction({
        amount: String(amount),
        type: wantType,
        ip: data.ip,
        port: data.port,
        comPort: data.comPort,
        prCode: data.prCode,
        currency: data.currency,
        ...(data.cardholderReceipt ? { cardholderReceipt: data.cardholderReceipt } : {}),
        ...(data.merchantReceipt ? { merchantReceipt: data.merchantReceipt } : {}),
        ...(data.cardholderTitle ? { cardholderTitle: data.cardholderTitle } : {}),
        ...(data.merchantTitle ? { merchantTitle: data.merchantTitle } : {}),
        ...(data.service ? { service: data.service } : {}),
        ...(data.serviceGroup ? { serviceGroup: data.serviceGroup } : {}),
      });
      return normalize(resp);
    } catch (error) {
      return fail(error instanceof Error ? error.message.slice(0, 240) : "دستگاه در دسترس نیست");
    }
  });
