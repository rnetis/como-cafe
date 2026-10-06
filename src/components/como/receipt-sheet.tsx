import { useState } from "react";
import { toast } from "sonner";
import { Btn } from "@/components/como/bits";
import {
  buildReceiptDoc,
  downloadBytes,
  printReceipt,
  receiptBytes,
  sendToPrinter,
  serialAvailable,
} from "@/lib/receipt";
import { sendOut } from "@/lib/sms-send";
import { tx } from "@/lib/format";
import { useCafe } from "@/lib/store";

export function ReceiptSheet() {
  const receiptId = useCafe((state) => state.receiptId);
  const openReceipt = useCafe((state) => state.openReceipt);
  const order = useCafe((state) => state.orders.find((entry) => entry.id === receiptId));
  const customer = useCafe((state) =>
    state.customers.find((entry) => entry.id === order?.customerId),
  );
  const settings = useCafe((state) => state.settings);
  const logSms = useCafe((state) => state.logSms);
  const [busy, setBusy] = useState(false);
  const lang = settings.lang;

  if (!order) return null;
  const doc = buildReceiptDoc(order, customer, settings);

  const sms = async () => {
    if (!customer) {
      toast(tx(lang, "این فیش مهمان ندارد", "This ticket has no guest"));
      return;
    }
    if (!customer.smsOptIn) {
      toast(tx(lang, "پیامک این مهمان خاموش است", "This guest opted out"));
      return;
    }
    setBusy(true);
    const lines = order.lines
      .map((line) => `${line.qty}× ${lang === "fa" ? line.nameFa : line.nameEn}`)
      .join("\n");
    const text = `COMO\n${doc.number}\n${lines}\n${doc.totalLabel}: ${doc.total}\n${doc.pause}\n${settings.instagram}`;
    const outcome = await sendOut({
      apiKey: settings.smsApiKey,
      line: settings.smsLine,
      kind: "receipt",
      messages: [{ mobile: customer.phone, text }],
    });
    logSms({ to: outcome.to, body: outcome.body, kind: "receipt", status: outcome.status, detail: outcome.detail });
    setBusy(false);
    toast(outcome.status === "failed" ? outcome.detail : tx(lang, "فیش برای پیامک ثبت شد", "Receipt queued"));
  };

  const serial = async () => {
    setBusy(true);
    try {
      const bytes = await receiptBytes(doc, settings.paper, order.pay === "cash");
      await sendToPrinter(bytes, settings.baud);
      toast(tx(lang, "به چاپگر حرارتی رفت", "Sent to the thermal printer"));
    } catch (error) {
      toast(error instanceof Error ? error.message : "printer");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center"
      onClick={() => openReceipt(null)}
    >
      <div
        className="flex max-h-screen w-full max-w-md flex-col bg-paper"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="min-h-0 flex-1 overflow-auto p-4">
          <article id="thermal-root" dir={doc.dir} className="mx-auto w-full max-w-xs border border-line bg-sheet px-4 py-5 text-ink">
          <h2 className="text-center font-display text-4xl tracking-widest">COMO</h2>
          <p className="mt-1 text-center text-xs tracking-widest text-mute">{doc.kicker}</p>
          <p className="mt-2 text-center text-sm">{doc.address}</p>
          {doc.phone ? <p className="text-center text-sm">{doc.phone}</p> : null}
          <p className="text-center text-sm text-mute">{doc.instagram}</p>
          <div className="my-3 border-t border-dashed border-ink" />
          <div className="flex items-center justify-between text-sm">
            <span>{doc.number}</span>
            <span>{doc.when}</span>
          </div>
          <div className="my-3 border-t border-dashed border-ink" />
          <ul className="space-y-2">
            {doc.lines.map((line) => (
              <li key={`${line.title}-${line.amount}`} className="flex items-start justify-between gap-3 text-sm">
                <span>
                  <span className="block font-medium">{line.title}</span>
                  <span className="text-xs text-mute">{line.sub}</span>
                </span>
                <span className="shrink-0">{line.amount}</span>
              </li>
            ))}
          </ul>
          <div className="my-3 border-t border-dashed border-ink" />
          <ul className="space-y-1 text-sm">
            {doc.rows.map((row) => (
              <li key={row.label} className="flex justify-between gap-3">
                <span className="text-mute">{row.label}</span>
                <span>{row.value}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 flex justify-between text-base font-medium">
            <span>{doc.totalLabel}</span>
            <span>{doc.total}</span>
          </p>
          <p className="mt-1 text-sm">{doc.pay}</p>
          {doc.note ? <p className="mt-2 text-sm text-ink-soft">{doc.note}</p> : null}
          <div className="my-3 border-t border-dashed border-ink" />
          <p className="text-sm">{doc.loyalty}</p>
          <p className="mt-3 text-center font-display text-lg italic">{doc.pause}</p>
          <p className="mt-2 text-center text-xs tracking-widest text-mute">EST. 2026</p>
        </article>
          {!serialAvailable() ? (
            <p className="mt-3 text-xs text-mute">
              {tx(
                lang,
                "چاپ سریال فقط در Chrome است. چاپ حرارتی از درایور سیستم همیشه‌کار است.",
                "Serial print is Chrome-only. The print button uses the system thermal driver.",
              )}
            </p>
          ) : (
            <p className="mt-3 text-xs text-mute">
              {tx(lang, "پرداخت نقد، پالس کشو را هم می‌فرستد.", "Cash also pulses the drawer.")}
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 border-t border-line p-3">
          <Btn onClick={() => printReceipt(doc, settings.paper)}>{tx(lang, "چاپ حرارتی", "Print")}</Btn>
          <Btn tone="line" disabled={busy || !serialAvailable()} onClick={() => void serial()}>
            {tx(lang, "پورت سریال", "Serial")}
          </Btn>
          <Btn
            tone="line"
            disabled={busy}
            onClick={() => {
              void receiptBytes(doc, settings.paper, order.pay === "cash").then((bytes) =>
                downloadBytes(bytes, `como-${order.number}.bin`),
              );
            }}
          >
            ESC/POS
          </Btn>
          <Btn tone="line" disabled={busy} onClick={() => void sms()}>
            {tx(lang, "پیامک فیش", "SMS")}
          </Btn>
          <Btn tone="ghost" className="col-span-2" onClick={() => openReceipt(null)}>
            {tx(lang, "بستن", "Close")}
          </Btn>
        </div>
      </div>
    </div>
  );
}
