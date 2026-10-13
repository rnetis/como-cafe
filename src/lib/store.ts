import { create } from "zustand";
import { persist, type PersistStorage } from "zustand/middleware";
import { applyCheckout, priceLines, type CheckoutError } from "./checkout.ts";
import { expectedDrawer } from "./figures.ts";
import { startOfDay, uid, normPhone } from "./format.ts";
import { earnedPoints, inSlowHour } from "./loyalty.ts";
import { initialData, snapshotOf } from "./seed.ts";
import { sanitizeDeskData } from "./sanitize.ts";
import { linesOf, reconcileStock, rollbackSale } from "./tickets.ts";
import type {
  CashMove,
  CheckoutInput,
  Customer,
  CustomerCreditMove,
  DeskData,
  Expense,
  MenuItem,
  RecipeUse,
  Order,
  Pay,
  StockItem,
  Settings,
  SmsLog,
  StockReason,
  TicketCloseInput,
  TicketInput,
} from "./types.ts";

type CheckoutOk = { ok: true; order: Order; warnings: string[] };
type CheckoutFail = { ok: false; error: CheckoutError };

/** A partial edit of one cellar ingredient. The sku itself never changes. */
export type StockPatch = Partial<
  Pick<StockItem, "nameFa" | "nameEn" | "unit" | "onHand" | "par" | "cost">
>;

/** A partial edit of one expense. The id and the row itself never move. */
export type ExpensePatch = Partial<
  Pick<Expense, "category" | "amount" | "note" | "method" | "custom" | "at">
>;

/** A partial edit of one ticket. An open tab takes anything; a closed sale
 *  takes corrections to its lines, name, note, date and method — but never a
 *  different guest, which would move loyalty between two people's books. */
export type TicketPatch = {
  lines?: { itemId: string; qty: number; mods: string[] }[];
  customerId?: string | null;
  guestName?: string;
  note?: string;
  pay?: Pay;
  /** Moves the ticket to another day; a closed ticket's `closedAt` follows. */
  at?: number;
};

type TicketPatchError = "empty" | "missing" | "locked" | "stock";
type TicketPatchResult = { ok: true; order: Order } | { ok: false; error: TicketPatchError };

/** The shape `partialize` writes: the whole DeskData minus the transient receipt id. */
type PersistedDesk = DeskData;
/** The persisted envelope zustand wraps around the partialized state. */
type PersistedEnvelope = { state: PersistedDesk; version?: number };

/**
 * localStorage wrapper that never throws. A full quota (private mode, years of
 * books) or a corrupt/half-written save must not crash a `set()` mid-shift or
 * kill the boot: failed reads return null so the desk opens on seed data, and
 * failed writes keep the in-memory store running while logging loudly.
 */
function deskStorage(): PersistStorage<PersistedDesk> | undefined {
  try {
    const raw = window.localStorage;
    return {
      getItem: (name) => {
        try {
          const text = raw.getItem(name);
          if (text === null) return null;
          return JSON.parse(text) as PersistedEnvelope;
        } catch (error) {
          console.error("[como] saved desk unreadable — starting from seed", error);
          return null;
        }
      },
      setItem: (name, value) => {
        try {
          raw.setItem(name, JSON.stringify(value));
        } catch (error) {
          console.error("[como] saving the desk failed — storage full or blocked", error);
        }
      },
      removeItem: (name) => {
        try {
          raw.removeItem(name);
        } catch (error) {
          console.error("[como] clearing the saved desk failed", error);
        }
      },
    };
  } catch {
    return undefined; // storage blocked entirely — run in-memory
  }
}

