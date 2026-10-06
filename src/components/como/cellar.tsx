import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Btn, Field, fieldClass } from "@/components/como/bits";
import { cn } from "@/lib/cn";
import { formatWhen, tx, unitLabel } from "@/lib/format";
import { useCafe } from "@/lib/store";
import type { Unit } from "@/lib/types";

export function Cellar() {
  const lang = useCafe((state) => state.settings.lang);
  const stock = useCafe((state) => state.stock);
  const moves = useCafe((state) => state.moves);
  const menu = useCafe((state) => state.menu);
  const receive = useCafe((state) => state.receive);
  const waste = useCafe((state) => state.waste);
  const setCount = useCafe((state) => state.setCount);
  const addStockItem = useCafe((state) => state.addStockItem);
  const [sku, setSku] = useState(stock[0]?.sku ?? "");
  const [qty, setQty] = useState(1);
  const [cost, setCost] = useState(0);
  const [cash, setCash] = useState(true);
  const [note, setNote] = useState("");
  const item = stock.find((entry) => entry.sku === sku) ?? stock[0];

  const ordered = useMemo(
    () => [...stock].sort((a, b) => a.onHand / Math.max(1, a.par) - b.onHand / Math.max(1, b.par)),
    [stock],
  );
  const low = ordered.filter((entry) => entry.onHand < entry.par);

  const usedIn = menu.filter((drink) => drink.recipe.some((use) => use.sku === item?.sku));

  if (!item)
    return (
      <div>
        <h1 className="text-2xl font-medium">{tx(lang, "انبار", "Cellar")}</h1>
        <IngredientForm lang={lang} addStockItem={addStockItem} />
      </div>
    );

  return (
    <div>
      <h1 className="text-2xl font-medium">{tx(lang, "انبار", "Cellar")}</h1>
      <p className="mt-1 max-w-xl text-sm text-mute">
        {tx(
          lang,
          "فروش، دستور را از موجودی کم می‌کند. خرید موجودی هزینه نیست؛ فقط اگر نقد بدهی از صندوق می‌رود.",
          "Sales pull recipes out of stock. A purchase is not an expense — cash only leaves the drawer if you mark it paid.",
        )}
      </p>
      {low.length > 0 ? (
        <p className="mt-4 border border-stamp px-3 py-2 text-sm text-stamp">
          {tx(lang, "زیر خط سفارش", "Below par")}:{" "}
          {low
            .map((entry) => (lang === "fa" ? entry.nameFa : entry.nameEn))
            .join(tx(lang, "، ", ", "))}
        </p>
      ) : null}

      <IngredientForm lang={lang} addStockItem={addStockItem} />

      <div className="mt-4 grid gap-3 border border-line bg-sheet p-4 md:grid-cols-2">
        <Field label={tx(lang, "کالا", "Item")}>
          <select
            className={fieldClass}
            value={item.sku}
            onChange={(event) => setSku(event.target.value)}
          >
            {ordered.map((entry) => (
              <option key={entry.sku} value={entry.sku}>
                {lang === "fa" ? entry.nameFa : entry.nameEn}
              </option>
            ))}
          </select>
        </Field>
        <Field label={tx(lang, "مقدار", "Quantity")}>
          <input
            dir="ltr"
            type="number"
            className={fieldClass}
            value={qty}
            onChange={(event) => setQty(Number(event.target.value))}
          />
        </Field>
        <Field label={tx(lang, "بهای واحد تازه، برای میانگین", "New unit cost, for the average")}>
          <input
            dir="ltr"
            type="number"
            className={fieldClass}
            value={cost}
            onChange={(event) => setCost(Number(event.target.value))}
          />
        </Field>
        <Field label={tx(lang, "یادداشت دورریز", "Waste note")}>
          <input
            className={fieldClass}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={cash}
            onChange={(event) => setCash(event.target.checked)}
          />
          {tx(lang, "خرید از صندوق نقد رفت", "Paid from the cash drawer")}
        </label>
        <div className="flex flex-wrap gap-2">
          <Btn
            onClick={() => {
              if (!receive(item.sku, qty, cost, cash))
                toast(
                  tx(
                    lang,
                    "مقدار یا بهای خرید نامعتبر است",
                    "Enter a valid quantity and unit cost",
                  ),
                );
            }}
          >
            {tx(lang, "رسید خرید", "Receive")}
          </Btn>
          <Btn
            tone="line"
            onClick={() => {
              if (!waste(item.sku, qty, note || tx(lang, "دورریز", "Waste")))
                toast(tx(lang, "مقدار بیشتر از موجودی است", "Waste quantity exceeds stock"));
            }}
          >
            {tx(lang, "دورریز", "Waste")}
          </Btn>
          <Btn
            tone="line"
            onClick={() => {
              if (!setCount(item.sku, qty))
                toast(tx(lang, "شمارش نامعتبر است", "Enter a valid count"));
            }}
          >
            {tx(lang, "شمارش مطلق", "Set count")}
          </Btn>
        </div>
        {usedIn.length > 0 ? (
          <p className="text-xs text-mute md:col-span-2">
            {tx(lang, "در دستور", "In")}:{" "}
            {usedIn
              .map((drink) => (lang === "fa" ? drink.nameFa : drink.nameEn))
              .join(tx(lang, "، ", ", "))}
          </p>
        ) : null}
      </div>

      <ul className="mt-4 grid gap-2">
        {ordered.map((entry) => {
          const ratio = entry.par > 0 ? Math.max(0, Math.min(1, entry.onHand / entry.par)) : 1;
          const critical = entry.onHand < entry.par;
          return (
            <li key={entry.sku}>
              <button
                type="button"
                onClick={() => setSku(entry.sku)}
                className={cn(
                  "w-full border px-3 py-3 text-start",
                  entry.sku === item.sku ? "border-ink" : "border-line",
                )}
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className="font-medium">{lang === "fa" ? entry.nameFa : entry.nameEn}</span>
                  <span className={cn("text-sm", critical ? "text-stamp" : "text-ink")}>
                    {entry.onHand} {unitLabel(entry.unit, lang)}
                  </span>
                </span>
                <span className="mt-2 block h-1.5 bg-paper-2">
                  <span
                    className={cn("block h-full", critical ? "bg-stamp" : "bg-ink")}
                    style={{ width: `${ratio * 100}%` }}
                  />
                </span>
                <span className="mt-1 block text-xs text-mute">
                  {tx(lang, "خط سفارش", "Par")} {entry.par}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <h2 className="mt-8 text-lg font-medium">{tx(lang, "گردش", "Movement")}</h2>
      <ul className="mt-2 divide-y divide-line border-y border-line text-sm">
        {moves.slice(0, 12).map((move) => {
          const named = stock.find((entry) => entry.sku === move.sku);
          return (
            <li key={move.id} className="flex items-center justify-between gap-3 py-2">
              <span>
                {named ? (lang === "fa" ? named.nameFa : named.nameEn) : move.sku}
                <span className="ms-2 text-xs text-mute">{formatWhen(move.at, lang)}</span>
              </span>
              <span dir="ltr">{move.qty > 0 ? `+${move.qty}` : move.qty}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function IngredientForm({
  lang,
  addStockItem,
}: {
  lang: "fa" | "en";
  addStockItem: (item: {
    nameFa: string;
    nameEn: string;
    unit: Unit;
    onHand: number;
    par: number;
    cost: number;
  }) => boolean;
}) {
  const [nameFa, setNameFa] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [unit, setUnit] = useState<Unit>("g");
  const [onHand, setOnHand] = useState(0);
  const [par, setPar] = useState(0);
  const [cost, setCost] = useState(0);
  return (
    <details className="mt-4 border border-line bg-sheet p-3">
      <summary className="cursor-pointer text-sm font-medium">
        {tx(lang, "افزودن ماده به انبار", "Add ingredient to cellar")}
      </summary>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <input
          className={fieldClass}
          placeholder={tx(lang, "نام فارسی", "Persian name")}
          value={nameFa}
          onChange={(event) => setNameFa(event.target.value)}
        />
        <input
          className={fieldClass}
          placeholder={tx(lang, "نام انگلیسی", "English name")}
          value={nameEn}
          onChange={(event) => setNameEn(event.target.value)}
        />
        <Field label={tx(lang, "واحد انبار", "Stock unit")}>
          <select
            className={fieldClass}
            value={unit}
            onChange={(event) => setUnit(event.target.value as Unit)}
          >
            <option value="g">{tx(lang, "گرم", "g")}</option>
            <option value="ml">{tx(lang, "میلی‌لیتر", "ml")}</option>
            <option value="pcs">{tx(lang, "عدد", "pcs")}</option>
          </select>
        </Field>
        <Field label={tx(lang, "موجودی فعلی", "Opening stock")}>
          <input
            dir="ltr"
            type="number"
            min="0"
            step="0.001"
            className={fieldClass}
            value={onHand}
            onChange={(event) => setOnHand(Number(event.target.value))}
          />
        </Field>
        <Field label={tx(lang, "هشدار سفارش", "Reorder level")}>
          <input
            dir="ltr"
            type="number"
            min="0"
            step="0.001"
            className={fieldClass}
            value={par}
            onChange={(event) => setPar(Number(event.target.value))}
          />
        </Field>
        <Field label={tx(lang, "بهای خرید هر واحد (تومان)", "Cost per stock unit (toman)")}>
          <input
            dir="ltr"
            type="number"
            min="0"
            className={fieldClass}
            value={cost}
            onChange={(event) => setCost(Number(event.target.value))}
          />
        </Field>
        <Btn
          className="sm:col-span-2"
          onClick={() => {
            if (!addStockItem({ nameFa, nameEn, unit, onHand, par, cost })) {
              toast(
                tx(
                  lang,
                  "نام تکراری یا مقدار نامعتبر است",
                  "Names must be unique and quantities valid",
                ),
              );
              return;
            }
            setNameFa("");
            setNameEn("");
            toast(tx(lang, "ماده به انبار اضافه شد", "Ingredient added to cellar"));
          }}
        >
          {tx(lang, "افزودن به انبار", "Add to cellar")}
        </Btn>
      </div>
    </details>
  );
}
