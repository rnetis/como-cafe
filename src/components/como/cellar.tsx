import { useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Btn, Field, fieldClass } from "@/components/como/bits";
import { cn } from "@/lib/cn";
import { formatWhen, tx, unitLabel } from "@/lib/format";
import { useCafe } from "@/lib/store";
import type { Lang, StockItem, StockReason, Unit } from "@/lib/types";

const REASON_LABEL: Record<StockReason, { fa: string; en: string }> = {
  sale: { fa: "فروش", en: "Sale" },
  purchase: { fa: "خرید", en: "Buy" },
  waste: { fa: "دورریز", en: "Waste" },
  adjust: { fa: "شمارش", en: "Count" },
};

/** Which ingredient the sheet is working on: absent = a fresh one. */
type SheetTarget = { mode: "add" } | { mode: "edit"; sku: string };

export function Cellar() {
  const lang = useCafe((state) => state.settings.lang);
  const stock = useCafe((state) => state.stock);
  const moves = useCafe((state) => state.moves);
  const menu = useCafe((state) => state.menu);
  const receive = useCafe((state) => state.receive);
  const waste = useCafe((state) => state.waste);
  const setCount = useCafe((state) => state.setCount);
  const [sku, setSku] = useState(stock[0]?.sku ?? "");
  const [qty, setQty] = useState(1);
  const [cost, setCost] = useState(0);
  const [cash, setCash] = useState(true);
  const [note, setNote] = useState("");
  const [sheet, setSheet] = useState<SheetTarget | null>(null);
  const item = stock.find((entry) => entry.sku === sku) ?? stock[0];

  const ordered = useMemo(
    () => [...stock].sort((a, b) => a.onHand / Math.max(1, a.par) - b.onHand / Math.max(1, b.par)),
    [stock],
  );
  const low = ordered.filter((entry) => entry.onHand < entry.par);

  const usedIn = menu.filter((drink) => drink.recipe.some((use) => use.sku === item?.sku));
  const recipesOf = (target: string) =>
    menu.filter((drink) => drink.recipe.some((use) => use.sku === target)).length;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-medium">{tx(lang, "انبار", "Cellar")}</h1>
          <p className="mt-1 max-w-xl text-sm text-mute">
            {tx(
              lang,
              "فروش، دستور را از موجودی کم می‌کند. خرید موجودی هزینه نیست؛ فقط اگر نقد بدهی از صندوق می‌رود.",
              "Sales pull recipes out of stock. A purchase is not an expense — cash only leaves the drawer if you mark it paid.",
            )}
          </p>
        </div>
        <Btn onClick={() => setSheet({ mode: "add" })}>
          <Plus className="size-4" strokeWidth={1.5} />
          {tx(lang, "ماده تازه", "New ingredient")}
        </Btn>
      </div>
      {low.length > 0 ? (
        <p className="mt-4 border border-stamp px-3 py-2 text-sm text-stamp">
          {tx(lang, "زیر خط سفارش", "Below par")}:{" "}
          {low
            .map((entry) => (lang === "fa" ? entry.nameFa : entry.nameEn))
            .join(tx(lang, "، ", ", "))}
        </p>
      ) : null}

      {item ? (
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
                  toast(tx(lang, "مقدار یا بهای خرید نامعتبر است", "Enter a valid quantity and unit cost"));
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
                if (!setCount(item.sku, qty)) toast(tx(lang, "شمارش نامعتبر است", "Enter a valid count"));
              }}
            >
              {tx(lang, "شمارش مطلق", "Set count")}
            </Btn>
            <Btn tone="line" onClick={() => setSheet({ mode: "edit", sku: item.sku })}>
              <Pencil className="size-4" strokeWidth={1.5} />
              {tx(lang, "ویرایش", "Edit")}
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
      ) : (
        <p className="mt-4 border border-dashed border-line p-4 text-sm text-mute">
          {tx(lang, "انبار خالی است. یک ماده تازه بساز.", "The cellar is empty. Add a first ingredient.")}
        </p>
      )}

      <ul className="mt-4 grid gap-2">
        {ordered.map((entry) => {
          const ratio = entry.par > 0 ? Math.max(0, Math.min(1, entry.onHand / entry.par)) : 1;
          const critical = entry.onHand < entry.par;
          return (
            <li key={entry.sku} className="flex items-stretch gap-1">
              <button
                type="button"
                onClick={() => setSku(entry.sku)}
                className={cn(
                  "min-w-0 flex-1 border px-3 py-3 text-start",
                  entry.sku === item?.sku ? "border-ink" : "border-line",
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
                  {entry.cost > 0 ? ` · ${tx(lang, "بها", "cost")} ${entry.cost}` : ""}
                </span>
              </button>
              <button
                type="button"
                aria-label={tx(lang, "ویرایش", "Edit")}
                onClick={() => setSheet({ mode: "edit", sku: entry.sku })}
                className="flex w-11 items-center justify-center border border-line text-mute"
              >
                <Pencil className="size-4" strokeWidth={1.5} />
              </button>
              <button
                type="button"
                aria-label={tx(lang, "حذف", "Delete")}
                onClick={() => {
                  if (!useCafe.getState().removeStockItem(entry.sku)) {
                    toast(
                      tx(
                        lang,
                        `در ${recipesOf(entry.sku)} دستور است — اول از منو بردار`,
                        `Used by ${recipesOf(entry.sku)} recipe(s) — pull it from the menu first`,
                      ),
                    );
                    return;
                  }
                  toast(tx(lang, `${lang === "fa" ? entry.nameFa : entry.nameEn} از انبار رفت`, `${entry.nameEn} left the cellar`));
                }}
                className="flex w-11 items-center justify-center border border-line text-mute"
              >
                <Trash2 className="size-4" strokeWidth={1.5} />
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
                <span className="ms-2 text-xs text-mute">
                  {tx(lang, REASON_LABEL[move.reason].fa, REASON_LABEL[move.reason].en)}
                  {move.note ? ` · ${move.note}` : ""}
                </span>
                <span className="ms-2 text-xs text-mute">{formatWhen(move.at, lang)}</span>
              </span>
              <span dir="ltr">{move.qty > 0 ? `+${move.qty}` : move.qty}</span>
            </li>
          );
        })}
        {moves.length === 0 ? (
          <li className="py-2 text-mute">{tx(lang, "هنوز حرکتی نیست.", "No movement yet.")}</li>
        ) : null}
      </ul>

      {sheet ? (
        <IngredientSheet
          lang={lang}
          target={sheet}
          item={sheet.mode === "edit" ? stock.find((entry) => entry.sku === sheet.sku) : undefined}
          recipes={sheet.mode === "edit" ? recipesOf(sheet.sku) : 0}
          onClose={() => setSheet(null)}
          onGone={(gone) => {
            if (gone === item?.sku) setSku(stock.find((entry) => entry.sku !== gone)?.sku ?? "");
            setSheet(null);
          }}
        />
      ) : null}
    </div>
  );
}