type Actions = {
  receiptId: string | null;
  openReceipt: (id: string | null) => void;
  checkout: (input: CheckoutInput) => CheckoutOk | CheckoutFail;
  openTicket: (input: TicketInput) => TicketPatchResult;
  patchTicket: (id: string, patch: TicketPatch) => TicketPatchResult;
  deleteTicket: (id: string) => boolean;
  closeTicket: (
    id: string,
    input: TicketCloseInput,
  ) => CheckoutOk | CheckoutFail | { ok: false; error: "missing" | "locked" };
  patchSettings: (patch: Partial<Settings>) => void;
  setPrice: (id: string, price: number) => void;
  toggleItem: (id: string) => void;
  saveMenuItem: (
    item: Pick<MenuItem, "id" | "nameFa" | "nameEn" | "category" | "price" | "recipe">,
  ) => boolean;
  removeMenuItem: (id: string) => boolean;
  addStockItem: (item: Omit<StockItem, "sku">) => boolean;
  patchStockItem: (sku: string, patch: StockPatch) => boolean;
  removeStockItem: (sku: string) => boolean;
  receive: (sku: string, qty: number, cost: number, payCash: boolean) => boolean;
  waste: (sku: string, qty: number, note: string) => boolean;
  setCount: (sku: string, next: number) => boolean;
  addExpense: (expense: Omit<Expense, "id" | "at">) => void;
  patchExpense: (id: string, patch: ExpensePatch) => boolean;
  removeExpense: (id: string) => boolean;
  patchCustomer: (id: string, patch: Partial<Customer>) => boolean;
  addCustomer: (input: {
    name: string;
    phone: string;
    birthday: string;
    notes: string;
  }) => string | "phone" | "bad";
  removeCustomer: (id: string) => boolean;
  addCustomerCredit: (id: string, amount: number, method: "cash" | "card" | "transfer", note: string) => boolean;
  logSms: (entry: Omit<SmsLog, "id" | "at">) => void;
  setCredit: (value: number) => void;
  closeDay: (note: string) => void;
  importBackup: (raw: unknown) => boolean;
  reset: () => void;
};

export type CafeStore = DeskData & Actions;

function move(
  sku: string,
  qty: number,
  reason: StockReason,
  note: string,
): CafeStore["moves"][number] {
  return { id: uid("mv"), at: Date.now(), sku, qty, reason, note };
}

