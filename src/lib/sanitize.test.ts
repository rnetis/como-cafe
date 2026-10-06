import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { defaultSettings } from "./seed.ts";
import { sanitizeDeskData } from "./sanitize.ts";
import type { DeskData } from "./types.ts";

/** A minimal but valid desk snapshot the sanitizer should keep intact. */
function validSnapshot(): DeskData {
  return {
    menu: [
      {
        id: "item-1",
        category: "hot-coffee",
        nameFa: "لاته",
        nameEn: "Latte",
        price: 98_000,
        recipe: [{ sku: "milk", qty: 200 }],
        active: true,
      },
    ],
    stock: [{ sku: "milk", nameFa: "شیر", nameEn: "Milk", unit: "ml", onHand: 4000, par: 6000, cost: 28 }],
    customers: [
      {
        id: "c-1",
        name: "سارا",
        phone: "09120000001",
        birthday: "1996-04-02",
        notes: "",
        points: 40,
        stamps: 3,
        visits: 5,
        spent: 900_000,
        createdAt: 1_700_000_000_000,
        lastVisit: 1_700_000_000_000,
        smsOptIn: true,
        referral: "C0001",
        giftYear: 0,
      },
    ],
    orders: [
      {
        id: "ord-1",
        number: 12,
        at: 1_700_000_000_000,
        lines: [
          {
            itemId: "item-1",
            nameFa: "لاته",
            nameEn: "Latte",
            qty: 1,
            unitPrice: 98_000,
            unitCogs: 9_000,
            mods: [],
          },
        ],
        subtotal: 98_000,
        manualOff: 0,
        stampOff: 0,
        giftOff: 0,
        tierOff: 0,
        pointsOff: 0,
        pointsRedeemed: 0,
        pointsEarned: 9,
        bonusPoints: 0,
        total: 98_000,
        cogs: 9_000,
        pay: "card",
        stampRedeemed: false,
        giftUsed: false,
        note: "",
      },
    ],
    expenses: [],
    moves: [],
    cashMoves: [],
    smsLogs: [],
    closes: [],
    settings: defaultSettings(),
    credit: null,
  };
}

describe("sanitizeDeskData", () => {
  it("keeps a valid snapshot intact", () => {
    const snapshot = validSnapshot();
    const out = sanitizeDeskData(snapshot);
    assert.ok(out);
    assert.equal(out.menu[0]?.nameEn, "Latte");
    assert.equal(out.menu[0]?.price, 98_000);
    assert.equal(out.orders[0]?.total, 98_000);
    assert.equal(out.customers[0]?.points, 40);
    assert.deepEqual(out.settings, snapshot.settings);
  });

  it("rejects payloads without a menu array", () => {
    assert.equal(sanitizeDeskData(null), null);
    assert.equal(sanitizeDeskData("garbage"), null);
    assert.equal(sanitizeDeskData(42), null);
    assert.equal(sanitizeDeskData({ orders: [] }), null);
  });

  it("drops malformed rows and keeps the good ones", () => {
    const snapshot = validSnapshot();
    const out = sanitizeDeskData({
      ...snapshot,
      menu: [null, "latte", { id: "", nameFa: "x" }, { ...snapshot.menu[0]!, id: "item-2" }],
      orders: [undefined, { id: "ord-2", at: "yesterday", lines: "nope", total: -5 }],
      customers: [{ nope: true }, { id: "c-2", points: "many", spent: -3 }],
    });
    assert.ok(out);
    assert.deepEqual(out.menu.map((item) => item.id), ["item-2"]);
    assert.equal(out.menu[0]?.active, true); // defaulted
    assert.equal(out.orders.length, 1);
    assert.equal(out.orders[0]?.total, 0); // negative clamped
    assert.deepEqual(out.customers.map((entry) => entry.id), ["c-2"]);
    assert.equal(out.customers[0]?.points, 0); // "many" → 0
  });

  it("coerces settings and clamps impossible values", () => {
    const out = sanitizeDeskData({
      menu: [],
      settings: {
        lang: "fr",
        paper: 999,
        baud: 300,
        stampGoal: 0,
        pointsPer: -100,
        slowStart: 55,
        slowEnd: -2,
        smsApiKey: 123,
      },
    });
    assert.ok(out);
    assert.equal(out.settings.lang, "fa"); // unknown → default
    assert.equal(out.settings.paper, 80);
    assert.equal(out.settings.baud, 9600);
    assert.equal(out.settings.stampGoal, 1); // min 1
    assert.equal(out.settings.pointsPer, 0); // negative clamped
    assert.equal(out.settings.slowStart, 23);
    assert.equal(out.settings.slowEnd, 0);
    assert.equal(out.settings.smsApiKey, "123"); // numbers stringify
  });

  it("sanitizes loyalty-critical fields", () => {
    const out = sanitizeDeskData({
      menu: [],
      customers: [
        {
          id: "c-3",
          name: "علی",
          birthday: "not-a-date",
          points: -10,
          stamps: 2.7,
          smsOptIn: "yes",
          referral: 7,
        },
      ],
      credit: { value: "250", at: "long ago" },
    });
    assert.ok(out);
    const guest = out.customers[0]!;
    assert.equal(guest.birthday, "");
    assert.equal(guest.points, 0);
    assert.equal(guest.stamps, 2.7);
    assert.equal(guest.smsOptIn, true); // non-boolean → default true
    assert.equal(guest.referral, "7");
    assert.equal(out.credit?.value, 250);
    assert.ok(out.credit && out.credit.at > 0);
  });

  it("keeps recipe uses and order lines only when well-formed", () => {
    const out = sanitizeDeskData({
      menu: [
        {
          id: "item-1",
          recipe: [null, { sku: "milk", qty: "200" }, { qty: 5 }, { sku: "", qty: 3 }],
        },
      ],
      orders: [
        {
          id: "ord-1",
          lines: [null, { itemId: "item-1", qty: 2, unitPrice: 10 }, { nope: 1 }],
        },
      ],
    });
    assert.ok(out);
    assert.deepEqual(out.menu[0]?.recipe, [{ sku: "milk", qty: 200 }]);
    assert.equal(out.orders[0]?.lines.length, 1);
    assert.equal(out.orders[0]?.lines[0]?.itemId, "item-1");
  });
});
