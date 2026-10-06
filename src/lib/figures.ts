import { startOfDay } from "./format";
import type { DeskData } from "./types";

export type RangeKey = "today" | "d7" | "d30";

export function inRange(ts: number, range: RangeKey, now = Date.now()) {
  if (range === "today") return ts >= startOfDay(now);
  const days = range === "d7" ? 7 : 30;
  return ts >= startOfDay(now) - (days - 1) * 86_400_000;
}

export function expectedDrawer(data: DeskData) {
  const cashSales = data.orders
    .filter((order) => order.pay === "cash")
    .reduce((sum, order) => sum + order.total, 0);
  const cashExp = data.expenses
    .filter((expense) => expense.method === "cash")
    .reduce((sum, expense) => sum + expense.amount, 0);
  const moves = data.cashMoves.reduce((sum, move) => sum + move.amount, 0);
  return data.settings.float + cashSales + moves - cashExp;
}
