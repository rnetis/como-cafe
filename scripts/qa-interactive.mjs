#!/usr/bin/env node
/**
 * Throwaway interactive QA for the daily-tickets / closed-CRUD / expense-custom
 * work. Drives the real app in Chromium and asserts against the persisted store,
 * so a pass means the UI action actually landed in the desk's own data.
 *
 * `node scripts/qa-interactive.mjs [base-url]`
 */
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://127.0.0.1:8080";
const SHOTS = "/workspace/screenshots";
const KEY = "como-desk-v1";

const results = [];
function check(name, pass, extra = "") {
  results.push({ name, pass: Boolean(pass), extra });
  if (!pass) process.exitCode = 1;
}

const readStore = () => {
  const raw = localStorage.getItem("como-desk-v1");
  return raw ? JSON.parse(raw).state : null;
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const consoleErrors = [];
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});
page.on("pageerror", (error) => consoleErrors.push(`pageerror: ${error.message}`));

await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
await page.waitForSelector("nav", { timeout: 30_000 });
// English keeps the selectors stable; the desk ships Persian by default.
await page.getByRole("button", { name: "EN", exact: true }).first().click();
await page.waitForTimeout(300);

// ── 1. Tickets: daily headings + compact rows ───────────────────────────────
await page.getByRole("button", { name: "Tickets" }).first().click();
await page.waitForSelector("main section ul li", { timeout: 15_000 });

const heads = await page.$$eval("main section > div > span:first-child", (nodes) =>
  nodes.map((node) => node.textContent.trim()),
);
check("day headings render", heads.includes("Today") && heads.includes("Yesterday"), heads.join(" | "));
check("day headings are newest first", heads.indexOf("Today") < heads.indexOf("Yesterday"), heads.join(" | "));

const expectedDays = await page.evaluate(() => {
  const raw = JSON.parse(localStorage.getItem("como-desk-v1"));
  const buckets = new Map();
  for (const order of raw.state.orders) {
    if (order.status !== "closed") continue;
    const day = new Date(order.closedAt ?? order.at);
    day.setHours(0, 0, 0, 0);
    buckets.set(day.getTime(), (buckets.get(day.getTime()) ?? 0) + 1);
  }
  return [...buckets.entries()].sort((a, b) => b[0] - a[0]).map(([, count]) => count);
});
const renderedDayCounts = await page.$$eval("main section", (nodes) =>
  nodes
    .map((node) => ({
      label: node.querySelector("div > span")?.textContent?.trim() ?? "",
      rows: node.querySelectorAll("ul > li").length,
    }))
    .filter((entry) => entry.label !== "Open")
    .map((entry) => entry.rows),
);
const matchesHeadings = renderedDayCounts.every((count, index) => count === expectedDays[index]);
check(
  "each day section holds exactly that day's tickets",
  matchesHeadings && renderedDayCounts.length > 2,
  `rendered ${JSON.stringify(renderedDayCounts)} vs expected ${JSON.stringify(expectedDays)}`,
);

const rowHeights = await page.$$eval("main section ul > li", (nodes) =>
  nodes.slice(0, 60).map((node) => node.getBoundingClientRect().height),
);
check(
  "rows are compact but still tappable",
  rowHeights.length > 20 && Math.min(...rowHeights) >= 36 && Math.max(...rowHeights) <= 76,
  `${Math.min(...rowHeights)}…${Math.max(...rowHeights)} over ${rowHeights.length} rows`,
);

const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
check("no horizontal overflow", overflow <= 1, `overflow ${overflow}px`);
await page.screenshot({ path: `${SHOTS}/qa-tickets.png`, fullPage: false });

// ── 2. Correct a settled ticket: the cellar and the guest move with it ──────
const target = await page.evaluate(() => {
  const raw = JSON.parse(localStorage.getItem("como-desk-v1"));
  const closed = raw.state.orders
    .filter((order) => order.status === "closed" && order.customerId && order.lines.length > 0)
    .sort((a, b) => (b.closedAt ?? b.at) - (a.closedAt ?? a.at));
  const order = closed[0];
  const guest = raw.state.customers.find((entry) => entry.id === order.customerId);
  return {
    id: order.id,
    number: order.number,
    total: order.total,
    guestId: order.customerId,
    spent: guest?.spent ?? 0,
    stock: Object.fromEntries(raw.state.stock.map((item) => [item.sku, item.onHand])),
  };
});

