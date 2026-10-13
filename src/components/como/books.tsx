import { useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { Btn, Field, Kpi, fieldClass } from "@/components/como/bits";
import { expectedDrawer, inRange, type RangeKey } from "@/lib/figures";
import { formatCompact, formatDay, formatToman, formatWhen, startOfDay, tx } from "@/lib/format";
import { useCafe } from "@/lib/store";
import type { Expense, ExpenseCategory } from "@/lib/types";

const ranges: { id: RangeKey; fa: string; en: string }[] = [
  { id: "today", fa: "امروز", en: "Today" },
  { id: "d7", fa: "۷ روز", en: "7 days" },
  { id: "d30", fa: "۳۰ روز", en: "30 days" },
];

const categories: { id: ExpenseCategory; fa: string; en: string }[] = [
  { id: "rent", fa: "اجاره", en: "Rent" },
  { id: "payroll", fa: "حقوق", en: "Payroll" },
  { id: "utilities", fa: "آب و برق", en: "Utilities" },
  { id: "supplies", fa: "مصرفی", en: "Supplies" },
  { id: "other", fa: "سایر", en: "Other" },
];

const METHODS: { id: Expense["method"]; fa: string; en: string }[] = [
  { id: "cash", fa: "نقد", en: "Cash" },
  { id: "card", fa: "کارت", en: "Card" },
  { id: "transfer", fa: "انتقال", en: "Transfer" },
];

type ExpenseDraft = Pick<Expense, "category" | "amount" | "note" | "custom" | "method">;

const BLANK: ExpenseDraft = { category: "supplies", amount: 0, note: "", custom: "", method: "cash" };

const categoryName = (id: ExpenseCategory, lang: "fa" | "en") => {
  const found = categories.find((item) => item.id === id);
  return found ? (lang === "fa" ? found.fa : found.en) : id;
};

/** The five fields one expense is made of — the add form and an edited row
 *  render the same ones, so a row can never drift from what "Add" records. */
function ExpenseFields({
  lang,
  label,
  draft,
  setDraft,
}: {
  lang: "fa" | "en";
  label: string;
  draft: ExpenseDraft;
  setDraft: (next: ExpenseDraft) => void;
}) {
  return (
    <>
      <Field label={tx(lang, "دسته", "Category")}>
        <select
          className={fieldClass}
          value={draft.category}
          onChange={(event) => setDraft({ ...draft, category: event.target.value as ExpenseCategory })}
        >
          {categories.map((item) => (
            <option key={item.id} value={item.id}>
              {tx(lang, item.fa, item.en)}
            </option>
          ))}
        </select>
      </Field>
      <Field label={tx(lang, "مبلغ تومان", "Amount, toman")}>
        <input
          dir="ltr"
          type="number"
          className={fieldClass}
          value={draft.amount || ""}
          onChange={(event) => setDraft({ ...draft, amount: Number(event.target.value) })}
        />
      </Field>
      <Field label={label}>
        <input
          className={fieldClass}
          value={draft.custom}
          onChange={(event) => setDraft({ ...draft, custom: event.target.value })}
        />
      </Field>
      <Field label={tx(lang, "شرح", "Note")}>
        <input
          className={fieldClass}
          value={draft.note}
          onChange={(event) => setDraft({ ...draft, note: event.target.value })}
        />
      </Field>
      <div className="flex gap-1">
        {METHODS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setDraft({ ...draft, method: item.id })}
            className={`h-11 flex-1 text-sm ${draft.method === item.id ? "bg-ink text-paper" : "border border-line"}`}
          >
            {tx(lang, item.fa, item.en)}
          </button>
        ))}
      </div>
    </>
  );
}

