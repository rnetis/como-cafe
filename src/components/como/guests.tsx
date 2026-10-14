import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Btn, fieldClass } from "@/components/como/bits";
import { cn } from "@/lib/cn";
import { formatCompact, formatToman, formatWhen, tx } from "@/lib/format";
import { birthdaySoon, daysUntilBirthday, quietDays, tierName, tierOf } from "@/lib/loyalty";
import { sendOut } from "@/lib/sms-send";
import { useCafe } from "@/lib/store";
import type { Customer } from "@/lib/types";

export function Guests() {
  const lang = useCafe((state) => state.settings.lang);
  const customers = useCafe((state) => state.customers);
  const addCustomer = useCafe((state) => state.addCustomer);
  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState<"all" | "quiet" | "birthday">("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftPhone, setDraftPhone] = useState("");
  const [draftBirthday, setDraftBirthday] = useState("");
  const guest = customers.find((entry) => entry.id === selected) ?? null;
  const q = query.trim();
  const list = customers.filter(
    (entry) =>
      (!q || entry.name.includes(q) || entry.phone.includes(q) || entry.referral.toLowerCase().includes(q.toLowerCase())) &&
      (segment === "all" || (segment === "quiet" ? quietDays(entry.lastVisit) >= 21 : birthdaySoon(entry.birthday))),
  );

  return (
    <div className="lg:flex lg:gap-6">
      <div className={cn("lg:w-80 lg:shrink-0", guest ? "hidden lg:block" : "")}>
        <h1 className="text-2xl font-medium">{tx(lang, "مهمان‌ها و مشتریان", "Guests & customers")}</h1>
        <div className="mt-3 grid grid-cols-3 gap-1 text-center text-xs">
          <div className="border border-line bg-sheet p-2"><strong className="block text-base">{customers.length}</strong>{tx(lang, "همه", "Customers")}</div>
          <div className="border border-line bg-sheet p-2"><strong className="block text-base">{customers.filter((entry) => quietDays(entry.lastVisit) >= 21).length}</strong>{tx(lang, "خاموش", "Quiet")}</div>
          <div className="border border-line bg-sheet p-2"><strong className="block text-base">{customers.filter((entry) => birthdaySoon(entry.birthday)).length}</strong>{tx(lang, "تولد", "Birthdays")}</div>
        </div>
        <p className="mt-2 text-sm text-mute">
          {tx(
            lang,
            "مهر ۸تایی تا سقف لاته سیروپ. امتیاز ۱۴ تا ۱۶ دو برابر. سطح از خرج عمر. تولد همین هفته یک هدیه.",
            "Eight stamps, capped at a syrup latte. Double points 14:00–16:00. Tiers follow lifetime spend. A birthday gift this week.",
          )}
        </p>
        <input
          className={`${fieldClass} mt-4`}
          placeholder={tx(lang, "نام یا شماره", "Name or mobile")}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="mt-2 grid grid-cols-3 border border-line">
          {(["all", "quiet", "birthday"] as const).map((item) => <button key={item} type="button" className={`h-10 text-xs ${segment === item ? "bg-ink text-paper" : "bg-sheet"}`} onClick={() => setSegment(item)}>{item === "all" ? tx(lang, "همه", "All") : item === "quiet" ? tx(lang, "خاموش", "Quiet") : tx(lang, "تولد", "Birthday")}</button>)}
        </div>
        <ul className="mt-3 divide-y divide-line border-y border-line">
          {list.map((entry) => {
            const quiet = quietDays(entry.lastVisit) >= 21;
            return (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => setSelected(entry.id)}
                  className="flex w-full items-start justify-between gap-2 py-3 text-start"
                >
                  <span>
                    <span className="block font-medium">{entry.name}</span>
                    <span className="text-xs text-mute" dir="ltr">
                      {entry.phone}
                    </span>
                  </span>
                  <span className="text-end text-xs">
                    <span className="block">{tierName(tierOf(entry.spent), lang)}</span>
                    {birthdaySoon(entry.birthday) ? (
                      <span className="text-stamp">{tx(lang, "تولد", "Birthday")}</span>
                    ) : null}
                    {quiet ? <span className="block text-warn">{tx(lang, "خاموش", "Quiet")}</span> : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <form
          className="mt-4 grid gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const result = addCustomer({ name: draftName, phone: draftPhone, birthday: draftBirthday, notes: "" });
            if (result === "bad" || result === "phone") {
              toast(
                result === "phone"
                  ? tx(lang, "این شماره هست", "That number exists")
                  : tx(lang, "شماره نادرست است", "Bad mobile"),
              );
              return;
            }
            setSelected(result);
            setDraftName("");
            setDraftPhone("");
            setDraftBirthday("");
          }}
        >
          <input
            className={fieldClass}
            placeholder={tx(lang, "نام", "Name")}
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
          />
          <input
            dir="ltr"
            className={fieldClass}
            placeholder="09"
            value={draftPhone}
            onChange={(event) => setDraftPhone(event.target.value)}
          />
          <input dir="ltr" type="date" className={fieldClass} aria-label={tx(lang, "تولد", "Birthday")} value={draftBirthday} onChange={(event) => setDraftBirthday(event.target.value)} />
          <Btn type="submit">{tx(lang, "مهمان تازه", "New guest")}</Btn>
        </form>
      </div>

      <div className={cn("min-w-0 flex-1", guest ? "" : "hidden lg:block")}>
        {guest ? (
          <Profile guest={guest} onBack={() => setSelected(null)} />
        ) : (
          <div className="border border-dashed border-line p-6">
            <p className="font-display text-2xl italic leading-snug">
              {tx(lang, "یک نفر را انتخاب کن تا مکثش را ببینی.", "Pick someone to see their pause.")}
            </p>
            <ul className="mt-4 space-y-2 text-sm text-ink-soft">
              <li>{tx(lang, "مهمان ۰ · آشنا ۵٪ از ۲ میلیون · کومو ۸٪ از ۸ · حلقه ۱۲٪ از ۲۰", "Guest 0 · Regular 5% after 2m · Como 8% after 8m · Inner 12% after 20m")}</li>
              <li>{tx(lang, "هر ۱۰ هزار تومان یک امتیاز. صد امتیاز پنجاه هزار تومان است.", "One point per 10,000 toman. One hundred points are 50,000 toman.")}</li>
              <li>{tx(lang, "کد معرفی C و چهار رقم آخر است. هر دو طرف ۵۰ امتیاز می‌گیرند.", "Referral code is C plus the last four digits. Both sides get 50 points.")}</li>
              <li>{tx(lang, "بیست‌ویک روز سکوت، برای پیام دلتنگی علامت می‌خورد.", "Twenty-one quiet days flags a win-back message.")}</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

function Profile({ guest, onBack }: { guest: Customer; onBack: () => void }) {
  const lang = useCafe((state) => state.settings.lang);
  const settings = useCafe((state) => state.settings);
  const menu = useCafe((state) => state.menu);
  const orders = useCafe((state) => state.orders);
  const patchCustomer = useCafe((state) => state.patchCustomer);
  const removeCustomer = useCafe((state) => state.removeCustomer);
  const addCustomerCredit = useCafe((state) => state.addCustomerCredit);
  // Select the stable array, then filter in the render body — an inline
  // `.filter()` would mint a fresh snapshot each read and loop React.
  const allCreditMoves = useCafe((state) => state.customerCreditMoves);
  const creditMoves = allCreditMoves.filter((move) => move.customerId === guest.id).slice(0, 8);
  const logSms = useCafe((state) => state.logSms);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(guest.name);
  const [phone, setPhone] = useState(guest.phone);
  const [birthday, setBirthday] = useState(guest.birthday);
  const [notes, setNotes] = useState(guest.notes);
  const [creditAmount, setCreditAmount] = useState(0);
  const [creditMethod, setCreditMethod] = useState<"cash" | "card" | "transfer">("cash");
  useEffect(() => { setName(guest.name); setPhone(guest.phone); setBirthday(guest.birthday); setNotes(guest.notes); }, [guest.id, guest.name, guest.phone, guest.birthday, guest.notes]);
  const favorite = menu.find((item) => item.id === guest.favoriteId);
  const history = orders.filter((order) => order.customerId === guest.id).slice(0, 6);
  const tier = tierOf(guest.spent);
  const days = daysUntilBirthday(guest.birthday);
  const quiet = quietDays(guest.lastVisit);

  const send = async (kind: "loyalty" | "birthday") => {
    const text =
      kind === "birthday"
        ? tx(
            lang,
            `${guest.name}، تولدت مبارک. این هفته در کومو یک نوشیدنی تا سقف لاته سیروپ مهمان توست.`,
            `${guest.name}, happy birthday. This week a drink up to a syrup latte is on COMO.`,
          )
        : tx(
            lang,
            `${guest.name} عزیز، ساعت ۲ تا ۴ امتیاز مکث در کومو دو برابر است.`,
            `${guest.name}, points double at COMO between 2 and 4.`,
          );
    const outcome = await sendOut({
      apiKey: settings.smsApiKey,
      line: settings.smsLine,
      kind,
      messages: [{ mobile: guest.phone, text }],
    });
    logSms({ to: outcome.to, body: outcome.body, kind, status: outcome.status, detail: outcome.detail });
    toast(outcome.status === "failed" ? outcome.detail : tx(lang, "پیام ثبت شد", "Message kept"));
  };

  return (
    <div>
      <button type="button" className="mb-3 text-sm text-mute lg:hidden" onClick={onBack}>
        {tx(lang, "بازگشت به فهرست", "Back to the list")}
      </button>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-medium">{name || guest.name}</h2>
          <p className="text-sm text-mute" dir="ltr">
            {phone || guest.phone} · {guest.referral}
          </p>
        </div>
        <p className="text-sm">
          {tierName(tier, lang)} · {formatCompact(guest.spent, lang)}
        </p>
      </div>
      <div className="mt-3 flex gap-2">
        {editing ? <>
          <Btn onClick={() => { if (!patchCustomer(guest.id, { name, phone, birthday, notes })) { toast(tx(lang, "نام یا شماره تکراری/نامعتبر است", "Name or phone is invalid or already used")); return; } setEditing(false); toast(tx(lang, "پرونده ذخیره شد", "Customer saved")); }}>{tx(lang, "ذخیره", "Save")}</Btn>
          <Btn tone="line" onClick={() => { setName(guest.name); setPhone(guest.phone); setBirthday(guest.birthday); setNotes(guest.notes); setEditing(false); }}>{tx(lang, "لغو", "Cancel")}</Btn>
        </> : <Btn tone="line" onClick={() => setEditing(true)}>{tx(lang, "ویرایش پرونده", "Edit profile")}</Btn>}
      </div>
      <div className="mt-4 flex gap-1">
        {Array.from({ length: settings.stampGoal }, (_, index) => (
          <span
            key={index}
            className={cn("size-4 border border-ink", index < Math.min(guest.stamps, settings.stampGoal) ? "bg-ink" : "bg-sheet")}
          />
        ))}
        {guest.stamps >= settings.stampGoal ? (
          <span className="ms-2 text-sm text-stamp">{tx(lang, "مهر آماده است", "Stamp is ready")}</span>
        ) : null}
      </div>
      <p className="mt-3 text-sm text-ink-soft">
        {guest.points} {tx(lang, "امتیاز", "points")} · {guest.visits} {tx(lang, "مراجعه", "visits")}
        {favorite ? ` · ${tx(lang, "معمول", "Usual")}: ${lang === "fa" ? favorite.nameFa : favorite.nameEn}` : ""}
        {days !== null && days <= 7 ? ` · ${tx(lang, `تولد تا ${days} روز`, `birthday in ${days}d`)}` : ""}
        {quiet >= 21 ? ` · ${tx(lang, `${quiet} روز خاموش`, `${quiet} quiet days`)}` : ""}
      </p>
      <section className="mt-4 border border-line bg-sheet p-4">
        <div className="flex items-center justify-between gap-3"><div><p className="text-xs text-mute">{tx(lang, "اعتبار پیش‌پرداخت مشتری", "Prepaid store credit")}</p><p className="mt-1 text-xl font-medium">{formatToman(guest.walletBalance, lang)}</p></div><span className="text-xs text-mute">{tx(lang, "قابل خرج در صندوق", "Available at checkout")}</span></div>
        <form className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr_auto]" onSubmit={(event) => { event.preventDefault(); if (!addCustomerCredit(guest.id, creditAmount, creditMethod, "")) { toast(tx(lang, "مبلغ اعتبار نامعتبر است", "Enter a valid credit amount")); return; } setCreditAmount(0); toast(tx(lang, "اعتبار ثبت شد", "Credit added")); }}>
          <input dir="ltr" aria-label={tx(lang, "مبلغ اعتبار", "Credit amount")} type="number" min="1" className={fieldClass} value={creditAmount || ""} onChange={(event) => setCreditAmount(Number(event.target.value))} placeholder={tx(lang, "مبلغ (تومان)", "Amount (toman)")} />
          <select className={fieldClass} value={creditMethod} onChange={(event) => setCreditMethod(event.target.value as typeof creditMethod)}><option value="cash">{tx(lang, "نقد", "Cash")}</option><option value="card">{tx(lang, "کارت", "Card")}</option><option value="transfer">{tx(lang, "انتقال", "Transfer")}</option></select>
          <Btn type="submit" disabled={creditAmount <= 0}>{tx(lang, "افزودن اعتبار", "Add credit")}</Btn>
        </form>
        <ul className="mt-3 divide-y divide-line border-t border-line text-xs">{creditMoves.map((move) => <li key={move.id} className="flex justify-between gap-3 py-2"><span>{move.kind === "sale" ? tx(lang, "خرید با اعتبار", "Paid with credit") : tx(lang, "شارژ اعتبار", "Credit top-up")} · {formatWhen(move.at, lang)}</span><strong className={move.amount < 0 ? "text-mute" : ""}>{move.amount < 0 ? "−" : "+"}{formatToman(Math.abs(move.amount), lang)}</strong></li>)}{creditMoves.length === 0 ? <li className="py-2 text-mute">{tx(lang, "گردش اعتباری ثبت نشده", "No credit activity yet")}</li> : null}</ul>
      </section>
      {editing ? <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <label className="text-xs text-mute">{tx(lang, "نام", "Name")}<input className={`${fieldClass} mt-1`} value={name} onChange={(event) => setName(event.target.value)} /></label>
        <label className="text-xs text-mute">{tx(lang, "شماره موبایل", "Mobile")}<input dir="ltr" className={`${fieldClass} mt-1`} value={phone} onChange={(event) => setPhone(event.target.value)} /></label>
        <label className="text-xs text-mute">
          {tx(lang, "تولد", "Birthday")}
          <input
            dir="ltr"
            type="date"
            className={`${fieldClass} mt-1`}
            value={birthday}
            onChange={(event) => setBirthday(event.target.value)}
          />
        </label>
        <label className="text-xs text-mute">{tx(lang, "یادداشت باریستا", "Barista note")}<textarea className={`${fieldClass} mt-1 h-24 py-3`} value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
        <label className="text-xs text-mute">
          {tx(lang, "امتیاز", "Points")}
          <input
            dir="ltr"
            type="number"
            className={`${fieldClass} mt-1`}
            value={guest.points}
            onChange={(event) => patchCustomer(guest.id, { points: Math.max(0, Number(event.target.value)) })}
          />
        </label>
      </div> : null}
      <label className="mt-3 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={guest.smsOptIn}
          onChange={(event) => patchCustomer(guest.id, { smsOptIn: event.target.checked })}
        />
        {tx(lang, "پیامک مجاز است", "SMS allowed")}
      </label>
      <div className="mt-4 flex flex-wrap gap-2">
        <Btn tone="line" disabled={!guest.smsOptIn} onClick={() => void send("loyalty")}>
          {tx(lang, "پیام ساعت آرام", "Slow-hour note")}
        </Btn>
        <Btn tone="stamp" disabled={!guest.smsOptIn || !birthdaySoon(guest.birthday)} onClick={() => void send("birthday")}>
          {tx(lang, "پیام تولد", "Birthday note")}
        </Btn>
        <Btn tone="ghost" onClick={() => { if (removeCustomer(guest.id)) onBack(); else toast(tx(lang, "این مشتری فیش دارد؛ پرونده برای حفظ سوابق حذف نمی‌شود.", "This customer has tickets; their profile is kept to preserve history.")); }}>
          {tx(lang, "حذف", "Remove")}
        </Btn>
      </div>
      <h3 className="mt-6 text-sm text-mute">{tx(lang, "آخرین فیش‌ها", "Recent tickets")}</h3>
      <ul className="mt-2 divide-y divide-line border-y border-line text-sm">
        {history.map((order) => (
          <li key={order.id} className="flex justify-between gap-3 py-2">
            <span>
              #{order.number}
              <span className="ms-2 text-xs text-mute">{formatWhen(order.at, lang)}</span>
            </span>
            <span>{formatCompact(order.total, lang)}</span>
          </li>
        ))}
        {history.length === 0 ? <li className="py-2 text-mute">{tx(lang, "هنوز فیشی نیست.", "No tickets yet.")}</li> : null}
      </ul>
    </div>
  );
}
