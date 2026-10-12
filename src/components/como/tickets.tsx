import { useMemo, useState } from "react";
import { Minus, Plus, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Btn, Field, fieldClass } from "@/components/como/bits";
import { CATEGORIES, MODS } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import type { CheckoutError } from "@/lib/checkout";
import { formatCompact, formatToman, formatWhen, normPhone, tx } from "@/lib/format";
import { birthdaySoon, tierName, tierOf } from "@/lib/loyalty";
import { quote } from "@/lib/quote";
import { buildReceiptDoc, printReceipt } from "@/lib/receipt";
import { useCafe } from "@/lib/store";
import type { Lang, Order, Pay } from "@/lib/types";

type Filter = "open" | "all" | "closed";
type DraftLine = { itemId: string; qty: number; mods: string[] };

const PAY_LABEL: Record<Pay, { fa: string; en: string }> = {
  cash: { fa: "نقد", en: "Cash" },
  card: { fa: "کارت", en: "Card" },
  online: { fa: "آنلاین", en: "Online" },
  wallet: { fa: "اعتبار", en: "Credit" },
};

function errorText(code: CheckoutError | "missing" | "locked", lang: Lang) {
  if (code === "empty") return tx(lang, "فیش خالی است", "Ticket is empty");
  if (code === "phone") return tx(lang, "شماره موبایل درست نیست", "That mobile is not valid");
  if (code === "stock")
    return tx(lang, "موجودی مواد کافی نیست", "Not enough ingredient stock for this ticket");
  if (code === "wallet") return tx(lang, "اعتبار مشتری کافی نیست", "Customer store credit is insufficient");
  if (code === "locked") return tx(lang, "این فیش بسته شده است", "This ticket is already closed");
  if (code === "missing") return tx(lang, "این فیش پیدا نشد", "That ticket is gone");
  return tx(lang, "یکی از آیتم‌ها تمام شده", "An item was 86’d");
}

/** How long a tab has been sitting open, in the shortest honest form. */
function ageLabel(from: number, lang: Lang) {
  const minutes = Math.max(0, Math.round((Date.now() - from) / 60_000));
  if (minutes < 60) return tx(lang, `${minutes} دقیقه باز`, `open ${minutes}m`);
  const hours = Math.floor(minutes / 60);
  return tx(lang, `${hours} ساعت ${minutes % 60} دقیقه باز`, `open ${hours}h ${minutes % 60}m`);
}

