import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { migrateDeskData } from "./migrate.ts";
import { defaultSettings } from "./seed.ts";

/**
 * A version-2 desk save: the shape the shop's localStorage actually holds
 * before the customer-care release. No `care` stamp on any guest and no
 * `careOn` / `careQuietDays` in settings — those fields did not exist yet.
 */
function saveV2(
  overrides: { customers?: unknown[]; settings?: Record<string, unknown> } = {},
): Record<string, unknown> {
  const settings: Record<string, unknown> = { ...defaultSettings(), autoSms: false };
  delete settings.careOn;
  delete settings.careQuietDays;
  return {
    menu: [],
    customers: overrides.customers ?? [legacyGuest()],
    settings: { ...settings, ...overrides.settings },
  };
}

function legacyGuest(patch: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "c-1",
    name: "سارا",
    phone: "09120000001",
    birthday: "1996-06-18",
    notes: "",
    points: 40,
    stamps: 2,
    visits: 30,
    spent: 5_000_000,
    createdAt: 1_700_000_000_000,
    lastVisit: 1_700_000_000_000,
    smsOptIn: true,
    referral: "C0001",
    giftYear: 0,
    walletBalance: 0,
    ...patch,
  };
}

describe("migrateDeskData · v3 customer care", () => {
  it("keeps the shop's own settings and opts care in only through the UI", () => {
    const before = Date.now();
    const out = migrateDeskData(saveV2(), 2);

    // Never force a stored boolean on: a shop with receipt texting off stays off.
    assert.equal(out.settings.autoSms, false);
    // Care itself is new to this save, so it starts OFF — no surprise paid texts.
    assert.equal(out.settings.careOn, false);
    // The quiet stretch keeps the install default when the save predates it.
    assert.equal(out.settings.careQuietDays, 21);

    // Every guest is stamped as "just cared for": neither the birthday nor the
    // win-back fires on upgrade.
    const care = out.customers[0]!.care;
    assert.ok(care.birthday >= before && care.birthday <= Date.now());
    assert.ok(care.winback >= before && care.winback <= Date.now());
    assert.equal(care.milestone, 0); // no fake thank-you stamp
    assert.equal(care.milestoneVisits, 25); // the milestone 30 visits already passed
  });

  it("treats a save whose envelope lost its version as pre-v3", () => {
    const out = migrateDeskData(saveV2(), undefined);
    assert.equal(out.settings.careOn, false);
  });

  it("keeps the stamps a WIP save already wrote", () => {
    const stamped = legacyGuest({
      care: { birthday: 111, winback: 222, milestone: 333, milestoneVisits: 10 },
    });
    const out = migrateDeskData(saveV2({ customers: [stamped] }), 2);
    assert.deepEqual(out.customers[0]!.care, {
      birthday: 111,
      winback: 222,
      milestone: 333,
      milestoneVisits: 10,
    });
  });

  it("leaves a v3 save exactly as the sanitizer returns it", () => {
    const saved = {
      menu: [],
      customers: [
        legacyGuest({ care: { birthday: 111, winback: 222, milestone: 0, milestoneVisits: 10 } }),
      ],
      settings: { ...defaultSettings(), careOn: false, autoSms: false, careQuietDays: 30 },
    };
    const out = migrateDeskData(saved, 3);
    assert.equal(out.settings.careOn, false);
    assert.equal(out.settings.autoSms, false);
    assert.equal(out.settings.careQuietDays, 30);
    assert.deepEqual(out.customers[0]!.care, {
      birthday: 111,
      winback: 222,
      milestone: 0,
      milestoneVisits: 10,
    });
    // A v3 save with blank stamps is trusted as-is — no rewrite on every boot.
    const blank = migrateDeskData(saveV2({ customers: [legacyGuest()] }), 3);
    assert.deepEqual(blank.customers[0]!.care, {
      birthday: 0,
      winback: 0,
      milestone: 0,
      milestoneVisits: 0,
    });
  });

  it("turns a missing or corrupt save into a complete DeskData", () => {
    // Unreadable payloads fall back to seed data, never to a half-built store.
    for (const raw of [null, undefined, "garbage", 42, { orders: [] }]) {
      const out = migrateDeskData(raw, 3);
      assert.ok(out.menu.length > 0);
      assert.ok(out.stock.length > 0);
      assert.ok(out.customers.length > 0);
      assert.equal(out.settings.careOn, true); // seed defaults, untouched at v3
      assert.equal(out.settings.careQuietDays, 21);
      assert.ok(out.customers.every((guest) => typeof guest.care?.birthday === "number"));
    }

    // The same fallback on a pre-v3 save still opts care out.
    const old = migrateDeskData(null, 2);
    assert.equal(old.settings.careOn, false);
  });
});
