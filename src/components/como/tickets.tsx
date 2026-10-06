import { useState } from "react";
import { formatToman, formatWhen, tx } from "@/lib/format";
import { useCafe } from "@/lib/store";

export function Tickets() {
  const lang = useCafe((state) => state.settings.lang);
  const orders = useCafe((state) => state.orders);
  const openReceipt = useCafe((state) => state.openReceipt);
  const [query, setQuery] = useState("");
  const q = query.trim();
  const list = orders.filter((order) => {
    if (!q) return true;
    return (
      String(order.number).includes(q) ||
      (order.guestName ?? "").includes(q) ||
      order.lines.some((line) => line.nameFa.includes(q) || line.nameEn.toLowerCase().includes(q.toLowerCase()))
    );
  });

  return (
    <div>
      <h1 className="text-2xl font-medium">{tx(lang, "فیش‌ها", "Tickets")}</h1>
      <input
        className="mt-4 h-12 w-full max-w-md border border-line bg-sheet px-3 text-base outline-none focus:border-ink"
        placeholder={tx(lang, "شماره، نام، نوشیدنی", "Number, name, drink")}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <ul className="mt-4 divide-y divide-line border-y border-line">
        {list.slice(0, 80).map((order) => (
          <li key={order.id}>
            <button
              type="button"
              onClick={() => openReceipt(order.id)}
              className="flex w-full items-start justify-between gap-3 py-3 text-start"
            >
              <span>
                <span className="block font-medium">#{order.number}</span>
                <span className="text-xs text-mute">
                  {formatWhen(order.at, lang)}
                  {order.guestName ? ` · ${order.guestName}` : ""}
                </span>
                <span className="mt-1 block text-sm text-ink-soft">
                  {order.lines.map((line) => `${line.qty}× ${lang === "fa" ? line.nameFa : line.nameEn}`).join(tx(lang, "، ", ", "))}
                </span>
              </span>
              <span className="shrink-0 text-sm">{formatToman(order.total, lang)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