function IngredientSheet({
  lang,
  target,
  item,
  recipes,
  onClose,
  onGone,
}: {
  lang: Lang;
  target: SheetTarget;
  item?: StockItem;
  recipes: number;
  onClose: () => void;
  onGone: (sku: string) => void;
}) {
  const addStockItem = useCafe((state) => state.addStockItem);
  const patchStockItem = useCafe((state) => state.patchStockItem);
  const removeStockItem = useCafe((state) => state.removeStockItem);
  const [nameFa, setNameFa] = useState(item?.nameFa ?? "");
  const [nameEn, setNameEn] = useState(item?.nameEn ?? "");
  const [unit, setUnit] = useState<Unit>(item?.unit ?? "g");
  const [onHand, setOnHand] = useState(item?.onHand ?? 0);
  const [par, setPar] = useState(item?.par ?? 0);
  const [cost, setCost] = useState(item?.cost ?? 0);
  const [arm, setArm] = useState(false);
  const editing = target.mode === "edit";
  const title = editing
    ? tx(lang, "ویرایش ماده", "Edit ingredient")
    : tx(lang, "ماده تازه", "New ingredient");

  const save = () => {
    const values = { nameFa, nameEn, unit, onHand, par, cost };
    if (editing && item) {
      if (!patchStockItem(item.sku, values)) {
        toast(tx(lang, "نام تکراری یا مقدار نامعتبر است", "Names must be unique and quantities valid"));
        return;
      }
      toast(tx(lang, "ماده به‌روز شد", "Ingredient updated"));
      onClose();
      return;
    }
    if (!addStockItem(values)) {
      toast(tx(lang, "نام تکراری یا مقدار نامعتبر است", "Names must be unique and quantities valid"));
      return;
    }
    toast(tx(lang, "ماده به انبار اضافه شد", "Ingredient added to the cellar"));
    onClose();
  };

  if (editing && !item) return null;

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
          <h2 className="text-lg font-medium">{title}</h2>
          <button type="button" className="h-11 px-3 text-sm text-mute" onClick={onClose}>
            {tx(lang, "بستن", "Close")}
          </button>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label={tx(lang, "نام فارسی", "Persian name")}>
            <input className={fieldClass} value={nameFa} onChange={(event) => setNameFa(event.target.value)} />
          </Field>
          <Field label={tx(lang, "نام انگلیسی", "English name")}>
            <input className={fieldClass} value={nameEn} onChange={(event) => setNameEn(event.target.value)} />
          </Field>
          <Field label={tx(lang, "واحد انبار", "Stock unit")}>
            <select className={fieldClass} value={unit} onChange={(event) => setUnit(event.target.value as Unit)}>
              <option value="g">{tx(lang, "گرم", "g")}</option>
              <option value="ml">{tx(lang, "میلی‌لیتر", "ml")}</option>
              <option value="pcs">{tx(lang, "عدد", "pcs")}</option>
            </select>
          </Field>
          <Field label={tx(lang, "موجودی فعلی", "On hand")}>
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
        </div>
        {editing && item ? (
          <p className="mt-3 text-xs text-mute">
            {tx(lang, "موجودی فعلی", "On hand")}: {item.onHand} {unitLabel(item.unit, lang)} ·{" "}
            {tx(lang, `${recipes} دستور`, `${recipes} recipe(s)`)}
            {Math.abs(onHand - item.onHand) > 1e-9
              ? ` · ${tx(lang, `اختلاف با شمارش ثبت می‌شود`, `the difference lands in the movement log`)}`
              : ""}
          </p>
        ) : null}
        <Btn className="mt-4 w-full" onClick={save}>
          {editing ? tx(lang, "ذخیره", "Save") : tx(lang, "افزودن به انبار", "Add to cellar")}
        </Btn>
        {editing && item ? (
          <Btn
            tone="stamp"
            className="mt-2 w-full"
            onClick={() => {
              if (!arm) {
                setArm(true);
                return;
              }
              if (!removeStockItem(item.sku)) {
                toast(
                  tx(
                    lang,
                    `در ${recipes} دستور است — اول از منو بردار`,
                    `Used by ${recipes} recipe(s) — pull it from the menu first`,
                  ),
                );
                setArm(false);
                return;
              }
              toast(tx(lang, `${item.nameFa} از انبار رفت`, `${item.nameEn} left the cellar`));
              onGone(item.sku);
            }}
          >
            {arm
              ? tx(lang, "مطمئنی؟ دوباره بزن", "Sure? Tap again")
              : tx(lang, "حذف ماده", "Delete ingredient")}
          </Btn>
        ) : null}
      </div>
    </div>
  );
}