export function Tickets() {
  const lang = useCafe((state) => state.settings.lang);
  const orders = useCafe((state) => state.orders);
  const customers = useCafe((state) => state.customers);
  const openReceipt = useCafe((state) => state.openReceipt);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [editId, setEditId] = useState<string | null>(null);
  const [closeId, setCloseId] = useState<string | null>(null);

  const editing = editId ? orders.find((order) => order.id === editId && order.status === "open") : undefined;
  const closing = closeId ? orders.find((order) => order.id === closeId && order.status === "open") : undefined;

  const q = query.trim().toLowerCase();
  const matches = (order: Order) => {
    if (!q) return true;
    const guest = customers.find((entry) => entry.id === order.customerId);
    return (
      String(order.number).includes(q) ||
      (order.guestName ?? "").toLowerCase().includes(q) ||
      (guest?.name.toLowerCase().includes(q) ?? false) ||
      order.lines.some(
        (line) => line.nameFa.includes(query.trim()) || line.nameEn.toLowerCase().includes(q),
      )
    );
  };

  const open = orders.filter((order) => order.status === "open" && matches(order));
  const closed = orders.filter((order) => order.status === "closed" && matches(order));
  const list = filter === "open" ? open : filter === "closed" ? closed : [...open, ...closed];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium">{tx(lang, "فیش‌ها", "Tickets")}</h1>
          <p className="mt-1 max-w-xl text-sm text-mute">
            {tx(
              lang,
              "هر فیش تا بسته نشود باز می‌ماند: قلم اضافه و کم کن، مهمان را بچسبان، و سر پرداخت ببند. تا آن لحظه نه از انبار کم می‌شود نه به دفتر می‌رود.",
              "A ticket stays open until it is closed: add or pull lines, attach the guest, then settle it. Until that moment nothing leaves the cellar and nothing reaches the books.",
            )}
          </p>
        </div>
        <Btn onClick={() => setEditId("")}>{tx(lang, "فیش تازه", "New ticket")}</Btn>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          className={cn(fieldClass, "max-w-xs")}
          placeholder={tx(lang, "شماره، نام، نوشیدنی", "Number, name, drink")}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <div className="flex border border-line">
          {(["open", "all", "closed"] as Filter[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={cn("h-12 px-3 text-sm", filter === id ? "bg-ink text-paper" : "bg-sheet text-ink")}
            >
              {id === "open"
                ? tx(lang, `باز (${open.length})`, `Open (${open.length})`)
                : id === "closed"
                  ? tx(lang, "بسته", "Closed")
                  : tx(lang, "همه", "All")}
            </button>
          ))}
        </div>
      </div>

      <ul className="mt-4 divide-y divide-line border-y border-line">
        {list.slice(0, 80).map((order) => {
          const guest = customers.find((entry) => entry.id === order.customerId);
          const who = order.guestName ?? guest?.name ?? "";
          const summary = order.lines
            .map((line) => `${line.qty}× ${lang === "fa" ? line.nameFa : line.nameEn}`)
            .join(tx(lang, "، ", ", "));
          const isOpen = order.status === "open";
          return (
            <li key={order.id} className="flex items-stretch gap-1">
              <button
                type="button"
                onClick={() => (isOpen ? setEditId(order.id) : openReceipt(order.id))}
                className="min-w-0 flex-1 py-3 text-start"
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="font-medium">
                    #{order.number}
                    {isOpen ? (
                      <span className="ms-2 border border-stamp px-1.5 py-0.5 text-xs text-stamp">
                        {tx(lang, "باز", "open")}
                      </span>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-sm">{formatToman(order.total, lang)}</span>
                </span>
                <span className="mt-0.5 block text-xs text-mute">
                  {isOpen
                    ? `${formatWhen(order.at, lang)} · ${ageLabel(order.at, lang)}`
                    : `${formatWhen(order.closedAt ?? order.at, lang)} · ${
                        PAY_LABEL[order.pay][lang === "fa" ? "fa" : "en"]
                      }`}
                  {who ? ` · ${who}` : ""}
                  {order.note ? ` · ${order.note}` : ""}
                </span>
                <span className="mt-1 block text-sm text-ink-soft">
                  {summary || tx(lang, "هنوز چیزی روی این فیش نیست", "Nothing on this ticket yet")}
                </span>
              </button>
              {isOpen ? (
                <>
                  <button
                    type="button"
                    className="w-16 border-s border-line text-sm"
                    onClick={() => setEditId(order.id)}
                  >
                    {tx(lang, "ویرایش", "Edit")}
                  </button>
                  <button
                    type="button"
                    className="w-16 border-s border-line bg-ink text-sm text-paper"
                    onClick={() => setCloseId(order.id)}
                  >
                    {tx(lang, "بستن", "Close")}
                  </button>
                </>
              ) : null}
            </li>
          );
        })}
        {list.length === 0 ? (
          <li className="py-4 text-sm text-mute">
            {filter === "open"
              ? tx(lang, "فیش بازی نیست.", "No open tickets.")
              : tx(lang, "چیزی پیدا نشد.", "Nothing found.")}
          </li>
        ) : null}
      </ul>

      {editId !== null ? (
        <TicketSheet
          key={editing?.id ?? "new"}
          lang={lang}
          order={editing}
          onClose={() => setEditId(null)}
          onCreated={(id) => setEditId(id)}
          onCloseTicket={(id) => {
            setEditId(null);
            setCloseId(id);
          }}
        />
      ) : null}

      {closing ? (
        <CloseSheet
          key={closing.id}
          lang={lang}
          order={closing}
          onClose={() => setCloseId(null)}
          onClosed={() => {
            openReceipt(closing.id);
            setCloseId(null);
          }}
        />
      ) : null}
    </div>
  );
}

/** Open a new ticket or edit a running one: lines, mods, guest, note. */
function TicketSheet({
  lang,
  order,
  onClose,
  onCreated,
  onCloseTicket,
}: {
  lang: Lang;
  order?: Order;
  onClose: () => void;
  onCreated: (id: string) => void;
  onCloseTicket: (id: string) => void;
}) {
  const menu = useCafe((state) => state.menu);
  const customers = useCafe((state) => state.customers);
  const settings = useCafe((state) => state.settings);
  const openTicket = useCafe((state) => state.openTicket);
  const patchTicket = useCafe((state) => state.patchTicket);
  const deleteTicket = useCafe((state) => state.deleteTicket);

  const [lines, setLines] = useState<DraftLine[]>(() =>
    order
      ? order.lines.map((line) => ({
          itemId: line.itemId,
          qty: line.qty,
          mods: line.mods.map((mod) => mod.id),
        }))
      : [],
  );
  const [customerId, setCustomerId] = useState<string | undefined>(order?.customerId);
  const [guestName, setGuestName] = useState(order?.guestName ?? "");
  const [note, setNote] = useState(order?.note ?? "");
  const [find, setFind] = useState("");
  const [cat, setCat] = useState<string>("hot-coffee");
  const [phone, setPhone] = useState("");
  const [arm, setArm] = useState(false);

  const guest = customers.find((entry) => entry.id === customerId);
  const normalized = normPhone(phone);
  const matches = phone.trim()
    ? customers
        .filter((entry) => entry.phone.includes(normalized) || entry.name.includes(phone.trim()))
        .slice(0, 4)
    : [];

  const q = find.trim().toLowerCase();
  const shown = menu.filter((item) => {
    if (!item.active) return false;
    if (q) return item.nameFa.includes(find.trim()) || item.nameEn.toLowerCase().includes(q);
    return cat === "all" || item.category === cat;
  });

  const priced = useMemo(() => {
    const rows = lines
      .map((line) => {
        const item = menu.find((entry) => entry.id === line.itemId);
        if (!item) return null;
        const mods = line.mods
          .map((id) => MODS.find((mod) => mod.id === id))
          .filter((mod): mod is (typeof MODS)[number] => Boolean(mod));
        return {
          ...line,
          item,
          mods,
          unit: item.price + mods.reduce((sum, mod) => sum + mod.price, 0),
        };
      })
      .filter((row): row is NonNullable<typeof row> => Boolean(row));
    return { rows, subtotal: rows.reduce((sum, row) => sum + row.unit * row.qty, 0) };
  }, [lines, menu]);

  const addItem = (itemId: string) =>
    setLines((current) => {
      const found = current.find((line) => line.itemId === itemId && line.mods.length === 0);
      if (found)
        return current.map((line) =>
          line === found ? { ...line, qty: Math.min(99, line.qty + 1) } : line,
        );
      return [...current, { itemId, qty: 1, mods: [] }];
    });

  const setQty = (index: number, qty: number) =>
    setLines((current) =>
      current.flatMap((line, i) =>
        i !== index ? line : qty <= 0 ? [] : [{ ...line, qty: Math.min(99, qty) }],
      ),
    );

  const toggleMod = (index: number, id: string) =>
    setLines((current) =>
      current.map((line, i) =>
        i !== index
          ? line
          : {
              ...line,
              mods: line.mods.includes(id)
                ? line.mods.filter((mod) => mod !== id)
                : [...line.mods, id],
            },
      ),
    );

  /** Writes the draft to the store. False means the draft stayed put. */
  const save = () => {
    if (lines.length === 0) {
      toast(tx(lang, "فیش خالی است", "Ticket is empty"));
      return false;
    }
    if (order) {
      const result = patchTicket(order.id, { lines, customerId: customerId ?? null, guestName, note });
      if (!result.ok) {
        toast(errorText(result.error, lang));
        return false;
      }
      toast(tx(lang, `فیش ${order.number} به‌روز شد`, `Ticket ${order.number} updated`));
      onClose();
      return true;
    }
    const result = openTicket({ lines, customerId, guestName, note });
    if (!result.ok) {
      toast(errorText(result.error, lang));
      return false;
    }
    toast(tx(lang, `فیش ${result.order.number} باز شد`, `Ticket ${result.order.number} is open`));
    onCreated(result.order.id);
    return true;
  };

  const remove = () => {
    if (!order) return;
    if (!arm) {
      setArm(true);
      return;
    }
    if (!deleteTicket(order.id)) {
      toast(errorText("locked", lang));
      return;
    }
    toast(tx(lang, `فیش ${order.number} پاک شد`, `Ticket ${order.number} deleted`));
    onClose();
  };

  const bill = () => {
    if (!order) return;
    const fresh = useCafe.getState().orders.find((entry) => entry.id === order.id);
    if (!fresh) return;
    const person = customers.find((entry) => entry.id === fresh.customerId);
    printReceipt(buildReceiptDoc(fresh, person, settings), settings.paper);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center"
      onClick={onClose}
    >
      <div
        className="flex max-h-screen w-full max-w-2xl flex-col bg-paper"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <h2 className="text-lg font-medium">
            {order
              ? tx(lang, `فیش ${order.number} · باز`, `Ticket ${order.number} · open`)
              : tx(lang, "فیش تازه", "New ticket")}
          </h2>
          <button type="button" className="h-11 px-3 text-sm text-mute" onClick={onClose}>
            {tx(lang, "بستن", "Close")}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-4 py-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={tx(lang, "نام روی فیش", "Name on the ticket")}>
              <input
                className={fieldClass}
                placeholder={tx(lang, "میز ۳، سارا…", "Table 3, Sara…")}
                value={guestName}
                onChange={(event) => setGuestName(event.target.value)}
              />
            </Field>
            <Field label={tx(lang, "یادداشت", "Note")}>
              <input className={fieldClass} value={note} onChange={(event) => setNote(event.target.value)} />
            </Field>
          </div>

          {guest ? (
            <div className="mt-3 flex items-start justify-between gap-2 border border-line bg-sheet p-3 text-sm">
              <div>
                <p className="font-medium">{guest.name}</p>
                <p className="text-xs text-mute">
                  {tierName(tierOf(guest.spent), lang)} · {guest.points} {tx(lang, "امتیاز", "pts")} ·{" "}
                  {tx(lang, "مهر", "stamps")} {guest.stamps}/{settings.stampGoal}
                </p>
              </div>
              <button type="button" className="text-xs text-mute" onClick={() => setCustomerId(undefined)}>
                {tx(lang, "جدا کن", "Detach")}
              </button>
            </div>
          ) : (
            <div className="mt-3">
              <input
                dir="ltr"
                className={fieldClass}
                inputMode="tel"
                placeholder={tx(lang, "شماره مهمان برای چسباندن", "Guest mobile to attach")}
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
              {matches.length > 0 ? (
                <ul className="mt-1 border border-line bg-sheet">
                  {matches.map((entry) => (
                    <li key={entry.id}>
                      <button
                        type="button"
                        className="flex h-11 w-full items-center justify-between px-3 text-sm"
                        onClick={() => {
                          setCustomerId(entry.id);
                          if (!guestName.trim()) setGuestName(entry.name);
                          setPhone("");
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
            </div>
          )}

          <h3 className="mt-5 text-sm font-medium text-mute">{tx(lang, "روی فیش", "On the ticket")}</h3>
          <ul className="mt-2 space-y-3">
            {priced.rows.length === 0 ? (
              <li className="border border-dashed border-line p-4 font-display text-lg italic">
                {tx(lang, "فیش خالی است. از پایین اضافه کن.", "Empty ticket. Add from below.")}
              </li>
            ) : (
              priced.rows.map((row, index) => (
                <li key={`${row.itemId}-${index}`} className="border-b border-line pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{lang === "fa" ? row.item.nameFa : row.item.nameEn}</p>
                      <p className="text-xs text-mute">{formatToman(row.unit, lang)}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label="-"
                        className="flex size-11 items-center justify-center border border-line"
                        onClick={() => setQty(index, row.qty - 1)}
                      >
                        <Minus className="size-4" />
                      </button>
                      <span className="w-6 text-center text-sm">{row.qty}</span>
                      <button
                        type="button"
                        aria-label="+"
                        className="flex size-11 items-center justify-center border border-line"
                        onClick={() => setQty(index, row.qty + 1)}
                      >
                        <Plus className="size-4" />
                      </button>
                      <button
                        type="button"
                        aria-label={tx(lang, "حذف", "Remove")}
                        className="flex size-11 items-center justify-center"
                        onClick={() => setQty(index, 0)}
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {MODS.map((mod) => {
                      const on = row.mods.some((entry) => entry.id === mod.id);
                      return (
                        <button
                          key={mod.id}
                          type="button"
                          onClick={() => toggleMod(index, mod.id)}
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

          <h3 className="mt-5 text-sm font-medium text-mute">{tx(lang, "افزودن", "Add a drink")}</h3>
          <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => {
                setCat("all");
                setFind("");
              }}
              className={cn(
                "h-11 shrink-0 border-b-2 px-2 text-sm",
                !q && cat === "all" ? "border-ink text-ink" : "border-transparent text-mute",
              )}
            >
              {tx(lang, "همه", "All")}
            </button>
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  setCat(category.id);
                  setFind("");
                }}
                className={cn(
                  "h-11 shrink-0 border-b-2 px-2 text-sm",
                  !q && cat === category.id ? "border-ink text-ink" : "border-transparent text-mute",
                )}
              >
                {tx(lang, category.fa, category.en)}
              </button>
            ))}
          </div>
          <input
            className={cn(fieldClass, "mt-2")}
            placeholder={tx(lang, "جست‌وجوی منو", "Search the menu")}
            value={find}
            onChange={(event) => setFind(event.target.value)}
          />
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {shown.slice(0, 18).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => addItem(item.id)}
                className="flex min-h-16 flex-col border border-line bg-sheet p-2 text-start text-sm hover:border-ink"
              >
                <span className="font-medium leading-snug">
                  {lang === "fa" ? item.nameFa : item.nameEn}
                </span>
                <span className="mt-auto pt-1 text-xs text-mute">{formatToman(item.price, lang)}</span>
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-base font-medium">
            <span>{tx(lang, "جمع", "Subtotal")}</span>
            <span>{formatToman(priced.subtotal, lang)}</span>
          </div>
          <p className="mt-1 text-xs text-mute">
            {tx(
              lang,
              "تخفیف، مهر و امتیاز لحظه بستن حساب می‌شوند.",
              "Discounts, stamps and points land when the ticket closes.",
            )}
          </p>
        </div>

        <div className="grid gap-2 border-t border-line p-3 sm:grid-cols-2">
          <Btn onClick={() => void save()}>
            {order ? tx(lang, "ذخیره", "Save") : tx(lang, "بازکردن فیش", "Open ticket")}
          </Btn>
          <Btn
            tone="line"
            disabled={!order}
            onClick={() => {
              if (!order) return;
              if (save()) onCloseTicket(order.id);
            }}
          >
            {tx(lang, "بستن و پرداخت", "Close & settle")}
          </Btn>
          <Btn tone="line" disabled={!order} onClick={bill}>
            <Printer className="size-4" strokeWidth={1.5} />
            {tx(lang, "پیش‌فیش", "Running bill")}
          </Btn>
          <Btn tone="stamp" disabled={!order} onClick={remove}>
            {arm
              ? tx(lang, "مطمئنی؟ دوباره بزن", "Sure? Tap again")
              : tx(lang, "پاک‌کردن فیش باز", "Delete open ticket")}
          </Btn>
        </div>
      </div>
    </div>
  );
}

/** Settle a running tab: the register's rules, applied at the last moment. */
function CloseSheet({
  lang,
  order,
  onClose,
  onClosed,
}: {
  lang: Lang;
  order: Order;
  onClose: () => void;
  onClosed: () => void;
}) {
  const customers = useCafe((state) => state.customers);
  const settings = useCafe((state) => state.settings);
  const closeTicket = useCafe((state) => state.closeTicket);
  const [pay, setPay] = useState<Pay>("card");
  const [discount, setDiscount] = useState(0);
  const [useStamp, setUseStamp] = useState(false);
  const [useGift, setUseGift] = useState(false);
  const [points, setPoints] = useState(0);
  const [note, setNote] = useState(order.note);
  const [busy, setBusy] = useState(false);

  const guest = customers.find((entry) => entry.id === order.customerId);
  const subtotal = order.lines.reduce((sum, line) => sum + line.unitPrice * line.qty, 0);
  const cheapest = order.lines.reduce((min, line) => Math.min(min, line.unitPrice), subtotal || 0);
  const priced = quote({
    subtotal,
    cheapest,
    discountPct: discount,
    useStamp,
    useGift,
    redeemPoints: points,
    customer: guest,
    settings,
  });
  const walletShort = pay === "wallet" && (!guest || guest.walletBalance < priced.total);
  const year = new Date().getFullYear();

  const settle = () => {
    setBusy(true);
    const result = closeTicket(order.id, {
      pay,
      discountPct: discount,
      useStamp,
      useGift,
      redeemPoints: points,
      note,
    });
    setBusy(false);
    if (!result.ok) {
      toast(errorText(result.error, lang));
      return;
    }
    toast(
      tx(
        lang,
        `فیش ${order.number} بسته شد · ${formatCompact(priced.total, lang)}`,
        `Ticket ${order.number} closed · ${formatCompact(priced.total, lang)}`,
      ),
    );
    onClosed();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center"
      onClick={onClose}
    >
      <div
        className="max-h-screen w-full max-w-md overflow-auto bg-paper p-4"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">
            {tx(lang, `بستن فیش ${order.number}`, `Close ticket ${order.number}`)}
          </h2>
          <button type="button" className="h-11 px-3 text-sm text-mute" onClick={onClose}>
            {tx(lang, "بعداً", "Later")}
          </button>
        </div>
        <p className="mt-1 text-xs text-mute">{ageLabel(order.at, lang)}</p>

        <ul className="mt-3 space-y-1 border-y border-line py-3 text-sm">
          {order.lines.map((line, index) => (
            <li key={`${line.itemId}-${index}`} className="flex justify-between gap-3">
              <span>
                {line.qty}× {lang === "fa" ? line.nameFa : line.nameEn}
              </span>
              <span>{formatToman(line.unitPrice * line.qty, lang)}</span>
            </li>
          ))}
        </ul>

        <div className="mt-3 space-y-2 text-sm">
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
          {guest && birthdaySoon(guest.birthday) && guest.giftYear !== year ? (
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
          {priced.manual || priced.stamp || priced.gift || priced.tier || priced.pointsOff ? (
            <ul className="space-y-1 border-t border-line pt-2 text-xs text-mute">
              {priced.manual ? (
                <li className="flex justify-between">
                  <span>{tx(lang, "تخفیف", "Discount")}</span>
                  <span>-{formatToman(priced.manual, lang)}</span>
                </li>
              ) : null}
              {priced.stamp ? (
                <li className="flex justify-between">
                  <span>{tx(lang, "مهر رایگان", "Stamp")}</span>
                  <span>-{formatToman(priced.stamp, lang)}</span>
                </li>
              ) : null}
              {priced.gift ? (
                <li className="flex justify-between">
                  <span>{tx(lang, "هدیه تولد", "Birthday")}</span>
                  <span>-{formatToman(priced.gift, lang)}</span>
                </li>
              ) : null}
              {priced.tier ? (
                <li className="flex justify-between">
                  <span>{tx(lang, "تخفیف سطح", "Tier")}</span>
                  <span>-{formatToman(priced.tier, lang)}</span>
                </li>
              ) : null}
              {priced.pointsOff ? (
                <li className="flex justify-between">
                  <span>{tx(lang, "امتیاز", "Points")}</span>
                  <span>-{formatToman(priced.pointsOff, lang)}</span>
                </li>
              ) : null}
            </ul>
          ) : null}
          <div className="flex justify-between text-base font-medium">
            <span>{tx(lang, "قابل پرداخت", "Due")}</span>
            <span>{formatToman(priced.total, lang)}</span>
          </div>
          {pay === "wallet" && guest ? (
            <p className="text-xs text-mute">
              {tx(lang, "اعتبار موجود", "Available credit")}: {formatToman(guest.walletBalance, lang)}
            </p>
          ) : null}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-1 sm:grid-cols-4">
          {(["cash", "card", "online", "wallet"] as Pay[])
            .filter((option) => option !== "wallet" || Boolean(guest))
            .map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setPay(option)}
                className={cn(
                  "h-11 text-sm",
                  pay === option ? "bg-ink text-paper" : "border border-line",
                )}
              >
                {PAY_LABEL[option][lang === "fa" ? "fa" : "en"]}
              </button>
            ))}
        </div>
        <Btn className="mt-3 w-full" disabled={busy || walletShort} onClick={settle}>
          {busy
            ? tx(lang, "در حال بستن…", "Closing…")
            : tx(lang, "بستن فیش و ثبت فروش", "Close ticket & book the sale")}
        </Btn>
      </div>
    </div>
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
