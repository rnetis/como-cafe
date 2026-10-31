import type { Customer, Order } from "./types.ts";

/**
 * Publishes customer stats to the public API (`/api/public/sync`) so the
 * separate como-menu site can show guests their own points, tier and spend.
 * Fire-and-forget with debounce: the POS never blocks or fails on it, and a
 * failed publish retries after a short delay (or with the next change).
 */
let timer: number | undefined;
let pending: Customer[] = [];
let inFlight = false;

const schedule = (fn: () => void, ms: number) =>
  typeof window !== "undefined" && typeof window.setTimeout === "function"
    ? window.setTimeout(fn, ms)
    : (setTimeout(fn, ms) as unknown as number);

function arm(ms: number) {
  if (timer !== undefined) return;
  timer = schedule(() => {
    timer = undefined;
    void flush();
  }, ms);
}

export function publishCustomers(customers: Customer[], _orders: Order[]) {
  pending = customers;
  arm(5_000);
}

async function flush() {
  if (inFlight || pending.length === 0) return;
  inFlight = true;
  // Snapshot and clear before awaiting: a change that lands mid-flight arms a
  // fresh publish rather than mutating the batch in flight.
  const batch = pending;
  pending = [];
  const payload = batch
    .filter((c) => c.phone.replace(/\D/g, "").length >= 8)
    .slice(0, 500)
    .map((c) => ({
      phone: c.phone,
      name: c.name,
      points: c.points,
      stamps: c.stamps,
      // `visits` is the guest's lifetime count. The old code replaced it with
      // the number of closed orders still inside the retained order window,
      // which under-reported regulars on the menu site.
      visits: c.visits,
      spent: c.spent,
      lastVisit: c.lastVisit,
      birthday: c.birthday,
    }));
  try {
    const response = await fetch("/api/public/sync", {
      method: "POST",
      headers: { "content-type": "application/json", "x-como-key": key() },
      body: JSON.stringify({ customers: payload }),
      keepalive: true,
    });
    if (!response.ok) throw new Error(`public sync ${response.status}`);
  } catch {
    // Hand the batch back and try again shortly: a deploy blip, an offline
    // tablet or the API not being configured must not silently drop the last
    // publish until the next customer edit.
    if (pending.length === 0) pending = batch;
    arm(30_000);
  } finally {
    inFlight = false;
  }
}

function key() {
  // Mirror of the server's check; override in deploys via VITE_PUBLIC_API_KEY.
  const fromEnv = import.meta.env?.VITE_PUBLIC_API_KEY;
  return typeof fromEnv === "string" && fromEnv.trim() ? fromEnv.trim() : "como-local";
}
