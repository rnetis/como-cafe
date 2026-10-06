import { normPhone, validPhone } from "./format";
import { smsCall, type SmsResult } from "./sms.functions";
import type { SmsKind } from "./types";

export type OutMessage = { mobile: string; text: string };

export type SendOutcome = {
  status: "sent" | "demo" | "failed";
  detail: string;
  balance: number | null;
  kind: SmsKind;
  to: string[];
  body: string;
};

export async function sendOut(opts: {
  apiKey: string;
  line: string;
  kind: SmsKind;
  messages: OutMessage[];
}): Promise<SendOutcome> {
  const messages = opts.messages
    .map((message) => ({ mobile: normPhone(message.mobile), text: message.text.trim() }))
    .filter((message) => validPhone(message.mobile) && message.text);
  const body = messages[0]?.text ?? "";
  const to = messages.map((message) => message.mobile);
  if (messages.length === 0) {
    return { status: "failed", detail: "گیرنده‌ای نیست", balance: null, kind: opts.kind, to, body };
  }
  if (!opts.apiKey.trim()) {
    return {
      status: "demo",
      detail: "کلید SMS.ir نیست — پیام فقط در دفترچه تمرین ماند",
      balance: null,
      kind: opts.kind,
      to,
      body,
    };
  }
  const same = messages.every((message) => message.text === messages[0]?.text);
  let result: SmsResult;
  if (same) {
    result = await smsCall({
      data: {
        op: "bulk",
        apiKey: opts.apiKey.trim(),
        lineNumber: opts.line.trim(),
        messageText: messages[0]!.text,
        mobiles: to,
      },
    });
  } else {
    result = await smsCall({
      data: {
        op: "peers",
        apiKey: opts.apiKey.trim(),
        lineNumber: opts.line.trim(),
        messageTexts: messages.map((message) => message.text),
        mobiles: to,
      },
    });
  }
  return {
    status: result.ok ? "sent" : "failed",
    detail: result.packId ? `${result.message} · ${result.packId}` : result.message,
    balance: result.balance,
    kind: opts.kind,
    to,
    body: same ? body : messages.map((message) => message.text).join("\n"),
  };
}
