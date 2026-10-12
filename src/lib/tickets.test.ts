import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { useCafe } from "./store.ts";
import type { Order } from "./types.ts";

/**
 * The ticket lifecycle is the ledger's front door: a tab must stay open
 * without touching stock or the books, and close as exactly one sale under the
 * number the guests hold. These run against the real store (in Node, the
 * localStorage wrapper falls back to in-memory), so a regression in the close
 * path fails here instead of silently double-booking a sale.
 */

const espresso = { itemId: "espresso", qty: 1, mods: [] };
const latte = { itemId: "latte", qty: 1, mods: [] };

const beansOf = () => useCafe.getState().stock.find((item) => item.sku === "beans")!.onHand;
const closed = () => useCafe.getState().orders.filter((order) => order.status === "closed");
const open = () => useCafe.getState().orders.filter((order) => order.status === "open");
const ticket = (id: string): Order | undefined =>
  useCafe.getState().orders.find((order) => order.id === id);
const settle = { pay: "cash" as const, discountPct: 0, useStamp: false, useGift: false, redeemPoints: 0 };

describe("open tickets", () => {
  beforeEach(() => useCafe.getState().reset());

  it("holds a tab open without touching stock, loyalty or the books", () => {
    const beans = beansOf();
    const sales = closed().length;
    const tabsOpen = open().length; // the seed already keeps one tab running
    const result = useCafe.getState().openTicket({ lines: [espresso], guestName: "Table 9", note: "" });
    assert.ok(result.ok);
    const held = ticket(result.order.id)!;
    assert.equal(held.status, "open");
    assert.equal(held.total, held.subtotal);
    assert.equal(held.guestName, "Table 9");
    assert.equal(held.number, result.order.number);
    assert.equal(closed().length, sales); // nothing booked yet
    assert.equal(beansOf(), beans); // nothing consumed yet
    assert.equal(open().length, tabsOpen + 1);
  });

  it("adds, re-quantifies and reprices lines while it is open", () => {
    const result = useCafe.getState().openTicket({ lines: [espresso], note: "" });
    assert.ok(result.ok);
    const patched = useCafe.getState().patchTicket(result.order.id, { lines: [espresso, latte], note: "for Sara" });
    assert.ok(patched.ok);
    const held = ticket(result.order.id)!;
    assert.equal(held.lines.length, 2);
    assert.equal(held.lines[1]!.qty, 1);
    assert.equal(held.note, "for Sara");
    assert.equal(
      held.subtotal,
      held.lines.reduce((sum, line) => sum + line.unitPrice * line.qty, 0),
    );
    assert.equal(held.total, held.subtotal);
  });

  it("refuses an empty tab and unknown menu items", () => {
    const held = open().length;
    assert.deepEqual(useCafe.getState().openTicket({ lines: [], note: "" }), {
      ok: false,
      error: "empty",
    });
    assert.deepEqual(
      useCafe.getState().openTicket({ lines: [{ itemId: "nope", qty: 1, mods: [] }], note: "" }),
      { ok: false, error: "missing" },
    );
    assert.equal(open().length, held); // neither call left a tab behind
  });

  it("closes into exactly one sale, keeping the tab's number", () => {
    const before = useCafe.getState().orders.length;
    const opened = useCafe.getState().openTicket({ lines: [espresso], note: "" });
    assert.ok(opened.ok);
    const beans = beansOf();
    const closedBefore = closed().length;
    const openBefore = open().length;
    const result = useCafe.getState().closeTicket(opened.order.id, settle);
    assert.ok(result.ok);

    const state = useCafe.getState();
    const mine = state.orders.filter((order) => order.id === opened.order.id);
    assert.equal(mine.length, 1); // no ghost copy under a fresh number
    assert.equal(mine[0]!.status, "closed");
    assert.equal(mine[0]!.number, opened.order.number);
    assert.equal(state.orders.length, before + 1);
    assert.equal(open().length, openBefore - 1); // the tab settled; the seed's stays open
    assert.equal(closed().length, closedBefore + 1);
    assert.ok(beansOf() < beans); // the sale finally pulled stock

    // A second tab produced the same way also settles to one sale and frees
    // the open slot. The close path must not double-book or leave a ghost
    // order next to the ticket it just settled.
    const opened2 = useCafe.getState().openTicket({ lines: [espresso], note: "" });
    assert.ok(opened2.ok);
    assert.equal(open().length, openBefore); // one open again
    assert.ok(useCafe.getState().closeTicket(opened2.order.id, settle).ok);
    assert.equal(open().length, openBefore - 1); // the tab settled; the seed's stays open
    assert.equal(closed().length, closedBefore + 2);
    // The movement log talks about the number the guests hold. The newest
    // beans move is this close's — the seeds' sales sit below it.
    const move = state.moves.filter((entry) => entry.reason === "sale" && entry.sku === "beans")[0]!;
    assert.equal(move.note, `#${opened.order.number}`);
  });

  it("keeps the books and loyalty of a closed tab untouched by later edits", () => {
    const opened = useCafe.getState().openTicket({ lines: [espresso], note: "" });
    assert.ok(opened.ok);
    assert.ok(useCafe.getState().closeTicket(opened.order.id, settle).ok);
    const closedTicket = ticket(opened.order.id)!;
    const locked = useCafe.getState().patchTicket(opened.order.id, { lines: [espresso, latte] });
    assert.deepEqual(locked, { ok: false, error: "locked" });
    assert.equal(ticket(opened.order.id)!.lines.length, closedTicket.lines.length);
    const noted = useCafe.getState().patchTicket(opened.order.id, { note: "paid late" });
    assert.ok(noted.ok);
    assert.equal(ticket(opened.order.id)!.note, "paid late");
    assert.equal(ticket(opened.order.id)!.total, closedTicket.total);
  });

  it("deletes an open tab and leaves a closed one in the ledger", () => {
    const opened = useCafe.getState().openTicket({ lines: [espresso], note: "" });
    assert.ok(opened.ok);
    assert.equal(useCafe.getState().deleteTicket(opened.order.id), true);
    assert.equal(ticket(opened.order.id), undefined);

    const second = useCafe.getState().openTicket({ lines: [espresso], note: "" });
    assert.ok(second.ok);
    assert.ok(useCafe.getState().closeTicket(second.order.id, settle).ok);
    assert.equal(useCafe.getState().deleteTicket(second.order.id), false);
    assert.equal(ticket(second.order.id)?.status, "closed");
  });

  it("will not oversell: closing with empty stock reports back, the tab stays open", () => {
    const beans = useCafe.getState().stock.find((item) => item.sku === "beans")!;
    useCafe.getState().patchStockItem(beans.sku, { onHand: 0 });
    const opened = useCafe.getState().openTicket({ lines: [espresso], note: "" });
    assert.ok(opened.ok);
    const result = useCafe.getState().closeTicket(opened.order.id, settle);
    assert.deepEqual(result, { ok: false, error: "stock" });
    assert.equal(ticket(opened.order.id)!.status, "open");
    assert.equal(beansOf(), 0);
  });
});

