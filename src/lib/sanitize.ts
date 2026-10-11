import { defaultSettings } from "./seed.ts";
import type {
  CashMove,
  CategoryId,
  CloseOut,
  Customer,
  CustomerCreditMove,
  DeskData,
  Expense,
  ExpenseCategory,
  MenuItem,
  Order,
  Pay,
  Settings,
  SmsKind,
  SmsLog,
  StockItem,
  StockReason,
  Unit,
} from "./types.ts";

/**
 * Structural firewall for untrusted desk data (restored backups and the
 * localStorage payload rehydrated on boot). Anything malformed is coerced or
 * dropped — a corrupt or hand-edited save must never brick the POS or poison
 * the books with NaNs. The output is always a complete DeskData.
 *
 * Array caps mirror the write-side slices in store.ts so a bloated backup
 * cannot smuggle in more rows than the store would ever keep.
 */

const MENU_CAP = 500;
const STOCK_CAP = 500;
const CUSTOMERS_CAP = 20_000;
const ORDERS_CAP = 500;
const EXPENSES_CAP = 400;
const MOVES_CAP = 300;
const CASH_CAP = 300;
const SMS_CAP = 80;
const CLOSES_CAP = 60;

const CATEGORIES: CategoryId[] = ["hot-coffee", "iced-coffee", "brew", "hot-drinks", "mocktail"];
const PAYS: Pay[] = ["cash", "card", "online", "wallet"];
const UNITS: Unit[] = ["g", "ml", "pcs"];
const REASONS: StockReason[] = ["sale", "purchase", "waste", "adjust"];
const EXPENSE_CATS: ExpenseCategory[] = ["rent", "payroll", "utilities", "supplies", "other"];
const SMS_KINDS: SmsKind[] = ["receipt", "welcome", "loyalty", "campaign", "birthday"];

type Row = Record<string, unknown>;

const row = (value: unknown): Row | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Row) : null;

const arr = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

const str = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value : typeof value === "number" ? String(value) : fallback;

const num = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const nonNegative = (value: unknown, fallback = 0): number => Math.max(0, num(value, fallback));

const bool = (value: unknown, fallback: boolean): boolean =>
  typeof value === "boolean" ? value : fallback;

/** Keep the value only when it is one of the allowed literals. */
const oneOf = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
  typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;

const epoch = (value: unknown): number => {
  const ts = num(value);
  return ts > 0 && ts < 4_102_444_800_000 ? Math.round(ts) : Date.now();
};

const recipe = (value: unknown): { sku: string; qty: number }[] =>
  arr(value)
    .map((use) => row(use))
    .filter((use): use is Row => use !== null && typeof use.sku === "string" && use.sku.length > 0)
    .map((use) => ({ sku: use.sku as string, qty: num(use.qty, 1) }));

function menu(raw: unknown): MenuItem[] {
  return arr(raw)
    .map((entry) => row(entry))
    .filter((entry): entry is Row => entry !== null && typeof entry.id === "string" && entry.id.length > 0)
    .map((entry) => ({
      id: entry.id as string,
      category: oneOf(entry.category, CATEGORIES, "hot-coffee"),
      nameFa: str(entry.nameFa, "بدون نام"),
      nameEn: str(entry.nameEn, "Untitled"),
      price: nonNegative(entry.price),
      recipe: recipe(entry.recipe),
      active: bool(entry.active, true),
    }))
    .slice(0, MENU_CAP);
}

function stock(raw: unknown): StockItem[] {
  return arr(raw)
    .map((entry) => row(entry))
    .filter((entry): entry is Row => entry !== null && typeof entry.sku === "string" && entry.sku.length > 0)
    .map((entry) => ({
      sku: entry.sku as string,
      nameFa: str(entry.nameFa, entry.sku as string),
      nameEn: str(entry.nameEn, entry.sku as string),
      unit: oneOf(entry.unit, UNITS, "pcs"),
      onHand: num(entry.onHand),
      par: nonNegative(entry.par),
      cost: nonNegative(entry.cost),
    }))
    .slice(0, STOCK_CAP);
}

function customers(raw: unknown): Customer[] {
  return arr(raw)
    .map((entry) => row(entry))
    .filter((entry): entry is Row => entry !== null && typeof entry.id === "string" && entry.id.length > 0)
    .map((entry) => ({
      id: entry.id as string,
      name: str(entry.name, "مهمان"),
      phone: str(entry.phone),
      birthday: /^\d{4}-\d{2}-\d{2}$/.test(str(entry.birthday)) ? (entry.birthday as string) : "",
      notes: str(entry.notes),
      points: nonNegative(entry.points),
      stamps: nonNegative(entry.stamps),
      visits: nonNegative(entry.visits),
      spent: nonNegative(entry.spent),
      createdAt: epoch(entry.createdAt),
      lastVisit: num(entry.lastVisit),
      smsOptIn: bool(entry.smsOptIn, true),
      referral: str(entry.referral),
      referredBy: typeof entry.referredBy === "string" ? entry.referredBy : undefined,
      favoriteId: typeof entry.favoriteId === "string" ? entry.favoriteId : undefined,
      giftYear: nonNegative(entry.giftYear),
      walletBalance: nonNegative(entry.walletBalance),
    }))
    .slice(0, CUSTOMERS_CAP);
}