// Rows print `#number` flush against the muted meta, so match the number span
// itself rather than a substring of the row's text.
const rowOf = async (number) => {
  const index = await page.$$eval(
    "main section ul > li",
    (nodes, want) => nodes.findIndex((node) => node.querySelector("button > span > span")?.textContent?.trim() === `#${want}`),
    number,
  );
  if (index < 0) throw new Error(`row #${number} is not on screen`);
  return page.locator("main section ul > li").nth(index);
};

await rowOf(target.number).then((row) => row.getByRole("button", { name: "Edit" }).click());
await page.waitForSelector('[aria-label="+"]', { timeout: 10_000 });
const sheetTitle = await page.locator("h2").first().textContent();
check("closed-ticket sheet opens", /closed/.test(sheetTitle ?? ""), sheetTitle ?? "");

const previewBefore = await page.locator("li", { hasText: "Ticket total" }).first().textContent();
await page.locator('[aria-label="+"]').first().click();
await page.waitForTimeout(200);
const previewAfter = await page.locator("li", { hasText: "Ticket total" }).first().textContent();
check("editing a line moves the sheet total", previewBefore !== previewAfter, `${previewBefore} → ${previewAfter}`);
await page.screenshot({ path: `${SHOTS}/qa-closed-sheet.png`, fullPage: false });

await page.getByRole("button", { name: "Save correction" }).click();
await page.waitForTimeout(400);

const afterFix = await page.evaluate(
  ([key, id]) => {
    const raw = JSON.parse(localStorage.getItem(key));
    const order = raw.state.orders.find((entry) => entry.id === id);
    return {
      total: order?.total ?? null,
      stock: Object.fromEntries(raw.state.stock.map((item) => [item.sku, item.onHand])),
      adjusts: raw.state.moves.filter((move) => move.reason === "adjust" && move.note.includes("اصلاح فیش")).length,
    };
  },
  [KEY, target.id],
);
const moved = Object.keys(target.stock).filter((sku) => target.stock[sku] !== afterFix.stock[sku]);
check("the correction landed on the ticket", afterFix.total !== target.total, `${target.total} → ${afterFix.total}`);
check("the cellar moved with the correction", moved.length > 0, moved.join(", ") || "nothing moved");
check("no stock went negative", Object.values(afterFix.stock).every((value) => value >= -1e-9));
check("the correction is logged as an adjust move", afterFix.adjusts > 0, `${afterFix.adjusts} moves`);

const guestSpend = await page.evaluate(
  ([key, id]) => JSON.parse(localStorage.getItem(key)).state.customers.find((entry) => entry.id === id)?.spent,
  [KEY, target.guestId],
);
check(
  "the guest's spend followed the corrected total",
  Math.abs(guestSpend - (target.spent + (afterFix.total - target.total))) < 1e-6,
  `spent ${target.spent} → ${guestSpend}`,
);

// ── 3. Delete a settled ticket: the sale unwinds ────────────────────────────
const doomed = await page.evaluate(() => {
  const raw = JSON.parse(localStorage.getItem("como-desk-v1"));
  const closed = raw.state.orders
    .filter((order) => order.status === "closed" && order.customerId && order.lines.length > 0)
    .sort((a, b) => (b.closedAt ?? b.at) - (a.closedAt ?? a.at));
  const order = closed[0];
  const guest = raw.state.customers.find((entry) => entry.id === order.customerId);
  return {
    number: order.number,
    count: raw.state.orders.length,
    total: order.total,
    guestId: order.customerId,
    spent: guest?.spent ?? 0,
    visits: guest?.visits ?? 0,
    stock: Object.fromEntries(raw.state.stock.map((item) => [item.sku, item.onHand])),
  };
});

await rowOf(doomed.number).then((row) => row.getByRole("button", { name: "Edit" }).click());
await page.waitForSelector('[aria-label="+"]', { timeout: 10_000 });
const del = page.getByRole("button", { name: "Delete settled ticket" });
await del.click();
await page.waitForTimeout(150);
await page.getByRole("button", { name: "Sure? Tap again" }).click();
await page.waitForTimeout(400);

