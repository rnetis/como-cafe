import { useMemo, useState } from "react";
import { Minus, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Btn, fieldClass } from "@/components/como/bits";
import { CATEGORIES, MODS } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import type { CheckoutError } from "@/lib/checkout";
import { formatMenu, formatToman, normPhone, tx, validPhone } from "@/lib/format";
import { birthdaySoon, inSlowHour, tierName, tierOf } from "@/lib/loyalty";
import { quote } from "@/lib/quote";
import { pecCall } from "@/lib/pec.functions";
import { posCall, type PosResult } from "@/lib/pos.functions";
import { buildReceiptDoc, printReceipt } from "@/lib/receipt";
import { sendOut } from "@/lib/sms-send";
import { useCafe } from "@/lib/store";
import type { Pay } from "@/lib/types";

type CartLine = { key: string; itemId: string; qty: number; mods: string[] };

const payOptions: { id: Pay; fa: string; en: string }[] = [
  { id: "cash", fa: "نقد", en: "Cash" },
  { id: "card", fa: "کارت", en: "Card" },
  { id: "online", fa: "آنلاین", en: "Online" },
  { id: "wallet", fa: "اعتبار مشتری", en: "Store credit" },
];

function errorText(code: CheckoutError, lang: "fa" | "en") {
  if (code === "empty") return tx(lang, "فیش خالی است", "Ticket is empty");
  if (code === "phone") return tx(lang, "شماره موبایل درست نیست", "That mobile is not valid");
  if (code === "stock")
    return tx(lang, "موجودی مواد کافی نیست", "Not enough ingredient stock for this order");
  if (code === "wallet") return tx(lang, "اعتبار مشتری کافی نیست", "Customer store credit is insufficient");
  return tx(lang, "یکی از آیتم‌ها تمام شده", "An item was 86’d");
}