function orders(raw: unknown): Order[] {
  return arr(raw)
    .map((entry) => row(entry))
    .filter((entry): entry is Row => entry !== null && typeof entry.id === "string" && entry.id.length > 0)
    .map((entry) => {
      const lines = arr(entry.lines)
        .map((line) => row(line))
        .filter((line): line is Row => line !== null && typeof line.itemId === "string")
        .map((line) => ({
          itemId: line.itemId as string,
          nameFa: str(line.nameFa),
          nameEn: str(line.nameEn),
          qty: Math.min(999, Math.max(0, num(line.qty, 1))),
          unitPrice: nonNegative(line.unitPrice),
          unitCogs: nonNegative(line.unitCogs),
          mods: arr(line.mods)
            .map((mod) => row(mod))
            .filter((mod): mod is Row => mod !== null)
            .map((mod) => ({
              id: str(mod.id),
              nameFa: str(mod.nameFa),
              nameEn: str(mod.nameEn),
              price: nonNegative(mod.price),
            })),
        }));
      return {
        id: entry.id as string,
        number: Math.max(0, Math.round(num(entry.number))),
        at: epoch(entry.at),
        lines,
        subtotal: nonNegative(entry.subtotal),
        manualOff: nonNegative(entry.manualOff),
        stampOff: nonNegative(entry.stampOff),
        giftOff: nonNegative(entry.giftOff),
        tierOff: nonNegative(entry.tierOff),
        pointsOff: nonNegative(entry.pointsOff),
        pointsRedeemed: nonNegative(entry.pointsRedeemed),
        pointsEarned: nonNegative(entry.pointsEarned),
        bonusPoints: nonNegative(entry.bonusPoints),
        total: nonNegative(entry.total),
        cogs: nonNegative(entry.cogs),
        pay: oneOf(entry.pay, PAYS, "card"),
        customerId: typeof entry.customerId === "string" ? entry.customerId : undefined,
        guestName: typeof entry.guestName === "string" ? entry.guestName : undefined,
        stampsAfter: typeof entry.stampsAfter === "number" ? entry.stampsAfter : undefined,
        pointsAfter: typeof entry.pointsAfter === "number" ? entry.pointsAfter : undefined,
        stampRedeemed: bool(entry.stampRedeemed, false),
        giftUsed: bool(entry.giftUsed, false),
        note: str(entry.note).slice(0, 140),
      } satisfies Order;
    })
    .slice(0, ORDERS_CAP);
}

function expenses(raw: unknown): Expense[] {
  return arr(raw)
    .map((entry) => row(entry))
    .filter((entry): entry is Row => entry !== null && typeof entry.id === "string" && entry.id.length > 0)
    .map((entry) => ({
      id: entry.id as string,
      at: epoch(entry.at),
      category: oneOf(entry.category, EXPENSE_CATS, "other"),
      amount: nonNegative(entry.amount),
      note: str(entry.note),
      method: oneOf(entry.method, ["cash", "card", "transfer"] as const, "cash"),
    }))
    .slice(0, EXPENSES_CAP);
}

function moves(raw: unknown): DeskData["moves"] {
  return arr(raw)
    .map((entry) => row(entry))
    .filter((entry): entry is Row => entry !== null && typeof entry.id === "string" && entry.id.length > 0)
    .map((entry) => ({
      id: entry.id as string,
      at: epoch(entry.at),
      sku: str(entry.sku),
      qty: num(entry.qty),
      reason: oneOf(entry.reason, REASONS, "adjust"),
      note: str(entry.note),
    }))
    .slice(0, MOVES_CAP);
}

function cashMoves(raw: unknown): CashMove[] {
  return arr(raw)
    .map((entry) => row(entry))
    .filter((entry): entry is Row => entry !== null && typeof entry.id === "string" && entry.id.length > 0)
    .map((entry) => ({
      id: entry.id as string,
      at: epoch(entry.at),
      amount: num(entry.amount),
      note: str(entry.note),
    }))
    .slice(0, CASH_CAP);
}