export function Books() {
  const data = useCafe();
  const lang = data.settings.lang;
  const [range, setRange] = useState<RangeKey>("d7");
  const [draft, setDraft] = useState<ExpenseDraft>(BLANK);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<ExpenseDraft>(BLANK);
  const [armDelete, setArmDelete] = useState(false);
  const [closeNote, setCloseNote] = useState("");

  // The owner names the extra column once, in House; until then it is just a
  // label. Empty means the column is simply unnamed, not hidden.
  const customLabel =
    data.settings.expenseCustomLabel.trim() || tx(lang, "برچسب دلخواه", "Custom label");

  // Open tabs are not sales yet — the books only count closed tickets.
  const closed = data.orders.filter((order) => order.status === "closed");
  const orders = closed.filter((order) => inRange(order.at, range));
  const expenses = data.expenses.filter((expense) => inRange(expense.at, range));
  const sales = orders.reduce((sum, order) => sum + order.total, 0);
  const cogs = orders.reduce((sum, order) => sum + order.cogs, 0);
  const expenseTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const gross = sales - cogs;
  const net = gross - expenseTotal;
  const tickets = orders.length;
  const avg = tickets ? sales / tickets : 0;
  const days = range === "today" ? 1 : range === "d7" ? 7 : 30;
  const series = Array.from({ length: days }, (_, index) => {
    const start = startOfDay(Date.now() - (days - 1 - index) * 86_400_000);
    const total = closed
      .filter((order) => order.at >= start && order.at < start + 86_400_000)
      .reduce((sum, order) => sum + order.total, 0);
    return { label: formatDay(start, lang), total };
  });
  const drawer = expectedDrawer(data);
  const open = data.orders.filter((order) => order.status === "open");

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-medium">{tx(lang, "دفتر", "Books")}</h1>
        <div className="flex border border-line">
          {ranges.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setRange(item.id)}
              className={`h-11 px-3 text-sm ${range === item.id ? "bg-ink text-paper" : "bg-sheet"}`}
            >
              {tx(lang, item.fa, item.en)}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Kpi label={tx(lang, "فروش", "Sales")} value={formatCompact(sales, lang)} hint={`${tickets} · ${formatCompact(avg, lang)}`} />
        <Kpi label={tx(lang, "سود ناخالص", "Gross")} value={formatCompact(gross, lang)} hint={tx(lang, "فروش منهای بهای دستور", "Sales minus recipe cost")} />
        <Kpi label={tx(lang, "هزینه", "Expenses")} value={formatCompact(expenseTotal, lang)} />
        <Kpi label={tx(lang, "سود خالص", "Net")} value={formatCompact(net, lang)} />
      </div>
      <div dir="ltr" className="mt-4 h-52 border border-line bg-sheet p-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={series}>
            <XAxis dataKey="label" interval={days > 14 ? 4 : 0} tick={{ fill: "var(--color-mute)", fontSize: 12 }} />
            <YAxis hide />
            <Tooltip
              formatter={(value) => formatToman(Number(value ?? 0), lang)}
              cursor={{ fill: "var(--color-paper-2)" }}
              contentStyle={{ background: "var(--color-ink)", border: "none", color: "var(--color-paper)" }}
            />
            <Bar dataKey="total" fill="var(--color-ink)" maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-3 text-sm">
        {tx(lang, "صندوق مورد انتظار", "Expected drawer")}: <span className="font-medium">{formatToman(drawer, lang)}</span>
      </p>
      {open.length > 0 ? (
        <p className="mt-2 text-sm text-mute">
          {tx(lang, "فیش‌های باز", "Open tickets")}: {open.length} ·{" "}
          {formatCompact(
            open.reduce((sum, order) => sum + order.total, 0),
            lang,
          )}{" "}
          {tx(lang, "— تا بسته نشوند فروش نیست", "— not sales until they close")}
        </p>
      ) : null}
      <p className="mt-1 max-w-xl text-xs text-mute">
        {tx(
          lang,
          "تنخواه به‌علاوه فروش نقد، منهای هزینه نقد و خرید نقدی انبار. سود، خرید انبار را هزینه حساب نمی‌کند.",
          "Float plus cash sales, minus cash expenses and cash stock buys. Profit does not treat stock purchases as expenses.",
        )}
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <form
          className="grid gap-3 border border-line bg-sheet p-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (draft.amount <= 0) return;
            data.addExpense(draft);
            setDraft({ ...BLANK, category: draft.category, method: draft.method });
            toast(tx(lang, "هزینه ثبت شد", "Expense recorded"));
          }}
        >
          <h2 className="text-lg font-medium">{tx(lang, "هزینه", "Expense")}</h2>
          <ExpenseFields lang={lang} label={customLabel} draft={draft} setDraft={setDraft} />
          <Btn type="submit">{tx(lang, "ثبت هزینه", "Add expense")}</Btn>
        </form>

        <div className="border border-line p-4">
          <h2 className="text-lg font-medium">{tx(lang, "بستن امروز", "Close today")}</h2>
          <input
            className={`${fieldClass} mt-3`}
            placeholder={tx(lang, "یادداشت صندوق", "Drawer note")}
            value={closeNote}
            onChange={(event) => setCloseNote(event.target.value)}
          />
          <Btn className="mt-3" tone="line" onClick={() => data.closeDay(closeNote)}>
            {tx(lang, "ثبت بستن", "Record close")}
          </Btn>
          <ul className="mt-4 space-y-2 text-sm">
            {data.closes.slice(0, 4).map((close) => (
              <li key={close.id} className="border-t border-line pt-2">
                <span className="text-mute">{formatWhen(close.at, lang)}</span>
                <span className="ms-2">{formatCompact(close.sales, lang)}</span>
                {close.note ? <span className="mt-1 block text-xs">{close.note}</span> : null}
              </li>
            ))}
            {data.closes.length === 0 ? <li className="text-mute">{tx(lang, "هنوز بستی نیست.", "No close yet.")}</li> : null}
          </ul>
        </div>
      </div>

      <h2 className="mt-8 text-lg font-medium">{tx(lang, "آخرین هزینه‌ها", "Recent expenses")}</h2>
      <ul className="mt-2 divide-y divide-line border-y border-line text-sm">
        {data.expenses.slice(0, 8).map((expense) =>
          editingId === expense.id ? (
            <li key={expense.id} className="grid gap-3 bg-sheet py-3">
              <ExpenseFields
                lang={lang}
                label={customLabel}
                draft={editDraft}
                setDraft={setEditDraft}
              />
              <div className="flex flex-wrap gap-1">
                <Btn
                  onClick={() => {
                    if (editDraft.amount <= 0) {
                      toast(tx(lang, "مبلغ را بنویس", "Enter an amount"));
                      return;
                    }
                    if (!data.patchExpense(expense.id, editDraft)) {
                      toast(tx(lang, "این هزینه پیدا نشد", "That expense is gone"));
                      return;
                    }
                    setEditingId(null);
                    toast(tx(lang, "هزینه به‌روز شد", "Expense updated"));
                  }}
                >
                  {tx(lang, "ذخیره", "Save")}
                </Btn>
                <Btn
                  tone="line"
                  onClick={() => {
                    setEditingId(null);
                    setArmDelete(false);
                  }}
                >
                  {tx(lang, "بی‌خیال", "Cancel")}
                </Btn>
                <Btn
                  tone="stamp"
                  onClick={() => {
                    if (!armDelete) {
                      setArmDelete(true);
                      return;
                    }
                    data.removeExpense(expense.id);
                    setEditingId(null);
                    setArmDelete(false);
                    toast(tx(lang, "هزینه پاک شد", "Expense deleted"));
                  }}
                >
                  {armDelete
                    ? tx(lang, "مطمئنی؟ دوباره بزن", "Sure? Tap again")
                    : tx(lang, "پاک‌کردن", "Delete")}
                </Btn>
              </div>
            </li>
          ) : (
            <li key={expense.id} className="flex items-center justify-between gap-3 py-2">
              <span className="min-w-0">
                <span className="block truncate">
                  {categoryName(expense.category, lang)}
                  {expense.custom ? (
                    <span className="ms-2 text-xs text-ink-soft">{expense.custom}</span>
                  ) : null}
                </span>
                <span className="block truncate text-xs text-mute">
                  {[
                    expense.note,
                    METHODS.find((item) => item.id === expense.method)?.[lang === "fa" ? "fa" : "en"],
                    formatWhen(expense.at, lang),
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-3">
                <span>{formatCompact(expense.amount, lang)}</span>
                <button
                  type="button"
                  className="text-xs underline"
                  onClick={() => {
                    setEditingId(expense.id);
                    setEditDraft({
                      category: expense.category,
                      amount: expense.amount,
                      note: expense.note,
                      custom: expense.custom,
                      method: expense.method,
                    });
                    setArmDelete(false);
                  }}
                >
                  {tx(lang, "ویرایش", "Edit")}
                </button>
              </span>
            </li>
          ),
        )}
        {data.expenses.length === 0 ? (
          <li className="py-3 text-mute">{tx(lang, "هنوز هزینه‌ای ثبت نشده.", "No expense yet.")}</li>
        ) : null}
      </ul>
    </div>
  );
}
