import { useState } from "react";
import { toast } from "sonner";
import { Btn, Field, fieldClass } from "@/components/como/bits";
import { formatWhen, tx } from "@/lib/format";
import { birthdaySoon, quietDays, tierOf } from "@/lib/loyalty";
import { smsCall } from "@/lib/sms.functions";
import { sendOut } from "@/lib/sms-send";
import { useCafe } from "@/lib/store";
import type { Tier } from "@/lib/types";

type Segment = "opt" | "quiet" | "birthday" | "inner";

export function Wire() {
  const settings = useCafe((state) => state.settings);
  const customers = useCafe((state) => state.customers);
  const logs = useCafe((state) => state.smsLogs);
  const credit = useCafe((state) => state.credit);
  const patchSettings = useCafe((state) => state.patchSettings);
  const logSms = useCafe((state) => state.logSms);
  const setCredit = useCafe((state) => state.setCredit);
  const lang = settings.lang;
  const [segment, setSegment] = useState<Segment>("quiet");
  const [draft, setDraft] = useState(
    lang === "fa"
      ? "{name} عزیز، چند وقتی است مکث نکردی. ساعت ۲ تا ۴ امتیازت در کومو دو برابر است."
      : "{name}, it has been a while. Points double at COMO between 2 and 4.",
  );
  const [templateId, setTemplateId] = useState("");
  const [paramName, setParamName] = useState("CODE");
  const [paramValue, setParamValue] = useState("1234");
  const [verifyMobile, setVerifyMobile] = useState("09120000001");
  const [busy, setBusy] = useState(false);

  const pool = customers.filter((guest) => {
    if (!guest.smsOptIn) return false;
    if (segment === "quiet") return quietDays(guest.lastVisit) >= 21;
    if (segment === "birthday") return birthdaySoon(guest.birthday);
    if (segment === "inner") return tierOf(guest.spent) === ("inner" satisfies Tier) || tierOf(guest.spent) === "como";
    return true;
  });

  const checkCredit = async () => {
    if (!settings.smsApiKey.trim()) {
      toast(tx(lang, "اول کلید را بگذار", "Add the API key first"));
      return;
    }
    setBusy(true);
    const result = await smsCall({ data: { op: "credit", apiKey: settings.smsApiKey.trim() } });
    setBusy(false);
    if (result.ok && result.balance !== null) {
      setCredit(result.balance);
      toast(tx(lang, `اعتبار ${result.balance}`, `Credit ${result.balance}`));
    } else {
      toast(result.message);
    }
  };

  const blast = async () => {
    setBusy(true);
    const outcome = await sendOut({
      apiKey: settings.smsApiKey,
      line: settings.smsLine,
      kind: segment === "birthday" ? "birthday" : "campaign",
      messages: pool.map((guest) => ({ mobile: guest.phone, text: draft.replaceAll("{name}", guest.name) })),
    });
    logSms({ to: outcome.to, body: outcome.body, kind: outcome.kind, status: outcome.status, detail: outcome.detail });
    setBusy(false);
    toast(outcome.status === "failed" ? outcome.detail : tx(lang, `${outcome.to.length} پیام ثبت شد`, `${outcome.to.length} kept`));
  };

  const verify = async () => {
    if (!settings.smsApiKey.trim()) {
      toast(tx(lang, "بدون کلید، الگو واقعاً نمی‌رود", "A template needs the API key"));
      return;
    }
    setBusy(true);
    const result = await smsCall({
      data: {
        op: "verify",
        apiKey: settings.smsApiKey.trim(),
        mobile: verifyMobile,
        templateId: Number(templateId),
        parameters: [{ name: paramName, value: paramValue }],
      },
    });
    logSms({
      to: [verifyMobile],
      body: `${paramName}=${paramValue}`,
      kind: "loyalty",
      status: result.ok ? "sent" : "failed",
      detail: result.message,
    });
    setBusy(false);
    toast(result.message);
  };

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-medium">{tx(lang, "پیامک", "SMS")}</h1>
      <p className="mt-2 text-sm text-ink-soft">
        {tx(
          lang,
          "ارسال از سرور میز به api.sms.ir می‌رود تا مرورگر گیر CORS نماند. هدر X-API-KEY است.",
          "The desk sends through its server to api.sms.ir so the browser is not blocked by CORS. The header is X-API-KEY.",
        )}
      </p>
      <ul className="mt-3 space-y-1 text-xs text-mute" dir="ltr">
        <li>GET /v1/credit</li>
        <li>POST /v1/send/bulk · lineNumber, messageText, mobiles</li>
        <li>POST /v1/send/likeTolike · lineNumber, messageTexts, mobiles</li>
        <li>POST /v1/send/verify · mobile, templateId, parameters</li>
      </ul>

      <div className="mt-4 grid gap-3 border border-line bg-sheet p-4 md:grid-cols-2">
        <Field label={tx(lang, "کلید API", "API key")}>
          <input
            dir="ltr"
            className={fieldClass}
            type="password"
            autoComplete="off"
            value={settings.smsApiKey}
            onChange={(event) => patchSettings({ smsApiKey: event.target.value })}
          />
        </Field>
        <Field label={tx(lang, "شماره خط", "Line number")}>
          <input
            dir="ltr"
            className={fieldClass}
            value={settings.smsLine}
            onChange={(event) => patchSettings({ smsLine: event.target.value })}
          />
        </Field>
        <div className="md:col-span-2 flex flex-wrap items-center gap-3">
          <Btn tone="line" disabled={busy} onClick={() => void checkCredit()}>
            {tx(lang, "اعتبار", "Credit")}
          </Btn>
          <span className="text-sm text-mute">
            {credit
              ? tx(lang, `${credit.value} تا ${formatWhen(credit.at, lang)}`, `${credit.value} at ${formatWhen(credit.at, lang)}`)
              : tx(lang, "هنوز پرسیده نشده", "Not checked")}
          </span>
        </div>
        <p className="text-xs text-mute md:col-span-2">
          {tx(
            lang,
            "بدون کلید، پیام‌ها در حالت تمرین در دفترچه می‌مانند و به SMS.ir نمی‌روند.",
            "With no key, messages stay in the practice log and never reach SMS.ir.",
          )}
        </p>
      </div>

      <h2 className="mt-8 text-lg font-medium">{tx(lang, "درگاه پارسیان (PEC)", "Parsian gateway (PEC)")}</h2>
      <p className="mt-1 text-xs text-mute">
        {tx(
          lang,
          "پرداخت‌های کارت به گیت‌وی پارسیان می‌روند: مبلغ هر تراکنش با درخواست Sale به pec.shaparak.ir فرستاده می‌شود و توکن پرداخت برمی‌گردد.",
          "Card payments go through the Parsian gateway: each transaction amount is sent to pec.shaparak.ir as a Sale request and a payment token comes back.",
        )}
      </p>
      <div className="mt-3 grid gap-3 border border-line bg-sheet p-4 md:grid-cols-2">
        <Field label={tx(lang, "کلید پارسیان (PIN)", "PEC PIN")}>
          <input
            dir="ltr"
            className={fieldClass}
            type="password"
            autoComplete="off"
            value={settings.pecPin}
            onChange={(event) => patchSettings({ pecPin: event.target.value })}
          />
        </Field>
        <Field label={tx(lang, "آدرس بازگشت", "Callback URL")}>
          <input
            dir="ltr"
            className={fieldClass}
            placeholder="https://…/confirmPayment"
            value={settings.pecCallbackUrl}
            onChange={(event) => patchSettings({ pecCallbackUrl: event.target.value })}
          />
        </Field>
        <p className="text-xs text-mute md:col-span-2">
          {tx(
            lang,
            "بدون PIN، پرداخت کارت مستقیم ثبت می‌شود و به شاپرک نمی‌رود. کلید از سرور میز ارسال می‌شود تا در بسته مرورگر نباشد.",
            "With no PIN, card charges register locally and never reach Shaparak. The PIN is sent from the desk server so it stays out of the browser bundle.",
          )}
        </p>
      </div>

      <h2 className="mt-8 text-lg font-medium">{tx(lang, "جمع", "A round")}</h2>
      <div className="mt-3 flex flex-wrap gap-1">
        {(
          [
            ["quiet", tx(lang, "خاموش ۲۱ روز", "Quiet 21 days")],
            ["birthday", tx(lang, "تولد این هفته", "Birthday week")],
            ["inner", tx(lang, "کومو و حلقه", "Como & inner")],
            ["opt", tx(lang, "همه مجازها", "Everyone opted in")],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setSegment(id)}
            className={`h-11 px-3 text-sm ${segment === id ? "bg-ink text-paper" : "border border-line"}`}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-mute">
        {pool.length} {tx(lang, "نفر · {name} اسم می‌شود", "people · {name} becomes the name")}
      </p>
      <textarea
        className="mt-2 h-28 w-full border border-line bg-sheet p-3 text-base outline-none focus:border-ink"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
      />
      <Btn className="mt-2" disabled={busy || pool.length === 0} onClick={() => void blast()}>
        {tx(lang, "بفرست", "Send")}
      </Btn>

      <h2 className="mt-8 text-lg font-medium">{tx(lang, "قالب تأیید", "Verify template")}</h2>
      <p className="mt-1 text-xs text-mute">
        {tx(lang, "شناسه قالب باید در پنل SMS.ir تأیید شده باشد. نام پارامتر همان نام داخل قالب است.", "The template id must already be approved in SMS.ir. The parameter name has to match the template.")}
      </p>
      <div className="mt-3 grid gap-2 md:grid-cols-2">
        <input dir="ltr" className={fieldClass} placeholder="templateId" value={templateId} onChange={(event) => setTemplateId(event.target.value)} />
        <input dir="ltr" className={fieldClass} placeholder="09" value={verifyMobile} onChange={(event) => setVerifyMobile(event.target.value)} />
        <input dir="ltr" className={fieldClass} value={paramName} onChange={(event) => setParamName(event.target.value)} />
        <input dir="ltr" className={fieldClass} value={paramValue} onChange={(event) => setParamValue(event.target.value)} />
      </div>
      <Btn className="mt-2" tone="line" disabled={busy} onClick={() => void verify()}>
        {tx(lang, "ارسال الگو", "Send template")}
      </Btn>

      <h2 className="mt-8 text-lg font-medium">{tx(lang, "دفترچه", "Log")}</h2>
      <ul className="mt-2 divide-y divide-line border-y border-line text-sm">
        {logs.length === 0 ? <li className="py-3 text-mute">{tx(lang, "هنوز پیامی نرفته.", "Nothing sent yet.")}</li> : null}
        {logs.map((entry) => (
          <li key={entry.id} className="py-3">
            <span className="text-xs text-mute">
              {formatWhen(entry.at, lang)} · {entry.status} · {entry.kind}
            </span>
            <p className="mt-1 whitespace-pre-wrap">{entry.body}</p>
            <p className="text-xs text-mute">{entry.detail}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