function customerCreditMoves(raw: unknown): CustomerCreditMove[] {
  return arr(raw).map(row).filter((entry): entry is Row => entry !== null && typeof entry.customerId === "string")
    .map((entry) => ({
      id: str(entry.id, "wallet-move"), at: epoch(entry.at), customerId: entry.customerId as string,
      amount: num(entry.amount), kind: oneOf(entry.kind, ["topup", "sale"] as const, "topup"),
      method: (entry.method === "cash" || entry.method === "card" || entry.method === "transfer" ? entry.method : undefined) as CustomerCreditMove["method"],
      orderId: typeof entry.orderId === "string" ? entry.orderId : undefined,
      note: str(entry.note).slice(0, 140),
    })).slice(0, 1000);
}

function smsLogs(raw: unknown): SmsLog[] {
  return arr(raw)
    .map((entry) => row(entry))
    .filter((entry): entry is Row => entry !== null && typeof entry.id === "string" && entry.id.length > 0)
    .map((entry) => ({
      id: entry.id as string,
      at: epoch(entry.at),
      to: arr(entry.to).map((to) => str(to)).filter(Boolean),
      body: str(entry.body),
      kind: oneOf(entry.kind, SMS_KINDS, "campaign"),
      status: oneOf(entry.status, ["sent", "demo", "failed"] as const, "failed"),
      detail: str(entry.detail),
    }))
    .slice(0, SMS_CAP);
}

function closes(raw: unknown): CloseOut[] {
  return arr(raw)
    .map((entry) => row(entry))
    .filter((entry): entry is Row => entry !== null && typeof entry.id === "string" && entry.id.length > 0)
    .map((entry) => ({
      id: entry.id as string,
      at: epoch(entry.at),
      sales: nonNegative(entry.sales),
      cash: nonNegative(entry.cash),
      card: nonNegative(entry.card),
      online: nonNegative(entry.online),
      wallet: nonNegative(entry.wallet),
      expenses: nonNegative(entry.expenses),
      drawer: num(entry.drawer),
      note: str(entry.note),
    }))
    .slice(0, CLOSES_CAP);
}

function settings(raw: unknown): Settings {
  const base = defaultSettings();
  const patch = row(raw);
  if (!patch) return base;
  return {
    ...base,
    lang: oneOf(patch.lang, ["fa", "en"] as const, base.lang),
    addressFa: str(patch.addressFa, base.addressFa),
    addressEn: str(patch.addressEn, base.addressEn),
    phone: str(patch.phone, base.phone),
    instagram: str(patch.instagram, base.instagram),
    pointsPer: nonNegative(patch.pointsPer, base.pointsPer),
    pointValue: nonNegative(patch.pointValue, base.pointValue),
    stampGoal: Math.max(1, nonNegative(patch.stampGoal, base.stampGoal)),
    compCap: nonNegative(patch.compCap, base.compCap),
    slowStart: Math.min(23, Math.max(0, Math.round(num(patch.slowStart, base.slowStart)))),
    slowEnd: Math.min(24, Math.max(0, Math.round(num(patch.slowEnd, base.slowEnd)))),
    referralBonus: nonNegative(patch.referralBonus, base.referralBonus),
    float: num(patch.float, base.float),
    smsApiKey: str(patch.smsApiKey).slice(0, 200),
    smsLine: str(patch.smsLine).slice(0, 24),
    pecPin: str(patch.pecPin).slice(0, 80),
    pecCallbackUrl: str(patch.pecCallbackUrl).slice(0, 300),
    posType: patch.posType === "SERIAL" ? "SERIAL" : "LAN",
    posIp: str(patch.posIp).slice(0, 45),
    posPort: nonNegative(patch.posPort, base.posPort) % 65536,
    posComPort: str(patch.posComPort).slice(0, 16),
    paper: patch.paper === 58 ? 58 : 80,
    baud: patch.baud === 115200 ? 115200 : 9600,
    autoPrint: bool(patch.autoPrint, base.autoPrint),
    autoSms: bool(patch.autoSms, base.autoSms),
  };
}

/**
 * Validate + normalize an untrusted snapshot. Returns null when the payload is
 * not recognizably desk data at all (no menu array), so the caller can reject
 * instead of silently resetting a good store.
 */
export function sanitizeDeskData(raw: unknown): DeskData | null {
  const data = row(raw);
  if (!data || !Array.isArray(data.menu)) return null;
  return {
    menu: menu(data.menu),
    stock: stock(data.stock),
    customers: customers(data.customers),
    orders: orders(data.orders),
    expenses: expenses(data.expenses),
    moves: moves(data.moves),
    cashMoves: cashMoves(data.cashMoves),
    customerCreditMoves: customerCreditMoves(data.customerCreditMoves),
    smsLogs: smsLogs(data.smsLogs),
    closes: closes(data.closes),
    settings: settings(data.settings),
    credit:
      row(data.credit) === null
        ? null
        : (() => {
            const credit = row(data.credit)!;
            return { value: nonNegative(credit.value), at: epoch(credit.at) };
          })(),
  };
}
