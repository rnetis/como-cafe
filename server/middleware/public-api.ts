/**
 * Public REST API for the separate como-menu site, handled in middleware
 * because Nitro v3's `serverDir` here auto-registers `server/middleware/*`
 * but does not wire `server/routes`/`server/api` file handlers.
 *
 *   GET  /api/public/menu      → live menu & prices from src/lib/catalog.ts
 *   POST /api/public/customer  → { phone } → that guest's stats
 *   POST /api/public/sync      → POS pushes customer stats (x-como-key auth)
 *
 * Everything else falls through with next(). CORS is open: the menu is
 * public by design, and the customer endpoint only answers for a phone the
 * guest already knows.
 */
import { CATEGORIES, MENU } from "../../src/lib/catalog.ts";

/**
 * `src/lib/db.ts` boots PGLite the moment it loads in Node. A module-scope
 * import here would do that while Nitro builds, because `serverDir` below
 * auto-registers this file — and the prerender crawl of `/` then dies on the
 * bundled `pglite.data` the Vercel output doesn't ship. Import it per request,
 * for the two endpoints that actually query.
 */
const loadSql = () => import("../../src/lib/db.ts").then((m) => m.getSql());

interface PublicApiEvent {
  url: URL;
  req: Request;
}

const CORS: Record<string, string> = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "content-type, x-como-key",
  "access-control-allow-methods": "GET, POST, OPTIONS",
};

const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...CORS, ...extra },
  });

function tierOf(spent: number) {
  if (spent >= 20_000_000) return { id: "inner", cashback: 0.12 };
  if (spent >= 8_000_000) return { id: "como", cashback: 0.08 };
  if (spent >= 2_000_000) return { id: "regular", cashback: 0.05 };
  return { id: "guest", cashback: 0 };
}

async function menu(): Promise<Response> {
  const categories = CATEGORIES.map((cat) => ({
    id: cat.id,
    fa: cat.fa,
    en: cat.en,
    items: MENU.filter((item) => item.active && item.category === cat.id).map((item) => ({
      id: item.id,
      nameFa: item.nameFa,
      nameEn: item.nameEn,
      price: item.price,
    })),
  }));
  return json({ ok: true, categories }, 200, { "cache-control": "public, max-age=120" });
}

type CustomerRow = {
  phone: string;
  name: string;
  points: number;
  stamps: number;
  visits: number;
  spent: string | number;
  last_visit: string | number;
  birthday: string;
};

async function customer(event: PublicApiEvent): Promise<Response> {
  let body: { phone?: unknown };
  try {
    body = (await event.req.json()) as { phone?: unknown };
  } catch {
    return json({ ok: false, error: "bad-json" }, 400);
  }
  const phone = typeof body.phone === "string" ? body.phone.replace(/\D/g, "") : "";
  if (phone.length < 8) return json({ ok: false, error: "bad-phone" }, 400);
  const sql = await loadSql();
  const rows = await sql.query<CustomerRow>(
    "select phone, name, points, stamps, visits, spent, last_visit, birthday from public_customers where phone = $1",
    [phone],
  );
  if (rows.length === 0) return json({ ok: true, found: false });
  const row = rows[0];
  const spent = Number(row.spent);
  const tier = tierOf(spent);
  return json({
    ok: true,
    found: true,
    customer: {
      name: row.name,
      phone: row.phone,
      points: row.points,
      stamps: row.stamps,
      visits: row.visits,
      spent,
      lastVisit: Number(row.last_visit),
      birthday: row.birthday,
      tier: tier.id,
      cashback: tier.cashback,
    },
  });
}

type SyncBody = {
  customers?: Array<Record<string, unknown>>;
};

async function sync(event: PublicApiEvent): Promise<Response> {
  const expected = process.env.PUBLIC_API_KEY?.trim() || "como-local";
  if (event.req.headers.get("x-como-key") !== expected) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }
  let body: SyncBody;
  try {
    body = (await event.req.json()) as SyncBody;
  } catch {
    return json({ ok: false, error: "bad-json" }, 400);
  }
  const rows = (body.customers ?? [])
    .map((c) => ({
      phone: typeof c.phone === "string" ? c.phone.replace(/\D/g, "") : "",
      name: typeof c.name === "string" ? c.name : "",
      points: Math.max(0, Math.floor(Number(c.points) || 0)),
      stamps: Math.max(0, Math.floor(Number(c.stamps) || 0)),
      visits: Math.max(0, Math.floor(Number(c.visits) || 0)),
      spent: Math.max(0, Math.floor(Number(c.spent) || 0)),
      lastVisit: Math.max(0, Math.floor(Number(c.lastVisit) || 0)),
      birthday: typeof c.birthday === "string" ? c.birthday : "",
    }))
    .filter((c) => c.phone.length >= 8);
  if (rows.length === 0) return json({ ok: true, synced: 0 });
  const sql = await loadSql();
  await sql.query("begin");
  try {
    for (const c of rows) {
      await sql.query(
        `insert into public_customers (phone, name, points, stamps, visits, spent, last_visit, birthday, updated_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8, now())
         on conflict (phone) do update set
           name = excluded.name, points = excluded.points, stamps = excluded.stamps,
           visits = excluded.visits, spent = excluded.spent, last_visit = excluded.last_visit,
           birthday = excluded.birthday, updated_at = now()`,
        [c.phone, c.name, c.points, c.stamps, c.visits, c.spent, c.lastVisit, c.birthday],
      );
    }
    await sql.query("commit");
  } catch {
    await sql.query("rollback");
    return json({ ok: false, error: "db" }, 500);
  }
  return json({ ok: true, synced: rows.length });
}

export default async function publicApiMiddleware(
  event: PublicApiEvent,
  next: () => unknown | Promise<unknown>,
): Promise<unknown> {
  const path = event.url.pathname;
  if (!path.startsWith("/api/public/")) return next();

  const method = (event.req.method ?? "GET").toUpperCase();
  if (method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  try {
    if (path === "/api/public/menu" && method === "GET") return await menu();
    if (path === "/api/public/customer" && method === "POST") return await customer(event);
    if (path === "/api/public/sync" && method === "POST") return await sync(event);
  } catch (err) {
    return json({ ok: false, error: err instanceof Error ? err.message : "server" }, 500);
  }
  return json({ ok: false, error: "not-found" }, 404);
}
