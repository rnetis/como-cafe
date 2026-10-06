import { useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Btn, Field, Kpi, fieldClass } from "@/components/como/bits";
import { expectedDrawer, inRange, type RangeKey } from "@/lib/figures";
import { formatCompact, formatDay, formatToman, formatWhen, startOfDay, tx } from "@/lib/format";
import { useCafe } from "@/lib/store";
import type { ExpenseCategory } from "@/lib/types";

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

export function Books() {
  const data = useCafe();
  const lang = data.settings.lang;
  const [range, setRange] = useState<RangeKey>("d7");
  const [category, setCategory] = useState<ExpenseCategory>("supplies");
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState("");
  const [method, setMethod] = useState<"cash" | "card" | "transfer">("cash");
  const [closeNote, setCloseNote] = useState("");

  const orders = data.orders.filter((order) => inRange(order.at, range));
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
    const total = data.orders
      .filter((order) => order.at >= start && order.at < start + 86_400_000)
      .reduce((sum, order) => sum + order.total, 0);
    return { label: formatDay(start, lang), total };
  });
  const drawer = expectedDrawer(data);

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
            if (amount <= 0) return;
            data.addExpense({ category, amount, note, method });
            setAmount(0);
            setNote("");
          }}
        >
          <h2 className="text-lg font-medium">{tx(lang, "هزینه", "Expense")}</h2>
          <Field label={tx(lang, "دسته", "Category")}>
            <select className={fieldClass} value={category} onChange={(event) => setCategory(event.target.value as ExpenseCategory)}>
              {categories.map((item) => (
                <option key={item.id} value={item.id}>
                  {tx(lang, item.fa, item.en)}
                </option>
              ))}
            </select>
          </Field>
          <Field label={tx(lang, "مبلغ تومان", "Amount, toman")}>
            <input dir="ltr" type="number" className={fieldClass} value={amount || ""} onChange={(event) => setAmount(Number(event.target.value))} />
          </Field>
          <Field label={tx(lang, "شرح", "Note")}>
            <input className={fieldClass} value={note} onChange={(event) => setNote(event.target.value)} />
          </Field>
          <div className="flex gap-1">
            {(["cash", "card", "transfer"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setMethod(item)}
                className={`h-11 flex-1 text-sm ${method === item ? "bg-ink text-paper" : "border border-line"}`}
              >
                {item === "cash" ? tx(lang, "نقد", "Cash") : item === "card" ? tx(lang, "کارت", "Card") : tx(lang, "انتقال", "Transfer")}
              </button>
            ))}
          </div>
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
        {data.expenses.slice(0, 8).map((expense) => (
          <li key={expense.id} className="flex items-center justify-between gap-3 py-2">
            <span>
              {tx(lang, categories.find((item) => item.id === expense.category)?.fa ?? "", categories.find((item) => item.id === expense.category)?.en ?? "")}
              <span className="ms-2 text-xs text-mute">{expense.note}</span>
            </span>
            <span>{formatCompact(expense.amount, lang)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
