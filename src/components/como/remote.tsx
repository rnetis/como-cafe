import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, Trash2, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { ComoMark } from "@/components/como/logo";
import { Btn, fieldClass } from "@/components/como/bits";
import { expectedDrawer } from "@/lib/figures";
import { formatCompact, formatToman, formatWhen, startOfDay, tx } from "@/lib/format";
import { useLanClient } from "@/lib/lan/client";
import type { Lang, Pay } from "@/lib/types";

/**
 * The phone/tablet view served over the café LAN. It reads the desk's books
 * live and can ring orders — the desk prices them, prints them, and books the
 * stock. This side never keeps its own copy of the truth.
 */
export function Remote() {
  const status = useLanClient((state) => state.status);
  const snapshot = useLanClient((state) => state.snapshot);
  const cart = useLanClient((state) => state.cart);
  const busy = useLanClient((state) => state.busy);
  const connect = useLanClient((state) => state.connect);
  const addItem = useLanClient((state) => state.addItem);
  const setQty = useLanClient((state) => state.setQty);
  const sendOrder = useLanClient((state) => state.sendOrder);
  const [pay, setPay] = useState<Pay>("card");
  const [note, setNote] = useState("");

  useEffect(() => {
    connect();
    return () => undefined;
  }, [connect]);

  const lang: Lang = snapshot?.settings.lang ?? "fa";
  const now = Date.now();
  const todayOrders = useMemo(
    () => (snapshot?.orders ?? []).filter((order) => order.at >= startOfDay(now)),
    [snapshot, now],
  );
  const todaySales = todayOrders.reduce((sum, order) => sum + order.total, 0);
  const drawer = snapshot ? expectedDrawer(snapshot) : 0;
  const menu = useMemo(
    () => (snapshot?.menu ?? []).filter((item) => item.active),
    [snapshot],
  );
  const statusLabel =
    status === "open"
      ? tx(lang, "وصل است", "Connected")
      : status === "connecting"
        ? tx(lang, "در حال وصل", "Connecting")
        : tx(lang, "وصل نیست", "Offline");

  const send = async () => {
    const result = await sendOrder({ pay, note });
    if (result.ok) {
      toast(tx(lang, "به صندوق رفت", "Sent to the desk"));
      setNote("");
      return;
    }
    toast(
      result.error === "offline" || result.error === "timeout"
        ? tx(lang, "صندوق در دسترس نیست", "The desk is not reachable")
        : tx(lang, "این فیش بسته نشد", "The desk could not take that order"),
    );
  };

  return (
    <main className="min-h-screen bg-paper pb-10 text-ink" dir={lang === "fa" ? "rtl" : "ltr"}>
      <header className="sticky top-0 z-10 border-b border-line bg-sheet px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ComoMark className="h-10 w-4" />
            <div>
              <p className="text-sm font-medium leading-none">COMO</p>
              <p className="mt-1 text-xs text-mute">{tx(lang, "از میز صندوق", "From the desk")}</p>
            </div>
          </div>
          <span className="flex items-center gap-1 border border-line px-2 py-1 text-xs">
            {status === "open" ? <Wifi className="size-3" /> : <WifiOff className="size-3" />}
            {statusLabel}
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-4">
        <div className="grid grid-cols-3 gap-2">
          <Card label={tx(lang, "امروز", "Today")} value={formatCompact(todaySales, lang)} />
          <Card label={tx(lang, "فیش", "Tickets")} value={String(todayOrders.length)} />
          <Card label={tx(lang, "صندوق", "Drawer")} value={formatCompact(drawer, lang)} />
        </div>

        <h2 className="mt-6 text-lg font-medium">{tx(lang, "منو", "Menu")}</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {menu.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => addItem(item.id)}
              className="flex min-h-20 flex-col border border-line bg-sheet p-3 text-start"
            >
              <span className="text-xs text-mute">{lang === "fa" ? item.nameEn : item.nameFa}</span>
              <span className="mt-1 font-medium leading-snug">
                {lang === "fa" ? item.nameFa : item.nameEn}
              </span>
              <span className="mt-2 text-sm text-mute">{formatToman(item.price, lang)}</span>
            </button>
          ))}
          {menu.length === 0 && status !== "open" ? (
            <p className="col-span-full border border-dashed border-line p-4 text-sm text-mute">
              {tx(lang, "منتظر دفتر صندوق…", "Waiting for the desk…")}
            </p>
          ) : null}
        </div>

        <h2 className="mt-6 text-lg font-medium">{tx(lang, "فیش من", "My order")}</h2>
        <ul className="mt-3 space-y-2">
          {cart.length === 0 ? (
            <li className="border border-dashed border-line p-4 font-display text-lg italic">
              {tx(lang, "هنوز چیزی نخوانده‌ای.", "Nothing picked yet.")}
            </li>
          ) : (
            cart.map((line) => {
              const item = menu.find((entry) => entry.id === line.itemId);
              return (
                <li key={line.itemId} className="flex items-center justify-between gap-2 border-b border-line pb-2">
                  <span className="min-w-0 flex-1 text-sm">
                    {item ? (lang === "fa" ? item.nameFa : item.nameEn) : line.itemId}
                  </span>
                  <span className="flex items-center gap-1">
                    <button
                      type="button"
                      aria-label="-"
                      className="flex size-9 items-center justify-center border border-line"
                      onClick={() => setQty(line.itemId, line.qty - 1)}
                    >
                      <Minus className="size-3" />
                    </button>
                    <span className="w-6 text-center text-sm">{line.qty}</span>
                    <button
                      type="button"
                      aria-label="+"
                      className="flex size-9 items-center justify-center border border-line"
                      onClick={() => setQty(line.itemId, line.qty + 1)}
                    >
                      <Plus className="size-3" />
                    </button>
                    <button
                      type="button"
                      aria-label={tx(lang, "حذف", "Remove")}
                      className="flex size-9 items-center justify-center"
                      onClick={() => setQty(line.itemId, 0)}
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </span>
                </li>
              );
            })
          )}
        </ul>

        <input
          className={`${fieldClass} mt-3`}
          placeholder={tx(lang, "یادداشت برای باریستا", "Note for the barista")}
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />

        <div className="mt-3 grid grid-cols-3 gap-1">
          {(["cash", "card", "online"] as Pay[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setPay(option)}
              className={`h-11 text-sm ${pay === option ? "bg-ink text-paper" : "border border-line"}`}
            >
              {option === "cash"
                ? tx(lang, "نقد", "Cash")
                : option === "card"
                  ? tx(lang, "کارت", "Card")
                  : tx(lang, "آنلاین", "Online")}
            </button>
          ))}
        </div>
        <Btn
          className="mt-2 w-full"
          disabled={busy || cart.length === 0 || status !== "open"}
          onClick={() => void send()}
        >
          {tx(lang, "فرستادن به صندوق", "Send to the desk")}
        </Btn>

        <h2 className="mt-8 text-lg font-medium">{tx(lang, "آخرین فیش‌های میز", "Recent desk tickets")}</h2>
        <ul className="mt-2 divide-y divide-line border-y border-line text-sm">
          {(snapshot?.orders ?? []).slice(0, 8).map((order) => (
            <li key={order.id} className="flex items-center justify-between gap-3 py-2">
              <span>
                #{order.number}
                <span className="ms-2 text-xs text-mute">{formatWhen(order.at, lang)}</span>
              </span>
              <span>{formatCompact(order.total, lang)}</span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-line bg-sheet px-3 py-3">
      <p className="text-xs text-mute">{label}</p>
      <p className="mt-1 text-lg font-medium leading-none">{value}</p>
    </div>
  );
}