export function Pos() {
  const lang = useCafe((state) => state.settings.lang);
  const menu = useCafe((state) => state.menu);
  const customers = useCafe((state) => state.customers);
  const settings = useCafe((state) => state.settings);
  const checkout = useCafe((state) => state.checkout);
  const openTicket = useCafe((state) => state.openTicket);
  const addCustomer = useCafe((state) => state.addCustomer);
  const openReceipt = useCafe((state) => state.openReceipt);
  const logSms = useCafe((state) => state.logSms);
  const stock = useCafe((state) => state.stock);

  const [cat, setCat] = useState<string>("hot-coffee");
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [pay, setPay] = useState<Pay>("card");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [referral, setReferral] = useState("");
  const [customerId, setCustomerId] = useState<string | undefined>();
  const [discount, setDiscount] = useState(0);
  const [useStamp, setUseStamp] = useState(false);
  const [useGift, setUseGift] = useState(false);
  const [points, setPoints] = useState(0);
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(false);
  const [sendToDevice, setSendToDevice] = useState(true);

  const guest = customers.find((entry) => entry.id === customerId);
  const normalized = normPhone(phone);
  const matches = phone.trim()
    ? customers
        .filter((entry) => entry.phone.includes(normalized) || entry.name.includes(phone.trim()))
        .slice(0, 4)
    : [];
  const known = customers.find((entry) => entry.phone === normalized);
  const walletCustomer = guest ?? known;
  const showNew = validPhone(phone) && !guest && !known;

  const q = query.trim().toLowerCase();
  const shown = menu.filter((item) => {
    if (!item.active) return false;
    if (q) return item.nameFa.includes(query.trim()) || item.nameEn.toLowerCase().includes(q);
    return cat === "all" || item.category === cat;
  });

  const preview = useMemo(() => {
    const lines = cart
      .map((line) => {
        const item = menu.find((entry) => entry.id === line.itemId);
        if (!item) return null;
        const mods = line.mods.map((id) => MODS.find((mod) => mod.id === id)).filter(Boolean);
        const unit = item.price + mods.reduce((sum, mod) => sum + (mod?.price ?? 0), 0);
        return { ...line, item, unit };
      })
      .filter((line): line is NonNullable<typeof line> => Boolean(line));
    const subtotal = lines.reduce((sum, line) => sum + line.unit * line.qty, 0);
    const cheapest = lines.reduce((min, line) => Math.min(min, line.unit), subtotal || 0);
    return {
      lines,
      subtotal,
      ...quote({
        subtotal,
        cheapest,
        discountPct: discount,
        useStamp,
        useGift,
        redeemPoints: points,
        customer: guest,
        settings,
      }),
    };
  }, [cart, menu, discount, useStamp, useGift, guest, settings, points]);

  const add = (itemId: string) => {
    setCart((current) => {
      const found = current.find((line) => line.itemId === itemId && line.mods.length === 0);
      if (found)
        return current.map((line) =>
          line.key === found.key ? { ...line, qty: line.qty + 1 } : line,
        );
      return [...current, { key: `${itemId}-${Date.now()}`, itemId, qty: 1, mods: [] }];
    });
    setOpen(true);
  };

  /** Empty the register panel — the cart is settled, one way or another. */
  const clearTicket = () => {
    setCart([]);
    setPhone("");
    setName("");
    setReferral("");
    setCustomerId(undefined);
    setDiscount(0);
    setUseStamp(false);
    setUseGift(false);
    setPoints(0);
    setNote("");
    setOpen(false);
  };

  /**
   * Keep the cart as an open ticket: nothing is consumed, charged or earned
   * yet. It keeps its number and waits in Tickets until a cashier closes it —
   * closing runs the register's own rules over these same lines.
   */
  const hold = () => {
    const lines = cart.map((line) => ({ itemId: line.itemId, qty: line.qty, mods: line.mods }));
    if (lines.length === 0) return;
    let customerId = guest?.id;
    if (!customerId && showNew) {
      // The number is real data — keep the guest, the tab stays theirs.
      const created = addCustomer({ name: name.trim(), phone, birthday: "", notes: "" });
      if (created !== "phone" && created !== "bad") customerId = created;
    }
    const result = openTicket({
      lines,
      customerId,
      guestName: showNew ? name.trim() || undefined : undefined,
      note,
    });
    if (!result.ok) {
      toast(tx(lang, "فیش خالی است یا آیتمی تمام شده", "The ticket is empty or an item was 86’d"));
      return;
    }
    clearTicket();
    toast(tx(lang, `فیش ${result.order.number} باز شد`, `Ticket ${result.order.number} is open`));
  };

  const charge = async () => {
    const result = checkout({
      lines: cart.map((line) => ({ itemId: line.itemId, qty: line.qty, mods: line.mods })),
      pay,
      note,
      customerId: guest?.id,
      newName: showNew ? name : undefined,
      newPhone: showNew ? phone : known && !guest ? known.phone : undefined,
      referralCode: showNew ? referral : undefined,
      discountPct: discount,
      useStamp,
      useGift,
      redeemPoints: points,
    });
    if (!result.ok) {
      toast(errorText(result.error, lang));
      return;
    }
    if (result.warnings.length) {
      const names = result.warnings
        .map((sku) => stock.find((item) => item.sku === sku))
        .map((item) => (item ? (lang === "fa" ? item.nameFa : item.nameEn) : ""))
        .filter(Boolean)
        .join(tx(lang, "، ", ", "));
      toast(tx(lang, `موجودی منفی شد: ${names}`, `Stock went negative: ${names}`));
    }
    const fresh = useCafe.getState();
    const placed = fresh.orders.find((order) => order.id === result.order.id) ?? result.order;
    const person = fresh.customers.find((entry) => entry.id === placed.customerId);

    // «ارسال به دستگاه»: push the ticket amount to the physical PEC terminal
    // over the PCPOS protocol (LAN TCP or serial), then only finish the close
    // when the device answers 00. Failure keeps the just-placed ticket visible
    // so the operator can retry or void it on the terminal itself.
    if (sendToDevice) {
      const device =
        fresh.settings.posType === "LAN"
          ? { ip: fresh.settings.posIp.trim(), port: fresh.settings.posPort }
          : { comPort: fresh.settings.posComPort.trim() };
      const sent: PosResult = await posCall({
        data: {
          op: "pay",
          amount: placed.total,
          type: fresh.settings.posType,
          ...device,
          merchantTitle: `COMO ${placed.number}`.slice(0, 40),
        },
      });
      if (!sent.ok || sent.responseCode !== "00") {
        toast(
          tx(
            lang,
            `دستگاه پاسخ نداد یا خطا داشت: ${sent.message}`,
            `Device did not accept the charge: ${sent.message}`,
          ),
        );
        return;
      }
      const d = sent.data ?? {};
      toast(
        tx(
          lang,
          `دستگاه تأیید کرد · کد ${d.responseCode ?? "00"} · پیگیری ${d.traceId ?? "—"} · شاپرک ${d.rrn ?? "—"}`,
          `Device approved · code ${d.responseCode ?? "00"} · trace ${d.traceId ?? "—"} · RRN ${d.rrn ?? "—"}`,
        ),
      );
    }

    // Card charges otherwise go through the Parsian gateway when a PEC PIN is
    // set: the
    // transaction amount is sent as a Sale request (order number as OrderId),
    // then the returned token is settled with a confirm call. No PIN → local
    // card entry, exactly like before.
    if (pay === "card" && fresh.settings.pecPin.trim()) {
      if (!/^https?:\/\//i.test(fresh.settings.pecCallbackUrl.trim())) {
        toast(tx(lang, "آدرس بازگشت درگاه را در تنظیمات بگذار", "Set the gateway callback URL in settings"));
        return;
      }
      const sale = await pecCall({
        data: {
          op: "pay",
          pin: fresh.settings.pecPin.trim(),
          amount: placed.total,
          orderId: placed.number,
          callBackUrl: fresh.settings.pecCallbackUrl.trim(),
          additionalData: `COMO ticket ${placed.number}`.slice(0, 255),
        },
      });
      if (!sale.ok || sale.token == null) {
        toast(tx(lang, `پرداخت پارسیان ناموفق: ${sale.message}`, `Parsian payment failed: ${sale.message}`));
        return;
      }
      toast(tx(lang, "مبلغ به درگاه پارسیان ارسال شد", "Amount sent to the Parsian gateway"));
      const confirm = await pecCall({
        data: { op: "confirm", pin: fresh.settings.pecPin.trim(), token: sale.token },
      });
      if (!confirm.ok) {
        toast(
          tx(
            lang,
            `تسویه توکن ${sale.token} ناموفق: ${confirm.message}`,
            `Settling token ${sale.token} failed: ${confirm.message}`,
          ),
        );
        // Keep the ticket open so the operator can retry or reverse the token.
        return;
      }
      toast(tx(lang, `تراکنش ${placed.number} در پارسیان تأیید شد`, `Ticket ${placed.number} confirmed with Parsian`));
    }

    openReceipt(placed.id);
    if (fresh.settings.autoPrint) {
      printReceipt(buildReceiptDoc(placed, person, fresh.settings), fresh.settings.paper);
    }
    if (fresh.settings.autoSms && person?.smsOptIn) {
      const doc = buildReceiptDoc(placed, person, fresh.settings);
      const text = `COMO\n${doc.number}\n${doc.totalLabel}: ${doc.total}\n${doc.pause}`;
      const outcome = await sendOut({
        apiKey: fresh.settings.smsApiKey,
        line: fresh.settings.smsLine,
        kind: "receipt",
        messages: [{ mobile: person.phone, text }],
      });
      logSms({
        to: outcome.to,
        body: outcome.body,
        kind: "receipt",
        status: outcome.status,
        detail: outcome.detail,
      });
    }
    clearTicket();
    toast(tx(lang, `فیش ${placed.number} بسته شد`, `Ticket ${placed.number} closed`));
  };

  const favorite = guest?.favoriteId
    ? menu.find((item) => item.id === guest.favoriteId && item.active)
    : undefined;
  const slow = inSlowHour(Date.now(), settings.slowStart, settings.slowEnd);

  const ticket = (
    <div className="flex h-full flex-col">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-medium">{tx(lang, "فیش", "Ticket")}</h2>
        <span className="text-xs text-mute">
          {preview.lines.reduce((sum, line) => sum + line.qty, 0)}
        </span>
      </div>
      <label className="mt-3 block">
        <span className="sr-only">{tx(lang, "شماره مهمان", "Guest mobile")}</span>
        <input
          dir="ltr"
          className={fieldClass}
          inputMode="tel"
          placeholder="09…"
          value={phone}
          onChange={(event) => {
            setPhone(event.target.value);
            setCustomerId(undefined);
          }}
        />
      </label>
      {matches.length > 0 && !guest ? (
        <ul className="mt-2 border border-line bg-sheet">
          {matches.map((entry) => (
            <li key={entry.id}>
              <button
                type="button"
                className="flex h-12 w-full items-center justify-between px-3 text-sm"
                onClick={() => {
                  setCustomerId(entry.id);
                  setPhone(entry.phone);
                  setUseStamp(false);
                  setPoints(0);
                }}
              >
                <span>{entry.name}</span>
                <span className="text-mute" dir="ltr">
                  {entry.phone}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {guest ? (
        <div className="mt-3 border border-line bg-sheet p-3 text-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium">{guest.name}</p>
              <p className="text-xs text-mute">
                {tierName(tierOf(guest.spent), lang)} · {guest.points} {tx(lang, "امتیاز", "pts")} ·{" "}
                {tx(lang, "مهر", "stamps")} {guest.stamps}/{settings.stampGoal}
              </p>
            </div>
            <button
              type="button"
              className="text-xs text-mute"
              onClick={() => setCustomerId(undefined)}
            >
              {tx(lang, "جدا کن", "Detach")}
            </button>
          </div>
          {favorite ? (
            <button
              type="button"
              className="mt-2 text-sm text-stamp"
              onClick={() => add(favorite.id)}
            >
              {tx(lang, "معمولش", "Usual")}: {lang === "fa" ? favorite.nameFa : favorite.nameEn}
            </button>
          ) : null}
          {guest.notes ? <p className="mt-2 text-xs text-ink-soft">{guest.notes}</p> : null}
        </div>
      ) : null}
      {showNew ? (
        <div className="mt-3 grid gap-2">
          <input
            className={fieldClass}
            placeholder={tx(lang, "نام مهمان جدید", "New guest name")}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <input
            className={fieldClass}
            dir="ltr"
            placeholder={tx(lang, "کد معرفی", "Referral code")}
            value={referral}
            onChange={(event) => setReferral(event.target.value)}
          />
        </div>
      ) : null}
      <ul className="mt-3 flex-1 space-y-3 overflow-auto">
        {preview.lines.length === 0 ? (
          <li className="border border-dashed border-line p-4 font-display text-lg italic leading-snug">
            {tx(lang, "یک مکث خالی. چیزی انتخاب کن.", "An empty pause. Add a drink.")}
          </li>
        ) : (
          preview.lines.map((line) => (
            <li key={line.key} className="border-b border-line pb-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {lang === "fa" ? line.item.nameFa : line.item.nameEn}
                  </p>
                  <p className="text-xs text-mute">{formatToman(line.unit, lang)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="flex size-11 items-center justify-center border border-line"
                    onClick={() =>
                      setCart((current) =>
                        current.flatMap((entry) =>
                          entry.key !== line.key
                            ? entry
                            : entry.qty <= 1
                              ? []
                              : [{ ...entry, qty: entry.qty - 1 }],
                        ),
                      )
                    }
                    aria-label="-"
                  >
                    <Minus className="size-4" />
                  </button>
                  <span className="w-6 text-center text-sm">{line.qty}</span>
                  <button
                    type="button"
                    className="flex size-11 items-center justify-center border border-line"
                    onClick={() =>
                      setCart((current) =>
                        current.map((entry) =>
                          entry.key === line.key ? { ...entry, qty: entry.qty + 1 } : entry,
                        ),
                      )
                    }
                    aria-label="+"
                  >
                    <Plus className="size-4" />
                  </button>
                  <button
                    type="button"
                    className="flex size-11 items-center justify-center"
                    onClick={() =>
                      setCart((current) => current.filter((entry) => entry.key !== line.key))
                    }
                    aria-label={tx(lang, "حذف", "Remove")}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {MODS.map((mod) => {
                  const on = line.mods.includes(mod.id);
                  return (
                    <button
                      key={mod.id}
                      type="button"
                      onClick={() =>
                        setCart((current) =>
                          current.map((entry) =>
                            entry.key === line.key
                              ? {
                                  ...entry,
                                  mods: on
                                    ? entry.mods.filter((id) => id !== mod.id)
                                    : [...entry.mods, mod.id],
                                }
                              : entry,
                          ),
                        )
                      }
                      className={cn(
                        "h-9 px-2 text-xs",
                        on ? "bg-ink text-paper" : "border border-line",
                      )}
                    >
                      {lang === "fa" ? mod.nameFa : mod.nameEn}
                    </button>
                  );
                })}
              </div>
            </li>
          ))
        )}
      </ul>
      <div className="mt-3 space-y-2 border-t border-line pt-3 text-sm">
        {slow ? (
          <p className="text-xs">
            {tx(lang, "ساعت آرام: امتیاز این فیش دو برابر است.", "Slow hour: points double.")}
          </p>
        ) : null}
        <div className="flex items-center justify-between gap-3">
          <span className="text-mute">{tx(lang, "تخفیف ٪", "Discount %")}</span>
          <input
            dir="ltr"
            type="number"
            min={0}
            max={100}
            className="h-11 w-20 border border-line bg-sheet px-2 text-center"
            value={discount}
            onChange={(event) => setDiscount(Number(event.target.value))}
          />
        </div>
        {guest && guest.stamps >= settings.stampGoal ? (
          <Toggle
            on={useStamp}
            onClick={() => setUseStamp((value) => !value)}
            label={tx(lang, "مهر رایگان", "Free stamp")}
          />
        ) : null}
        {guest && birthdaySoon(guest.birthday) && guest.giftYear !== new Date().getFullYear() ? (
          <Toggle
            on={useGift}
            onClick={() => setUseGift((value) => !value)}
            label={tx(lang, "هدیه تولد", "Birthday gift")}
          />
        ) : null}
        {guest && guest.points > 0 ? (
          <div className="flex items-center justify-between">
            <span>{tx(lang, "خرج امتیاز", "Redeem")}</span>
            <span className="flex items-center gap-2">
              <button
                type="button"
                className="size-11 border border-line"
                onClick={() => setPoints((value) => Math.max(0, value - 50))}
              >
                -
              </button>
              <span className="w-10 text-center">{Math.min(points, guest.points)}</span>
              <button
                type="button"
                className="size-11 border border-line"
                onClick={() => setPoints((value) => Math.min(guest.points, value + 50))}
              >
                +
              </button>
            </span>
          </div>
        ) : null}
        <input
          className={fieldClass}
          placeholder={tx(lang, "یادداشت فیش", "Ticket note")}
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
        <div className="flex justify-between text-base font-medium">
          <span>{tx(lang, "قابل پرداخت", "Due")}</span>
          <span>{formatToman(preview.total, lang)}</span>
        </div>
        {pay === "wallet" && walletCustomer ? <p className="text-xs text-mute">{tx(lang, "اعتبار موجود", "Available credit")}: {formatToman(walletCustomer.walletBalance, lang)}</p> : null}
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
          {payOptions.filter((option) => option.id !== "wallet" || Boolean(guest || known)).map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setPay(option.id)}
              className={cn(
                "h-11 text-sm",
                pay === option.id ? "bg-ink text-paper" : "border border-line",
              )}
            >
              {tx(lang, option.fa, option.en)}
            </button>
          ))}
        </div>
        {pay === "card" || pay === "online" ? (
          <button
            type="button"
            onClick={() => setSendToDevice((value) => !value)}
            className={cn(
              "h-11 w-full text-sm",
              sendToDevice ? "bg-stamp text-paper" : "border border-line",
            )}
          >
            {tx(
              lang,
              `ارسال به دستگاه ← ${settings.posType === "LAN" ? `${settings.posIp || "؟"}:${settings.posPort}` : settings.posComPort || "؟"}`,
              `Send to device ← ${settings.posType === "LAN" ? `${settings.posIp || "?"}:${settings.posPort}` : settings.posComPort || "?"}`,
            )}
          </button>
        ) : null}
        <Btn tone="line" className="w-full" disabled={preview.lines.length === 0} onClick={hold}>
          {tx(lang, "نگه‌داشتن به‌عنوان فیش باز", "Hold as an open ticket")}
        </Btn>
        <Btn className="w-full" disabled={preview.lines.length === 0 || (pay === "wallet" && (!walletCustomer || walletCustomer.walletBalance < preview.total))} onClick={() => void charge()}>
          {pay === "card" || pay === "online" ? (sendToDevice ? tx(lang, "بستن فیش و ارسال مبلغ به دستگاه", "Close ticket & send amount to device") : tx(lang, "بستن فیش", "Close ticket")) : tx(lang, "بستن فیش", "Close ticket")}
        </Btn>
      </div>
    </div>
  );

  return (
    <div className="lg:flex lg:gap-6">
      <div className="min-w-0 flex-1">
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-3.5 size-4 text-mute" />
          <input
            className={cn(fieldClass, "ps-10")}
            placeholder={tx(lang, "جست‌وجوی منو", "Search the menu")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          <CatButton
            active={!q && cat === "all"}
            onClick={() => {
              setCat("all");
              setQuery("");
            }}
            label={tx(lang, "همه", "All")}
          />
          {CATEGORIES.map((category) => (
            <CatButton
              key={category.id}
              active={!q && cat === category.id}
              onClick={() => {
                setCat(category.id);
                setQuery("");
              }}
              label={tx(lang, category.fa, category.en)}
            />
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4">
          {shown.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => add(item.id)}
              className="flex min-h-28 flex-col border border-line bg-sheet p-3 text-start transition-colors duration-200 hover:border-ink"
            >
              <span className="text-xs text-mute">{lang === "fa" ? item.nameEn : item.nameFa}</span>
              <span className="mt-1 text-base font-medium leading-snug">
                {lang === "fa" ? item.nameFa : item.nameEn}
              </span>
              <span className="mt-auto pt-3 text-stamp">
                {formatMenu(item.price, lang)}
                <span className="ms-1 text-xs text-mute">{tx(lang, "هزار", "k")}</span>
              </span>
            </button>
          ))}
        </div>
        {cart.length > 0 ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="fixed inset-x-4 bottom-20 z-30 flex h-14 items-center justify-between bg-ink px-4 text-paper lg:hidden"
          >
            <span>
              {preview.lines.reduce((sum, line) => sum + line.qty, 0)} {tx(lang, "قلم", "items")}
            </span>
            <span>{formatToman(preview.total, lang)}</span>
          </button>
        ) : null}
      </div>
      <aside className="mt-6 hidden w-96 shrink-0 border border-line bg-sheet p-4 lg:block">
        {ticket}
      </aside>
      {open ? (
        <div className="fixed inset-0 z-40 flex flex-col bg-paper lg:hidden">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="text-sm font-medium">{tx(lang, "فیش", "Ticket")}</p>
            <button
              type="button"
              className="h-11 px-3 text-sm text-mute"
              onClick={() => setOpen(false)}
            >
              {tx(lang, "منو", "Menu")}
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-auto px-4 pb-24">{ticket}</div>
        </div>
      ) : null}
    </div>
  );
}

function CatButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-11 shrink-0 border-b-2 px-2 text-sm",
        active ? "border-ink text-ink" : "border-transparent text-mute",
      )}
    >
      {label}
    </button>
  );
}

function Toggle({ on, onClick, label }: { on: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("h-11 w-full text-sm", on ? "bg-stamp text-paper" : "border border-line")}
    >
      {label}
    </button>
  );
}
