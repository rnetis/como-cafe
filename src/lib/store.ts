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
  DeskData,
  Expense,
  MenuItem,
  Order,
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
  addMenuItem: (item: Pick<MenuItem, "nameFa" | "nameEn" | "category" | "price">) => void;
  receive: (sku: string, qty: number, cost: number, payCash: boolean) => void;
  waste: (sku: string, qty: number, note: string) => void;
  setCount: (sku: string, next: number) => void;
  addExpense: (expense: Omit<Expense, "id" | "at">) => void;
  patchCustomer: (id: string, patch: Partial<Customer>) => void;
  addCustomer: (input: { name: string; phone: string; birthday: string; notes: string }) => string | "phone" | "bad";
  removeCustomer: (id: string) => void;
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
      setPrice: (id, price) =>
        set((state) => ({
          menu: state.menu.map((item) =>
            item.id === id ? { ...item, price: Math.max(0, Math.round(price)) } : item,
          ),
        })),
      toggleItem: (id) =>
        set((state) => ({
          menu: state.menu.map((item) => (item.id === id ? { ...item, active: !item.active } : item)),
        })),
      addMenuItem: (item) =>
        set((state) => ({
          menu: [
            ...state.menu,
            {
              id: uid("item"),
              category: item.category,
              nameFa: item.nameFa.trim() || "بدون نام",
              nameEn: item.nameEn.trim() || "Untitled",
              price: Math.max(0, Math.round(item.price)),
              recipe: [],
              active: true,
            },
          ],
        })),
      receive: (sku, qty, cost, payCash) => {
        if (qty <= 0) return;
        set((state) => {
          const item = state.stock.find((entry) => entry.sku === sku);
          if (!item) return state;
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
      },
      waste: (sku, qty, note) => {
        if (qty <= 0) return;
        set((state) => ({
          stock: state.stock.map((entry) =>
            entry.sku === sku ? { ...entry, onHand: entry.onHand - qty } : entry,
          ),
          moves: [move(sku, -qty, "waste", note), ...state.moves].slice(0, 300),
        }));
      },
      setCount: (sku, next) =>
        set((state) => {
          const item = state.stock.find((entry) => entry.sku === sku);
          if (!item) return state;
          const delta = next - item.onHand;
          return {
            stock: state.stock.map((entry) =>
              entry.sku === sku ? { ...entry, onHand: next } : entry,
            ),
            moves: [move(sku, delta, "adjust", "شمارش"), ...state.moves].slice(0, 300),
          };
        }),
      addExpense: (expense) =>
        set((state) => ({
          expenses: [
            { ...expense, id: uid("ex"), at: Date.now(), amount: Math.max(0, expense.amount) },
            ...state.expenses,
          ].slice(0, 400),
        })),
      patchCustomer: (id, patch) =>
        set((state) => ({
          customers: state.customers.map((entry) => {
            if (entry.id !== id) return entry;
            const phone = patch.phone ? normPhone(patch.phone) : entry.phone;
            if (state.customers.some((other) => other.id !== id && other.phone === phone)) {
              return entry;
            }
            return { ...entry, ...patch, phone };
          }),
        })),
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
            },
            ...state.customers,
          ],
        }));
        return id;
      },
      removeCustomer: (id) =>
        set((state) => ({ customers: state.customers.filter((entry) => entry.id !== id) })),
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
        smsLogs: state.smsLogs,
        closes: state.closes,
        settings: state.settings,
        credit: state.credit,
      }),
    },
  ),
);
