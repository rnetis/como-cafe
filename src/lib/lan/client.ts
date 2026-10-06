import { create } from "zustand";
import {
  encodeLanMessage,
  LAN_PROTOCOL_VERSION,
  parseLanMessage,
  type LanOrderLine,
  type LanOrderResult,
} from "./protocol";
import type { Pay } from "../types";

/**
 * Phone/tablet side of the LAN: dial the desk's `/ws`, keep the latest books
 * snapshot, and send orders for the desk to price. The socket factory is
 * injectable so the store is testable without a real network.
 */

export type LanStatus = "idle" | "connecting" | "open" | "closed";

export type SocketLike = {
  send(data: string): void;
  close(): void;
  onopen: ((event?: unknown) => void) | null;
  onmessage: ((event: { data: string }) => void) | null;
  onclose: ((event?: unknown) => void) | null;
  onerror: ((event?: unknown) => void) | null;
};

export type SocketFactory = () => SocketLike;

type LanClientState = {
  status: LanStatus;
  snapshot: import("../types").DeskData | null;
  seq: number;
  cart: LanOrderLine[];
  busy: boolean;
  connect(factory?: SocketFactory): void;
  disconnect(): void;
  addItem(itemId: string): void;
  setQty(itemId: string, qty: number): void;
  clearCart(): void;
  sendOrder(opts: { pay: Pay; note: string }): Promise<LanOrderResult>;
};

const REQUEST_TIMEOUT_MS = 15_000;
const RECONNECT_MIN_MS = 1000;
const RECONNECT_MAX_MS = 10_000;

let socket: SocketLike | null = null;
let wanted = false;
let attempts = 0;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
const pending = new Map<string, (result: LanOrderResult) => void>();

function randomId(): string {
  const random =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().replaceAll("-", "").slice(0, 10)
      : Math.random().toString(36).slice(2, 12);
  return `lan-${random}`;
}

function sendRaw(payload: string): boolean {
  if (!socket) return false;
  try {
    socket.send(payload);
    return true;
  } catch {
    return false;
  }
}

function handleFrame(raw: string, set: (partial: Partial<LanClientState>) => void): void {
  const message = parseLanMessage(raw);
  if (!message) return;
  if (message.t === "snapshot") {
    set({ snapshot: message.data, seq: message.seq });
    return;
  }
  if (message.t === "welcome" || message.t === "pong") return;
  if (message.t === "order-applied") {
    const resolve = pending.get(message.id);
    if (resolve) {
      pending.delete(message.id);
      resolve({ ok: message.ok, error: message.error });
    }
  }
}

export const useLanClient = create<LanClientState>()((set, get) => ({
  status: "idle",
  snapshot: null,
  seq: 0,
  cart: [],
  busy: false,

  connect(factory) {
    if (wanted) return;
    wanted = true;
    const open = () => {
      if (!wanted) return;
      if (typeof window === "undefined") return;
      set({ status: "connecting" });
      const created = factory
        ? factory()
        : (new WebSocket(`${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}/ws`) as unknown as SocketLike);
      socket = created;
      created.onopen = () => {
        attempts = 0;
        set({ status: "open" });
        sendRaw(encodeLanMessage({ t: "hello", v: LAN_PROTOCOL_VERSION }));
      };
      created.onmessage = (event) => handleFrame(String(event.data), set);
      created.onclose = () => {
        socket = null;
        set({ status: "closed" });
        scheduleReconnect(open);
      };
      created.onerror = () => {
        try {
          created.close();
        } catch {
          /* the close handler schedules the retry */
        }
      };
    };
    open();
  },

  disconnect() {
    wanted = false;
    attempts = 0;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    try {
      socket?.close();
    } catch {
      /* already closed */
    }
    socket = null;
    set({ status: "idle", cart: [] });
  },

  addItem(itemId) {
    set((state) => {
      const found = state.cart.find((line) => line.itemId === itemId);
      if (found) {
        return {
          cart: state.cart.map((line) =>
            line.itemId === itemId ? { ...line, qty: Math.min(99, line.qty + 1) } : line,
          ),
        };
      }
      return { cart: [...state.cart, { itemId, qty: 1, mods: [] }] };
    });
  },

  setQty(itemId, qty) {
    set((state) => ({
      cart:
        qty <= 0
          ? state.cart.filter((line) => line.itemId !== itemId)
          : state.cart.map((line) =>
              line.itemId === itemId ? { ...line, qty: Math.min(99, qty) } : line,
            ),
    }));
  },

  clearCart() {
    set({ cart: [] });
  },

  async sendOrder({ pay, note }) {
    const cart = get().cart;
    if (cart.length === 0) return { ok: false, error: "empty" };
    if (get().status !== "open" || !socket) return { ok: false, error: "offline" };
    const id = randomId();
    set({ busy: true });
    try {
      const result = await new Promise<LanOrderResult>((resolve) => {
        const timer = setTimeout(() => {
          pending.delete(id);
          resolve({ ok: false, error: "timeout" });
        }, REQUEST_TIMEOUT_MS);
        pending.set(id, (outcome) => {
          clearTimeout(timer);
          resolve(outcome);
        });
        const sent = sendRaw(
          encodeLanMessage({
            t: "order-request",
            id,
            lines: cart.map((line) => ({ itemId: line.itemId, qty: line.qty, mods: line.mods })),
            pay,
            note,
          }),
        );
        if (!sent) {
          pending.delete(id);
          clearTimeout(timer);
          resolve({ ok: false, error: "offline" });
        }
      });
      if (result.ok) set({ cart: [] });
      return result;
    } finally {
      set({ busy: false });
    }
  },
}));

function scheduleReconnect(open: () => void): void {
  if (!wanted || reconnectTimer) return;
  attempts += 1;
  const delay = Math.min(RECONNECT_MIN_MS * 2 ** (attempts - 1), RECONNECT_MAX_MS);
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    open();
  }, delay);
}