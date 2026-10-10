import { createServerFn } from "@tanstack/react-start";
import { createRequire } from "module";

/**
 * Parsian E-commerce (pec.ir / pec.shaparak.ir) card-gateway bridge.
 *
 * The local `pec_ir` package builds SOAP envelopes for the NewIPG services:
 * `sale.payment` → payment token + payment link, `confirm.payment` → settle
 * the token, `reversal.request` → void it. Calls go through the desk server
 * (like SMS) because shaparak blocks direct browser calls and the PIN must
 * never sit inside the webview's JS bundle.
 */

export type PecAction =
  | {
      op: "pay";
      pin: string;
      amount: number;
      orderId: number | string;
      callBackUrl: string;
      additionalData?: string;
      originator?: string;
    }
  | { op: "confirm"; pin: string; token: number | string }
  | {
      op: "confirm-with-amount";
      pin: string;
      token: number | string;
      orderId: number | string;
      amount: number;
    }
  | { op: "reversal"; pin: string; token: number | string };

export type PecResult = {
  ok: boolean;
  status: number;
  message: string;
  token: number | string | null;
  link: string | null;
};

export const PEC_OK_STATUS = 0;

const fail = (message: string, status = -1): PecResult => ({
  ok: false,
  status,
  message,
  token: null,
  link: null,
});

type PecSaleResponse = Record<string, unknown> & {
  Token?: number | string;
  Message?: string;
  Status?: number;
  link?: string;
};

type PecClient = {
  sale: {
    payment(info: {
      Amount: number;
      OrderId: number | string;
      CallBackUrl: string;
      AdditionalData?: string;
      Originator?: string;
    }): Promise<PecSaleResponse>;
  };
  confirm: {
    payment(token: number | string): Promise<PecSaleResponse>;
    paymentWithAmount(info: {
      Token: number | string;
      OrderId: number | string;
      Amount: number;
    }): Promise<PecSaleResponse>;
  };
  reversal: {
    request(token: number | string): Promise<PecSaleResponse>;
  };
};

let cachedModule: ((pin: string) => PecClient) | null = null;

function loadPec(): (pin: string) => PecClient {
  if (!cachedModule) {
    // Server-side CommonJS require: the office checkout keeps pec_ir outside
    // npm so its PIN/upgrade cadence stays local; resolve it by absolute path
    // relative to this module, falling back to an npm-installed copy.
    const require = createRequire(import.meta.url);
    try {
      const factory = require("../../pec_ir/index.js") as (pin: string) => PecClient;
      cachedModule = factory;
    } catch {
      const factory = require("pec_ir") as unknown as (pin: string) => PecClient;
      cachedModule = factory;
    }
  }
  return cachedModule;
}

function normalize(result: PecSaleResponse | undefined, fallback: string): PecResult {
  const status = typeof result?.Status === "number" ? result.Status : -1;
  const message = typeof result?.Message === "string" && result.Message ? result.Message : fallback;
  const token =
    result?.Token == null || Number(result.Token) === 0 ? null : (result.Token as number | string);
  const link = typeof result?.link === "string" ? result.link : token ? `https://pec.shaparak.ir/NewIPG/?token=${token}` : null;
  return { ok: status === PEC_OK_STATUS, status, message, token, link };
}

export const pecCall = createServerFn({ method: "POST" })
  .validator((input: PecAction) => input)
  .handler(async ({ data }): Promise<PecResult> => {
    const pin = data.pin?.trim() ?? "";
    if (pin.length < 6 || pin.length > 80) return fail("کلید پارسیان (PEC PIN) نادرست است");

    let client: PecClient;
    try {
      client = loadPec()(pin);
    } catch (error) {
      return fail(`بارگذاری pec_ir ناموفق: ${error instanceof Error ? error.message : "خطا"}`);
    }

    try {
      if (data.op === "pay") {
        const amount = Math.round(data.amount);
        if (!Number.isFinite(amount) || amount <= 0) return fail("مبلغ نادرست است");
        if (!data.callBackUrl || !/^https?:\/\//i.test(data.callBackUrl))
          return fail("آدرس بازگشت (CallBackUrl) نادرست است");
        const result = await client.sale.payment({
          Amount: amount,
          OrderId: data.orderId,
          CallBackUrl: data.callBackUrl,
          ...(data.additionalData ? { AdditionalData: data.additionalData } : {}),
          ...(data.originator ? { Originator: data.originator } : {}),
        });
        const out = normalize(result, `وضعیت ${result?.Status ?? -1}`);
        return { ...out, ok: out.ok && out.token != null };
      }
      if (data.op === "confirm") {
        return normalize(await client.confirm.payment(data.token), "تأیید پرداخت ناموفق");
      }
      if (data.op === "confirm-with-amount") {
        const amount = Math.round(data.amount);
        if (!Number.isFinite(amount) || amount <= 0) return fail("مبلغ نادرست است");
        return normalize(
          await client.confirm.paymentWithAmount({
            Token: data.token,
            OrderId: data.orderId,
            Amount: amount,
          }),
          "تأیید پرداخت ناموفق",
        );
      }
      if (data.op === "reversal") {
        return normalize(await client.reversal.request(data.token), "برگشت تراکنش ناموفق");
      }
      return fail("عملیات ناشناخته");
    } catch (error) {
      return fail(error instanceof Error ? error.message.slice(0, 240) : "شبکه در دسترس نیست");
    }
  });