const afterDelete = await page.evaluate(
  ([key, id]) => {
    const raw = JSON.parse(localStorage.getItem(key));
    const guest = raw.state.customers.find((entry) => entry.id === id);
    return {
      count: raw.state.orders.length,
      spent: guest?.spent ?? 0,
      visits: guest?.visits ?? 0,
      stock: Object.fromEntries(raw.state.stock.map((item) => [item.sku, item.onHand])),
    };
  },
  [KEY, doomed.guestId],
);
const restored = Object.keys(doomed.stock).filter((sku) => afterDelete.stock[sku] > doomed.stock[sku]);
check("the settled ticket is gone", afterDelete.count === doomed.count - 1, `${doomed.count} → ${afterDelete.count}`);
check("deleting restored the cellar", restored.length > 0, restored.join(", ") || "nothing restored");
check(
  "deleting rolled the guest's spend back",
  Math.abs(afterDelete.spent - (doomed.spent - doomed.total)) < 1e-6,
  `${doomed.spent} → ${afterDelete.spent}`,
);
check("deleting rolled a visit back", afterDelete.visits === doomed.visits - 1, `${doomed.visits} → ${afterDelete.visits}`);

// ── 4. Expenses: the custom value on every item ─────────────────────────────
await page.getByRole("button", { name: "Books" }).first().click();
await page.waitForSelector('form', { timeout: 10_000 });
const before = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).state.expenses.length, KEY);

await page.getByLabel("Amount, toman").fill("123000");
await page.getByLabel("Custom label").first().fill("QA Supplier");
await page.getByRole("button", { name: "Add expense" }).click();
await page.waitForTimeout(400);

const added = await page.evaluate(
  (key) => {
    const list = JSON.parse(localStorage.getItem(key)).state.expenses;
    return { count: list.length, last: list[0] };
  },
  KEY,
);
check("the expense was recorded", added.count === before + 1, `${before} → ${added.count}`);
check("the custom value rode along", added.last?.custom === "QA Supplier", JSON.stringify(added.last?.custom));
check("the custom value is rendered in the list", (await page.locator("ul").filter({ hasText: "QA Supplier" }).count()) > 0);

// Edit it in place, then delete it again.
const expenseRow = page.locator("li", { hasText: "QA Supplier" }).first();
await expenseRow.getByRole("button", { name: "Edit" }).click();
await page.waitForTimeout(200);
await page.locator('li input[type="number"]').first().fill("99000");
await page.getByRole("button", { name: "Save", exact: true }).click();
await page.waitForTimeout(300);
const edited = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).state.expenses[0], KEY);
check("editing an expense lands", edited?.amount === 99000, JSON.stringify({ amount: edited?.amount }));

await page.locator("li", { hasText: "QA Supplier" }).first().getByRole("button", { name: "Edit" }).click();
await page.waitForTimeout(200);
await page.getByRole("button", { name: "Delete", exact: true }).click();
await page.waitForTimeout(150);
await page.getByRole("button", { name: "Sure? Tap again" }).click();
await page.waitForTimeout(300);
const afterRemove = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).state.expenses.length, KEY);
check("deleting an expense lands", afterRemove === before, `${before} → ${afterRemove}`);

// ── 5. The label is named once in House and persists across a reload ────────
await page.getByRole("button", { name: "House" }).first().click();
await page.waitForSelector("input", { timeout: 10_000 });
await page.getByPlaceholder("Supplier, paid by…").fill("Supplier QA");
await page.waitForTimeout(300);

await page.reload({ waitUntil: "domcontentloaded" });
await page.waitForSelector("nav", { timeout: 30_000 });
await page.getByRole("button", { name: "Books" }).first().click();
await page.waitForSelector("form", { timeout: 10_000 });
const labelAfterReload = await page.evaluate((key) => JSON.parse(localStorage.getItem(key)).state.settings.expenseCustomLabel, KEY);
check("the custom column name survives a reload", labelAfterReload === "Supplier QA", labelAfterReload);
check(
  "the renamed column sits above the expense form",
  (await page.getByText("Supplier QA", { exact: true }).count()) > 0,
);
void labelAfterReload;
await page.screenshot({ path: `${SHOTS}/qa-books.png`, fullPage: false });

// Leave the desk as it was found.
await page.getByRole("button", { name: "House" }).first().click();
await page.getByPlaceholder("Supplier, paid by…").fill("");
await page.waitForTimeout(200);

check("no console errors", consoleErrors.length === 0, consoleErrors.slice(0, 3).join(" || "));

await browser.close();

const failed = results.filter((entry) => !entry.pass);
for (const entry of results) {
  console.log(`${entry.pass ? "ok  " : "FAIL"}  ${entry.name}${entry.extra ? `  — ${entry.extra}` : ""}`);
}
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
