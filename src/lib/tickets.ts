import { MODS } from "./catalog.ts";
import { uid } from "./format.ts";
import type {
  Customer,
  CustomerCreditMove,
  DeskData,
  Order,
  OrderLine,
  StockItem,
  StockMove,
} from "./types.ts";

/**
 * Correcting a closed ticket means undoing what the close wrote and writing the
 * corrected version instead. These helpers are the undo half: they are pure, so
 * the store stays a thin set() and the books math can be tested on its own.
 *
 * Everything is all-or-nothing. A correction that would sell ingredient the
 * cellar does not have is refused outright rather than leaving half a ticket
 * booked — the same rule `applyCheckout` applies to a sale.
 */

type LineInput = { itemId: string; qty: number; mods: string[] };

const round3 = (value: number) => Math.round(value * 1000) / 1000;

/** Priced lines back in the shape the pricing/usage code takes. */
export function linesOf(lines: OrderLine[]): LineInput[] {
  return lines.map((line) => ({
    itemId: line.itemId,
    qty: line.qty,
    mods: line.mods.map((mod) => mod.id),
  }));
}

/**
 * sku → quantity these lines consume, counting each drink's recipe and every
 * chosen mod's recipe. The register and the corrections share this one
 * definition, so an edit and a sale can never disagree about what a latte uses.
 */
export function recipeUsage(data: DeskData, lines: LineInput[]): Map<string, number> {
  const usage = new Map<string, number>();
  const addUse = (recipe: { sku: string; qty: number }[], times: number) => {
    for (const use of recipe) usage.set(use.sku, (usage.get(use.sku) ?? 0) + use.qty * times);
  };
  for (const line of lines) {
    const item = data.menu.find((entry) => entry.id === line.itemId);
    if (!item) continue;
    addUse(item.recipe, line.qty);
    for (const modId of line.mods) {
      const mod = MODS.find((entry) => entry.id === modId);
      if (mod) addUse(mod.recipe, line.qty);
    }
  }
  return usage;
}

export function usageOfLines(data: DeskData, lines: OrderLine[]): Map<string, number> {
  return recipeUsage(
    data,
    lines.map((line) => ({
      itemId: line.itemId,
      qty: line.qty,
      mods: line.mods.map((mod) => mod.id),
    })),
  );
}

/**
 * Move the cellar to match the lines a ticket now carries: give back what the
 * old lines took and take what the new ones need, in one `adjust` movement per
 * ingredient. Returns "stock" when the correction would drive anything below
 * zero.
 */
export function reconcileStock(
  data: DeskData,
  before: OrderLine[],
  after: LineInput[],
  number: number,
  at: number,
): { ok: true; stock: StockItem[]; moves: StockMove[] } | { ok: false; error: "stock" } {
  const oldUsage = usageOfLines(data, before);
  const newUsage = recipeUsage(data, after);

  // Positive means the correction gives that much back to the cellar.
  const delta = new Map<string, number>();
  for (const [sku, qty] of oldUsage) delta.set(sku, qty);
  for (const [sku, qty] of newUsage) delta.set(sku, (delta.get(sku) ?? 0) - qty);

  const rows = [...delta].filter(([, amount]) => Math.abs(amount) > 1e-9);
  if (
    rows.some(([sku, amount]) => {
      const item = data.stock.find((entry) => entry.sku === sku);
      return !item || item.onHand + amount < -1e-9;
    })
  )
    return { ok: false, error: "stock" };

  return {
    ok: true,
    stock: data.stock.map((item) => {
      const amount = delta.get(item.sku) ?? 0;
      return Math.abs(amount) > 1e-9 ? { ...item, onHand: round3(item.onHand + amount) } : item;
    }),
    moves: [
      ...rows.map(([sku, amount]) => ({
        id: uid("mv"),
        at,
        sku,
        qty: round3(amount),
        reason: "adjust" as const,
        note: `اصلاح فیش #${number}`,
      })),
      ...data.moves,
    ].slice(0, 300),
  };
}

export type Rollback = {
  stock: StockItem[];
  moves: StockMove[];
  customers: Customer[];
  customerCreditMoves: CustomerCreditMove[];
};

/**
 * Undo a whole sale: put the ingredients back, take back the stamps, points,
 * visits and spend it landed, and return any store credit it drew on. Counters
 * are clamped at zero rather than going negative — a corrected book must stay
 * readable even when the numbers behind it moved on.
 *
 * `lastVisit` and `favoriteId` are heuristics, not ledger, and stay where they
 * are. A referral bonus paid to a third party is not clawed back either: the
 * order does not record who was paid.
 */
export function rollbackSale(data: DeskData, order: Order, at: number): Rollback {
  const usage = usageOfLines(data, order.lines);
  const goal = Math.max(1, data.settings.stampGoal);
  const qty = order.lines.reduce((sum, line) => sum + line.qty, 0);

  const customers = order.customerId
    ? data.customers.map((entry) =>
        entry.id === order.customerId
          ? {
              ...entry,
              stamps: Math.max(0, entry.stamps - qty) + (order.stampRedeemed ? goal : 0),
              points: Math.max(
                0,
                entry.points - order.pointsEarned - order.bonusPoints + order.pointsRedeemed,
              ),
              visits: Math.max(0, entry.visits - 1),
              spent: Math.max(0, entry.spent - order.total),
              walletBalance:
                order.pay === "wallet" ? entry.walletBalance + order.total : entry.walletBalance,
            }
          : entry,
      )
    : data.customers;

  return {
    stock: data.stock.map((item) => {
      const used = usage.get(item.sku) ?? 0;
      return used ? { ...item, onHand: round3(item.onHand + used) } : item;
    }),
    moves: [
      ...[...usage.entries()].map(([sku, amount]) => ({
        id: uid("mv"),
        at,
        sku,
        qty: round3(amount),
        reason: "adjust" as const,
        note: `ابطال فیش #${order.number}`,
      })),
      ...data.moves,
    ].slice(0, 300),
    customers,
    customerCreditMoves: data.customerCreditMoves.filter((move) => move.orderId !== order.id),
  };
}