describe("cellar CRUD", () => {
  beforeEach(() => useCafe.getState().reset());

  it("creates, edits and removes an ingredient", () => {
    const added = useCafe.getState().addStockItem({
      nameFa: "شربت تست",
      nameEn: "Test syrup",
      unit: "ml",
      onHand: 100,
      par: 40,
      cost: 1000,
    });
    assert.equal(added, true);
    const item = useCafe.getState().stock.find((entry) => entry.nameEn === "Test syrup")!;
    assert.ok(item);

    assert.equal(useCafe.getState().patchStockItem(item.sku, { onHand: 75, cost: 1250, par: 50 }), true);
    const edited = useCafe.getState().stock.find((entry) => entry.sku === item.sku)!;
    assert.equal(edited.onHand, 75);
    assert.equal(edited.cost, 1250);
    assert.equal(edited.par, 50);
    // A count typed into the edit form is still a logged movement.
    const adjust = useCafe.getState().moves.find((move) => move.sku === item.sku)!;
    assert.equal(adjust.reason, "adjust");
    assert.equal(adjust.qty, -25);

    assert.equal(useCafe.getState().removeStockItem(item.sku), true);
    assert.equal(useCafe.getState().stock.some((entry) => entry.sku === item.sku), false);
    assert.equal(useCafe.getState().moves.some((move) => move.sku === item.sku), false);
  });

  it("rejects duplicate names and impossible numbers", () => {
    assert.equal(useCafe.getState().patchStockItem("milk", { nameEn: "Milk" }), true); // its own name is fine
    assert.equal(useCafe.getState().patchStockItem("milk", { nameEn: "Oat milk" }), false); // taken
    assert.equal(useCafe.getState().patchStockItem("milk", { nameEn: "" }), false);
    assert.equal(useCafe.getState().patchStockItem("milk", { onHand: -5 }), false);
    assert.equal(useCafe.getState().patchStockItem("nope", { cost: 1 }), false);
  });

  it("will not delete an ingredient a recipe still uses", () => {
    assert.equal(useCafe.getState().removeStockItem("beans"), false);
    assert.ok(useCafe.getState().stock.some((entry) => entry.sku === "beans"));
  });
});
