import { create } from "zustand";
import { persist, type PersistStorage } from "zustand/middleware";
import { applyCheckout, type CheckoutError } from "./checkout";
import { expectedDrawer } from "./figures";
import { startOfDay, uid, normPhone } from "./format";
import { initialData, snapshotOf } from "./seed";
import { sanitizeDeskData } from "./sanitize";
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
  StockItem,
  Settings,
  SmsLog,
  StockReason,
} from "./types";

type CheckoutOk = { ok: true; order: Order; warnings: string[] };
type CheckoutFail = { ok: false; error: CheckoutError };

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
  patchSettings: (patch: Partial<Settings>) => void;
  setPrice: (id: string, price: number) => void;
  toggleItem: (id: string) => void;
  saveMenuItem: (
    item: Pick<MenuItem, "id" | "nameFa" | "nameEn" | "category" | "price" | "recipe">,
  ) => boolean;
  removeMenuItem: (id: string) => boolean;
  addStockItem: (item: Omit<StockItem, "sku">) => boolean;
  receive: (sku: string, qty: number, cost: number, payCash: boolean) => boolean;
  waste: (sku: string, qty: number, note: string) => boolean;
  setCount: (sku: string, next: number) => boolean;
  addExpense: (expense: Omit<Expense, "id" | "at">) => void;
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
            { ...expense, id: uid("ex"), at: Date.now(), amount: Math.max(0, expense.amount) },
            ...state.expenses,
          ].slice(0, 400),
        })),
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
          const today = state.orders.filter((order) => order.at >= startOfDay());
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
      version: 1,
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
