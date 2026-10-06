import { createServerFn } from "@tanstack/react-start";

export type SmsAction =
  | { op: "credit"; apiKey: string }
  | {
      op: "bulk";
      apiKey: string;
      lineNumber: string;
      messageText: string;
      mobiles: string[];
    }
  | {
      op: "peers";
      apiKey: string;
      lineNumber: string;
      messageTexts: string[];
      mobiles: string[];
    }
  | {
      op: "verify";
      apiKey: string;
      mobile: string;
      templateId: number;
      parameters: { name: string; value: string }[];
    };

export type SmsResult = {
  ok: boolean;
  http: number;
  message: string;
  balance: number | null;
  packId: string | null;
};

const fail = (message: string): SmsResult => ({
  ok: false,
  http: 0,
  message,
  balance: null,
  packId: null,
});

function asRecord(value: unknown) {
  if (value && typeof value === "object") return value as Record<string, unknown>;
  return null;
}

export const smsCall = createServerFn({ method: "POST" })
  .validator((input: SmsAction) => input)
  .handler(async ({ data }): Promise<SmsResult> => {
    const apiKey = data.apiKey?.trim() ?? "";
    if (apiKey.length < 8 || apiKey.length > 200) return fail("کلید API معتبر نیست");

    let path = "";
    let body: Record<string, unknown> | undefined;

    if (data.op === "credit") {
      path = "/v1/credit";
    } else if (data.op === "bulk") {
      const mobiles = (data.mobiles ?? []).slice(0, 100);
      const messageText = (data.messageText ?? "").slice(0, 800);
      if (!/^\d{4,16}$/.test(data.lineNumber ?? "")) return fail("شماره خط نادرست است");
      if (!messageText || mobiles.length === 0) return fail("متن یا گیرنده خالی است");
      path = "/v1/send/bulk";
      body = {
        lineNumber: Number(data.lineNumber),
        messageText,
        mobiles,
        sendDateTime: null,
      };
    } else if (data.op === "peers") {
      const mobiles = (data.mobiles ?? []).slice(0, 100);
      const messageTexts = (data.messageTexts ?? []).slice(0, mobiles.length).map((text) => text.slice(0, 800));
      if (!/^\d{4,16}$/.test(data.lineNumber ?? "")) return fail("شماره خط نادرست است");
      if (messageTexts.length !== mobiles.length || mobiles.length === 0) return fail("تعداد متن و شماره یکی نیست");
      path = "/v1/send/likeTolike";
      body = {
        lineNumber: Number(data.lineNumber),
        messageTexts,
        mobiles,
        sendDateTime: null,
      };
    } else if (data.op === "verify") {
      const templateId = Number(data.templateId);
      const parameters = (data.parameters ?? []).slice(0, 8).map((item) => ({
        name: String(item.name ?? "").slice(0, 40),
        value: String(item.value ?? "").slice(0, 80),
      }));
      if (!Number.isInteger(templateId) || templateId <= 0) return fail("شناسه قالب نادرست است");
      if (!/^09\d{9}$/.test(data.mobile ?? "")) return fail("موبایل نادرست است");
      path = "/v1/send/verify";
      body = { mobile: data.mobile, templateId, parameters };
    } else {
      return fail("عملیات ناشناخته");
    }

    try {
      const response = await fetch(`https://api.sms.ir${path}`, {
        method: data.op === "credit" ? "GET" : "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-API-KEY": apiKey,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(15_000),
      });
      const text = await response.text();
      let parsed: unknown = null;
      try {
        parsed = text ? JSON.parse(text) : null;
      } catch {
        parsed = null;
      }
      const record = asRecord(parsed);
      const status = typeof record?.status === "number" ? record.status : response.ok ? 1 : 0;
      const message =
        typeof record?.message === "string" && record.message
          ? record.message
          : response.ok
            ? "ok"
            : text.slice(0, 180) || "sms.ir error";
      const payload = asRecord(record?.data);
      const balance = data.op === "credit" && typeof record?.data === "number" ? record.data : null;
      const packRaw = payload?.packId ?? payload?.messageId;
      return {
        ok: response.ok && status === 1,
        http: response.status,
        message,
        balance,
        packId: packRaw == null ? null : String(packRaw),
      };
    } catch (error) {
      return fail(error instanceof Error ? error.message : "network");
    }
  });
