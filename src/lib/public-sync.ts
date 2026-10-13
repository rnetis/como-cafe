import type { Customer, Order } from "./types.ts";

/**
 * Publishes customer stats to the public API (`/api/public/sync`) so the
 * separate como-menu site can show guests their own points, tier and spend.
 * Fire-and-forget with debounce: the POS never blocks or fails on it, and a
 * failed publish just waits for the next change.
 */
let timer: number | undefined;
let pending: Customer[] = [];
let inFlight = false;

export function publishCustomers(customers: Customer[], orders: Order[]) {
  pending = customers;
  if (timer !== undefined) return;
  const schedule =
    typeof window !== "undefined" && typeof window.setTimeout === "function"
      ? (fn: () => void, ms: number) => window.setTimeout(fn, ms)
      : (fn: () => void, ms: number) => setTimeout(fn, ms) as unknown as number;
  timer = schedule(() => {
    timer = undefined;
    void flush(orders);
  }, 5_000);
}

async function flush(orders: Order[]) {
  if (inFlight || pending.length === 0) return;
  inFlight = true;
  const closedByCustomer = new Map<string, number>();
  for (const order of orders) {
    if (order.status !== "closed" || !order.customerId) continue;
    closedByCustomer.set(order.customerId, (closedByCustomer.get(order.customerId) ?? 0) + 1);
  }
  const payload = pending
    .filter((c) => c.phone.replace(/\D/g, "").length >= 8)
    .slice(0, 500)
    .map((c) => ({
      phone: c.phone,
      name: c.name,
      points: c.points,
      stamps: c.stamps,
      visits: closedByCustomer.get(c.id) ?? c.visits,
      spent: c.spent,
      lastVisit: c.lastVisit,
      birthday: c.birthday,
    }));
  pending = [];
  try {
    await fetch("/api/public/sync", {
      method: "POST",
      headers: { "content-type": "application/json", "x-como-key": key() },
      body: JSON.stringify({ customers: payload }),
      keepalive: true,
    });
  } catch {
    // Silent: the stats republish on the next customer/order change.
  } finally {
    inFlight = false;
  }
}

function key() {
  // Mirror of the server's check; override in deploys via VITE_PUBLIC_API_KEY.
  const fromEnv = import.meta.env?.VITE_PUBLIC_API_KEY;
  return typeof fromEnv === "string" && fromEnv.trim() ? fromEnv.trim() : "como-local";
}