export const useCafe = create<CafeStore>()(
  persist(
    (set, get) => ({
      ...initialData(),
      receiptId: null,
      openReceipt: (id) => set({ receiptId: id }),
      checkout: (input) => {
        const applied = applyCheckout(snapshotOf(get()), input);
        if (!applied.ok) return applied;
        set(applied.data);
        return { ok: true, order: applied.order, warnings: applied.warnings };
      },
      openTicket: (input) => {
        const data = snapshotOf(get());
        const priced = priceLines(data, input.lines);
        if (!priced.ok) return priced;
        const customer = input.customerId
          ? data.customers.find((entry) => entry.id === input.customerId)
          : undefined;
        const number = data.orders.reduce((max, order) => Math.max(max, order.number), 0) + 1;
        const order: Order = {
          id: uid("ord"),
          number,
          status: "open",
          at: Date.now(),
          lines: priced.orderLines,
          subtotal: priced.subtotal,
          // Nothing is discounted, earned or consumed while a ticket is open —
          // closing it runs the full register rules over these same lines.
          manualOff: 0,
          stampOff: 0,
          giftOff: 0,
          tierOff: 0,
          pointsOff: 0,
          pointsRedeemed: 0,
          pointsEarned: 0,
          bonusPoints: 0,
          total: priced.subtotal,
          cogs: priced.orderLines.reduce((sum, line) => sum + line.unitCogs * line.qty, 0),
          pay: "cash", // replaced with the real method when the ticket closes
          customerId: customer?.id,
          guestName: input.guestName?.trim().slice(0, 60) || customer?.name || undefined,
          stampRedeemed: false,
          giftUsed: false,
          note: input.note.trim().slice(0, 140),
        };
        set((state) => ({ orders: [order, ...state.orders].slice(0, 500) }));
        return { ok: true, order };
      },
      patchTicket: (id, patch) => {
        const ticket = get().orders.find((entry) => entry.id === id);
        if (!ticket) return { ok: false, error: "missing" };
        // Handing a settled sale to somebody else would move spend, points and
        // stamps between two guests' books. Everything else on it is correctable.
        if (ticket.status === "closed" && patch.customerId !== undefined)
          return { ok: false, error: "locked" };
        const data = snapshotOf(get());
        let lines = ticket.lines;
        let subtotal = ticket.subtotal;
        let cogs = ticket.cogs;
        if (patch.lines !== undefined) {
          const priced = priceLines(data, patch.lines);
          if (!priced.ok) return priced;
          lines = priced.orderLines;
          subtotal = priced.subtotal;
          cogs = priced.orderLines.reduce((sum, line) => sum + line.unitCogs * line.qty, 0);
        }
        const guestName =
          patch.guestName === undefined
            ? ticket.guestName
            : patch.guestName.trim().slice(0, 60) || undefined;
        const customerId =
          patch.customerId === undefined
            ? ticket.customerId
            : patch.customerId === null
              ? undefined
              : data.customers.some((entry) => entry.id === patch.customerId)
                ? patch.customerId
                : ticket.customerId;
        const note = patch.note === undefined ? ticket.note : patch.note.trim().slice(0, 140);
        const at =
          patch.at !== undefined && Number.isFinite(patch.at) ? Math.round(patch.at) : ticket.at;

        if (ticket.status === "open") {
          const updated: Order = {
            ...ticket,
            lines,
            subtotal,
            cogs,
            guestName,
            customerId,
            note,
            at,
            total: subtotal,
          };
          set((state) => ({
            orders: state.orders.map((entry) => (entry.id === id ? updated : entry)),
          }));
          return { ok: true, order: updated };
        }

        // A closed ticket is a sale already written down. Correcting its lines
        // means moving the cellar and the guest's books to match, so the
        // correction is all-or-nothing: a version we cannot afford never lands.
        const edited = patch.lines !== undefined;
        const reconciled = edited
          ? reconcileStock(data, ticket.lines, linesOf(lines), ticket.number, at)
          : null;
        if (reconciled && !reconciled.ok) return { ok: false, error: "stock" };

        // The offsets recorded at close (discount, stamp, gift, tier, points)
        // are absolute toman. They stay as recorded; the total just never goes
        // below zero when a corrected ticket comes out cheaper than its offsets.
        const offsets =
          ticket.manualOff + ticket.stampOff + ticket.giftOff + ticket.tierOff + ticket.pointsOff;
        const total = Math.max(0, subtotal - offsets);
        const pointsEarned = ticket.customerId
          ? earnedPoints(total, data.settings.pointsPer, inSlowHour(at, data.settings.slowStart, data.settings.slowEnd))
          : 0;
        const spentDelta = total - ticket.total;
        const pointsDelta = pointsEarned - ticket.pointsEarned;
        const qtyDelta = edited
          ? lines.reduce((sum, line) => sum + line.qty, 0) -
            ticket.lines.reduce((sum, line) => sum + line.qty, 0)
          : 0;

        const updated: Order = {
          ...ticket,
          lines,
          subtotal,
          cogs,
          guestName,
          note,
          at,
          closedAt: at === ticket.at ? ticket.closedAt : at,
          pay: patch.pay ?? ticket.pay,
          total,
          pointsEarned,
          pointsAfter:
            ticket.pointsAfter === undefined
              ? undefined
              : Math.max(0, ticket.pointsAfter + pointsDelta),
          stampsAfter:
            ticket.stampsAfter === undefined
              ? undefined
              : Math.max(0, ticket.stampsAfter + qtyDelta),
        };

        const customers =
          ticket.customerId && (spentDelta !== 0 || pointsDelta !== 0 || qtyDelta !== 0)
            ? data.customers.map((entry) =>
                entry.id === ticket.customerId
                  ? {
                      ...entry,
                      spent: Math.max(0, entry.spent + spentDelta),
                      points: Math.max(0, entry.points + pointsDelta),
                      stamps: Math.max(0, entry.stamps + qtyDelta),
                    }
                  : entry,
              )
            : data.customers;

        set((state) => ({
          orders: state.orders.map((entry) => (entry.id === id ? updated : entry)),
          ...(reconciled && reconciled.ok ? { stock: reconciled.stock, moves: reconciled.moves } : {}),
          ...(customers === data.customers ? {} : { customers }),
        }));
        return { ok: true, order: updated };
      },
      deleteTicket: (id) => {
        const ticket = get().orders.find((entry) => entry.id === id);
        if (!ticket) return false;
        if (ticket.status === "open") {
          // An open tab never touched the books, so it can go without a trace.
          set((state) => ({
            orders: state.orders.filter((entry) => entry.id !== id),
            receiptId: state.receiptId === id ? null : state.receiptId,
          }));
          return true;
        }
        // A closed ticket is a sale. Deleting it undoes everything the close
        // wrote: the ingredient it pulled, the loyalty it landed, the credit it
        // drew on. Day closes already recorded stay as they were — they are
        // snapshots of a moment, not a live sum.
        const rolled = rollbackSale(snapshotOf(get()), ticket, Date.now());
        set((state) => ({
          stock: rolled.stock,
          moves: rolled.moves,
          customers: rolled.customers,
          customerCreditMoves: rolled.customerCreditMoves,
          orders: state.orders.filter((entry) => entry.id !== id),
          receiptId: state.receiptId === id ? null : state.receiptId,
        }));
        return true;
      },
      closeTicket: (id, input) => {
        const ticket = get().orders.find((entry) => entry.id === id);
        if (!ticket) return { ok: false, error: "missing" };
        if (ticket.status !== "open") return { ok: false, error: "locked" };
        // Closing is the sale: the register's own rules run over the ticket's
        // lines, so stock, loyalty and money land exactly as a direct sale.
        const applied = applyCheckout(snapshotOf(get()), {
          lines: ticket.lines.map((line) => ({
            itemId: line.itemId,
            qty: line.qty,
            mods: line.mods.map((mod) => mod.id),
          })),
          pay: input.pay,
          note: input.note === undefined ? ticket.note : input.note.trim().slice(0, 140),
          customerId: ticket.customerId,
          discountPct: input.discountPct,
          useStamp: input.useStamp,
          useGift: input.useGift,
          redeemPoints: input.redeemPoints,
        });
        if (!applied.ok) return applied;
        const closed: Order = {
          ...applied.order,
          id: ticket.id,
          number: ticket.number,
          status: "closed",
          at: ticket.at,
          closedAt: Date.now(),
        };
        set({
          ...applied.data,
          // The register stamped the sale's stock moves with the number it
          // minted for itself; the tab keeps its own number, so the movement
          // log follows the ticket the guests actually hold.
          moves: applied.data.moves.map((entry) =>
            entry.reason === "sale" && entry.note === `#${applied.order.number}`
              ? { ...entry, note: `#${ticket.number}` }
              : entry,
          ),
          // The close reuses the ticket: the register minted a fresh order for
          // the money (applied.order), so drop that one and the open tab, and
          // put the settled ticket back under its own number.
          orders: [
            closed,
            ...applied.data.orders.filter(
              (entry) => entry.id !== ticket.id && entry.id !== applied.order.id,
            ),
          ].slice(0, 500),
        });
        return { ok: true, order: closed, warnings: applied.warnings };
      },
      patchSettings: (patch) => set((state) => ({ settings: { ...state.settings, ...patch } })),
      setPrice: (id, price) => {
        if (!Number.isFinite(price) || price <= 0) return;
        set((state) => ({
          menu: state.menu.map((item) =>
            item.id === id ? { ...item, price: Math.round(price) } : item,
          ),
        }));
      },
      toggleItem: (id) =>
        set((state) => ({
          menu: state.menu.map((item) =>
            item.id === id ? { ...item, active: !item.active } : item,
          ),
        })),
      saveMenuItem: (item) => {
        const nameFa = item.nameFa.trim();
        const nameEn = item.nameEn.trim();
        if (!nameFa || !nameEn || !Number.isFinite(item.price) || item.price <= 0) return false;
        const seen = new Set<string>();
        const recipe: RecipeUse[] = [];
        for (const use of item.recipe) {
          if (
            !get().stock.some((entry) => entry.sku === use.sku) ||
            !Number.isFinite(use.qty) ||
            use.qty <= 0
          )
            return false;
          if (seen.has(use.sku)) return false;
          seen.add(use.sku);
          recipe.push({ sku: use.sku, qty: Math.round(use.qty * 1000) / 1000 });
        }
        set((state) => {
          const existing = item.id ? state.menu.find((entry) => entry.id === item.id) : undefined;
          const saved: MenuItem = {
            id: existing?.id ?? uid("item"),
            category: item.category,
            nameFa,
            nameEn,
            price: Math.round(item.price),
            recipe,
            active: existing?.active ?? true,
          };
          return {
            menu: existing
              ? state.menu.map((entry) => (entry.id === existing.id ? saved : entry))
              : [...state.menu, saved],
          };
        });
        return true;
      },
      removeMenuItem: (id) => {
        if (get().orders.some((order) => order.lines.some((line) => line.itemId === id)))
          return false;
        set((state) => ({ menu: state.menu.filter((entry) => entry.id !== id) }));
        return true;
      },
      patchStockItem: (sku, patch) => {
        const current = get().stock.find((entry) => entry.sku === sku);
        if (!current) return false;
        const nameFa = patch.nameFa === undefined ? current.nameFa : patch.nameFa.trim();
        const nameEn = patch.nameEn === undefined ? current.nameEn : patch.nameEn.trim();
        const onHand =
          patch.onHand === undefined ? current.onHand : Math.round(patch.onHand * 1000) / 1000;
        const par = patch.par === undefined ? current.par : Math.round(patch.par * 1000) / 1000;
        const cost = patch.cost === undefined ? current.cost : Math.round(patch.cost);
        if (!nameFa || !nameEn) return false;
        if (![onHand, par, cost].every((value) => Number.isFinite(value) && value >= 0)) return false;
        if (
          get().stock.some(
            (entry) =>
              entry.sku !== sku &&
              (entry.nameEn.toLowerCase() === nameEn.toLowerCase() || entry.nameFa === nameFa),
          )
        )
          return false;
        const unit = patch.unit ?? current.unit;
        const delta = Math.round((onHand - current.onHand) * 1000) / 1000;
        set((state) => ({
          stock: state.stock.map((entry) =>
            entry.sku === sku ? { ...entry, nameFa, nameEn, unit, onHand, par, cost } : entry,
          ),
          // A count typed straight into the edit form is still a count: the
          // movement log keeps saying who moved what, and why.
          moves:
            Math.abs(delta) > 1e-9
              ? [move(sku, delta, "adjust", "ویرایش"), ...state.moves].slice(0, 300)
              : state.moves,
        }));
        return true;
      },
      removeStockItem: (sku) => {
        const item = get().stock.find((entry) => entry.sku === sku);
        if (!item) return false;
        // An ingredient still on a recipe cannot vanish — the drink would stop
        // consuming stock behind everyone's back. Pull it from the menu first.
        if (get().menu.some((entry) => entry.recipe.some((use) => use.sku === sku))) return false;
        set((state) => ({
          stock: state.stock.filter((entry) => entry.sku !== sku),
          moves: state.moves.filter((entry) => entry.sku !== sku),
        }));
        return true;
      },
      addStockItem: (item) => {
        const nameFa = item.nameFa.trim();
        const nameEn = item.nameEn.trim();
        if (
          !nameFa ||
          !nameEn ||
          !Number.isFinite(item.onHand) ||
          item.onHand < 0 ||
          !Number.isFinite(item.par) ||
          item.par < 0 ||
          !Number.isFinite(item.cost) ||
          item.cost < 0
        )
          return false;
        if (
          get().stock.some(
            (entry) =>
              entry.nameEn.toLowerCase() === nameEn.toLowerCase() || entry.nameFa === nameFa,
          )
        )
          return false;
        const sku = `ing-${uid("sku").slice(-8)}`;
        set((state) => ({
          stock: [
            ...state.stock,
            {
              ...item,
              sku,
              nameFa,
              nameEn,
              onHand: Math.round(item.onHand * 1000) / 1000,
              par: Math.round(item.par * 1000) / 1000,
              cost: Math.round(item.cost),
            },
          ],
        }));
        return true;
      },
      receive: (sku, qty, cost, payCash) => {
        if (!Number.isFinite(qty) || qty <= 0 || !Number.isFinite(cost) || cost < 0) return false;
        let changed = false;
        set((state) => {
          const item = state.stock.find((entry) => entry.sku === sku);
          if (!item) return state;
          changed = true;
          const base = Math.max(0, item.onHand);
          const nextCost =
            cost > 0 ? Math.round((base * item.cost + qty * cost) / (base + qty)) : item.cost;
          const paid = cost > 0 ? cost : item.cost;
          const cash: CashMove[] = payCash
            ? [
                {
                  id: uid("cash"),
                  at: Date.now(),
                  amount: -Math.round(qty * paid),
                  note: item.nameFa,
                },
                ...state.cashMoves,
              ]
            : state.cashMoves;
          return {
            stock: state.stock.map((entry) =>
              entry.sku === sku ? { ...entry, onHand: entry.onHand + qty, cost: nextCost } : entry,
            ),
            moves: [move(sku, qty, "purchase", item.nameFa), ...state.moves].slice(0, 300),
            cashMoves: cash.slice(0, 300),
          };
        });
        return changed;
      },
      waste: (sku, qty, note) => {
        if (!Number.isFinite(qty) || qty <= 0) return false;
        let changed = false;
        set((state) => {
          const item = state.stock.find((entry) => entry.sku === sku);
          if (!item || item.onHand < qty) return state;
          changed = true;
          return {
            stock: state.stock.map((entry) =>
              entry.sku === sku ? { ...entry, onHand: entry.onHand - qty } : entry,
            ),
            moves: [move(sku, -qty, "waste", note), ...state.moves].slice(0, 300),
          };
        });
        return changed;
      },
      setCount: (sku, next) => {
        if (!Number.isFinite(next) || next < 0) return false;
        let changed = false;
        set((state) => {
          const item = state.stock.find((entry) => entry.sku === sku);
          if (!item) return state;
          changed = true;
          const delta = next - item.onHand;
          return {
            stock: state.stock.map((entry) =>
              entry.sku === sku ? { ...entry, onHand: next } : entry,
            ),
            moves: [move(sku, delta, "adjust", "شمارش"), ...state.moves].slice(0, 300),
          };
        });
        return changed;
      },
      addExpense: (expense) =>
        set((state) => ({
          expenses: [
            {
              ...expense,
              id: uid("ex"),
              at: Date.now(),
              amount: Math.max(0, Math.round(expense.amount)),
              note: expense.note.trim().slice(0, 140),
              custom: expense.custom.trim().slice(0, 140),
            },
            ...state.expenses,
          ].slice(0, 400),
        })),
      patchExpense: (id, patch) => {
        const current = get().expenses.find((entry) => entry.id === id);
        if (!current) return false;
        const amount = patch.amount === undefined ? current.amount : Math.round(patch.amount);
        if (!Number.isFinite(amount) || amount < 0) return false;
        const at =
          patch.at === undefined || !Number.isFinite(patch.at) ? current.at : Math.round(patch.at);
        set((state) => ({
          expenses: state.expenses.map((entry) =>
            entry.id === id
              ? {
                  ...entry,
                  ...patch,
                  amount,
                  at,
                  note: (patch.note ?? entry.note).trim().slice(0, 140),
                  custom: (patch.custom ?? entry.custom).trim().slice(0, 140),
                }
              : entry,
          ),
        }));
        return true;
      },
      removeExpense: (id) => {
        if (!get().expenses.some((entry) => entry.id === id)) return false;
        set((state) => ({ expenses: state.expenses.filter((entry) => entry.id !== id) }));
        return true;
      },
      patchCustomer: (id, patch) => {
        const current = get().customers.find((entry) => entry.id === id);
        if (!current) return false;
        const phone = patch.phone === undefined ? current.phone : normPhone(patch.phone);
        const name = patch.name === undefined ? current.name : patch.name.trim();
        if (!name || (patch.phone !== undefined && !/^09\d{9}$/.test(phone))) return false;
        if (patch.phone !== undefined && get().customers.some((other) => other.id !== id && other.phone === phone)) return false;
        if (patch.points !== undefined && (!Number.isFinite(patch.points) || patch.points < 0)) return false;
        set((state) => ({ customers: state.customers.map((entry) => entry.id === id ? { ...entry, ...patch, name, phone } : entry) }));
        return true;
      },
      addCustomer: (input) => {
        const phone = normPhone(input.phone);
        if (!/^09\d{9}$/.test(phone)) return "bad";
        if (get().customers.some((entry) => entry.phone === phone)) return "phone";
        const id = uid("c");
        const now = Date.now();
        set((state) => ({
          customers: [
            {
              id,
              name: input.name.trim() || (state.settings.lang === "fa" ? "مهمان" : "Guest"),
              phone,
              birthday: input.birthday,
              notes: input.notes.trim(),
              points: 0,
              stamps: 0,
              visits: 0,
              spent: 0,
              createdAt: now,
              lastVisit: 0,
              smsOptIn: true,
              referral: `C${phone.slice(-4)}`,
              giftYear: 0,
              walletBalance: 0,
            },
            ...state.customers,
          ],
        }));
        return id;
      },
      removeCustomer: (id) => {
        const customer = get().customers.find((entry) => entry.id === id);
        if (!customer || customer.walletBalance > 0 || get().orders.some((order) => order.customerId === id) || get().customerCreditMoves.some((move) => move.customerId === id)) return false;
        set((state) => ({ customers: state.customers.filter((entry) => entry.id !== id) }));
        return true;
      },
      addCustomerCredit: (id, amount, method, note) => {
        if (!Number.isFinite(amount) || amount <= 0 || !["cash", "card", "transfer"].includes(method)) return false;
        const customer = get().customers.find((entry) => entry.id === id);
        if (!customer) return false;
        const value = Math.round(amount);
        const entry: CustomerCreditMove = { id: uid("wallet"), at: Date.now(), customerId: id, amount: value, kind: "topup", method, note: note.trim().slice(0, 140) || "Wallet top-up" };
        set((state) => ({
          customers: state.customers.map((item) => item.id === id ? { ...item, walletBalance: item.walletBalance + value } : item),
          customerCreditMoves: [entry, ...state.customerCreditMoves].slice(0, 1000),
          cashMoves: method === "cash" ? [ { id: uid("cash"), at: entry.at, amount: value, note: `${customer.name} · credit top-up` }, ...state.cashMoves ].slice(0, 300) : state.cashMoves,
        }));
        return true;
      },
      logSms: (entry) =>
        set((state) => ({
          smsLogs: [{ ...entry, id: uid("sms"), at: Date.now() }, ...state.smsLogs].slice(0, 80),
        })),
      setCredit: (value) => set({ credit: { value, at: Date.now() } }),
      closeDay: (note) =>
        set((state) => {
          const today = state.orders.filter(
            (order) => order.status === "closed" && order.at >= startOfDay(),
          );
          const expenses = state.expenses
            .filter((expense) => expense.at >= startOfDay())
            .reduce((sum, expense) => sum + expense.amount, 0);
          return {
            closes: [
              {
                id: uid("close"),
                at: Date.now(),
                sales: today.reduce((sum, order) => sum + order.total, 0),
                cash: today
                  .filter((order) => order.pay === "cash")
                  .reduce((sum, order) => sum + order.total, 0),
                card: today
                  .filter((order) => order.pay === "card")
                  .reduce((sum, order) => sum + order.total, 0),
                online: today
                  .filter((order) => order.pay === "online")
                  .reduce((sum, order) => sum + order.total, 0),
                wallet: today.filter((order) => order.pay === "wallet").reduce((sum, order) => sum + order.total, 0),
                expenses,
                drawer: expectedDrawer(snapshotOf(state)),
                note: note.trim(),
              },
              ...state.closes,
            ].slice(0, 60),
          };
        }),
      importBackup: (raw) => {
        // Same firewall as rehydration: a bad file is coerced or rejected, never
        // merged raw into the books.
        const data = sanitizeDeskData(raw);
        if (!data) return false;
        set({ ...data, receiptId: null });
        return true;
      },
      reset: () => set({ ...initialData(), receiptId: null }),
    }),
    {
      name: "como-desk-v1",
      // Bump when DeskData changes shape; migrate() coerces older saves.
      // 2 — every expense carries its own `custom` value.
      version: 2,
      // Rehydrated payloads pass the same firewall as restored backups — an
      // old or hand-edited save becomes a complete DeskData instead of
      // crashing the desk on boot.
      migrate: (persisted) => sanitizeDeskData(persisted) ?? initialData(),
      // merge runs on EVERY hydration (migrate only fires on version
      // mismatch), so a same-version corrupt-but-parseable save is sanitized
      // here too — nothing reaches the store unvalidated.
      merge: (persisted, current) => {
        const clean = sanitizeDeskData(persisted);
        return clean ? { ...current, ...clean } : current;
      },
      storage: deskStorage(),
      partialize: (state) => ({
        menu: state.menu,
        stock: state.stock,
        customers: state.customers,
        orders: state.orders,
        expenses: state.expenses,
        moves: state.moves,
        cashMoves: state.cashMoves,
        customerCreditMoves: state.customerCreditMoves,
        smsLogs: state.smsLogs,
        closes: state.closes,
        settings: state.settings,
        credit: state.credit,
      }),
    },
  ),
);
