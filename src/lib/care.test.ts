import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CARE_DAILY_CAP, careMessage, dueCare, nextMilestone, sentToday } from "./care.ts";
import { defaultSettings } from "./seed.ts";
import type { CareStamp, Customer, Settings } from "./types.ts";

const DAY = 86_400_000;
const NOW = Date.parse("2026-06-15T12:00:00Z");

const stamp = (patch: Partial<CareStamp> = {}): CareStamp => ({
  birthday: 0,
  winback: 0,
  milestone: 0,
  milestoneVisits: 0,
  ...patch,
});

const guest = (patch: Partial<Customer> = {}): Customer => ({
  id: "c-1",
  name: "سارا",
  phone: "09120000001",
  birthday: "",
  notes: "",
  points: 120,
  stamps: 0,
  visits: 4,
  spent: 1_000_000,
  createdAt: NOW - 200 * DAY,
  lastVisit: NOW - DAY,
  smsOptIn: true,
  referral: "C0001",
  giftYear: 0,
  walletBalance: 0,
  care: stamp(),
  ...patch,
});

const settings = (patch: Partial<Settings> = {}): Settings => ({
  ...defaultSettings(),
  ...patch,
});

describe("care due rules", () => {
  it("sends nothing while the switch is off", () => {
    const out = dueCare([guest({ birthday: "2000-06-16" })], settings({ careOn: false }), "fa", NOW);
    assert.deepEqual(out, []);
  });

  it("owes a birthday once the day is within a week, and only once a year", () => {
    const birthdaySoon = guest({ birthday: "1996-06-18" }); // 3 days out
    const first = dueCare([birthdaySoon], settings(), "fa", NOW);
    assert.equal(first.length, 1);
    assert.equal(first[0]?.kind, "birthday");

    // Sent this year → quiet until next year's birthday.
    const sentThisYear = guest({
      birthday: "1996-06-18",
      care: stamp({ birthday: NOW }),
    });
    assert.equal(dueCare([sentThisYear], settings(), "fa", NOW).length, 0);

    // Last year's card does not block this year's.
    const sentLastYear = guest({
      birthday: "1996-06-18",
      care: stamp({ birthday: NOW - 300 * DAY }),
    });
    assert.equal(dueCare([sentLastYear], settings(), "fa", NOW).length, 1);
  });

  it("owes a win-back only after the quiet stretch, and not twice in a row", () => {
    const gone = guest({ lastVisit: NOW - 21 * DAY });
    assert.equal(dueCare([gone], settings(), "fa", NOW)[0]?.kind, "winback");

    // One day short of the stretch: still quiet, not yet due.
    assert.equal(dueCare([guest({ lastVisit: NOW - 20 * DAY })], settings(), "fa", NOW).length, 0);

    // The owner raised the stretch — the same guest falls back out of range.
    assert.equal(
      dueCare([guest({ lastVisit: NOW - 21 * DAY })], settings({ careQuietDays: 30 }), "fa", NOW).length,
      0,
    );

    // Already texted two weeks ago: wait out another full stretch.
    const already = guest({
      lastVisit: NOW - 30 * DAY,
      care: stamp({ winback: NOW - 14 * DAY }),
    });
    assert.equal(dueCare([already], settings(), "fa", NOW).length, 0);

    // Never visited (lastVisit 0) is not a lapsed customer.
    assert.equal(dueCare([guest({ lastVisit: 0, visits: 0 })], settings(), "fa", NOW).length, 0);
  });

  it("does not re-send a birthday card across the new year", () => {
    // Birthday Jan 3, card sent Dec 29 while the party is five days out. On
    // the birthday itself the calendar year has flipped — the old rule let the
    // same guest be texted again on Jan 3; the stamp's own age cannot.
    const dec29 = Date.parse("2026-12-29T12:00:00Z");
    const jan3 = Date.parse("2027-01-03T12:00:00Z");
    const birthdayWithinWeek = guest({ birthday: "1990-01-03", lastVisit: dec29 - DAY });
    assert.equal(dueCare([birthdayWithinWeek], settings(), "fa", dec29)[0]?.kind, "birthday");

    const alreadyStamped = guest({
      birthday: "1990-01-03",
      lastVisit: dec29 - DAY,
      care: stamp({ birthday: dec29 }),
    });
    assert.equal(dueCare([alreadyStamped], settings(), "fa", jan3).length, 0);

    // A year later the stamp is over 300 days old, so the card is due again.
    const nextDecember = Date.parse("2027-12-30T12:00:00Z");
    assert.equal(dueCare([alreadyStamped], settings(), "fa", nextDecember)[0]?.kind, "birthday");
  });

  it("re-sends a birthday only after 300 days, whatever the calendar says", () => {
    const birthdaySoon = "1996-06-18"; // three days after NOW
    const justUnder = guest({
      birthday: birthdaySoon,
      care: stamp({ birthday: NOW - 299 * DAY }),
    });
    assert.equal(dueCare([justUnder], settings(), "fa", NOW).length, 0);

    const exactlyDue = guest({
      birthday: birthdaySoon,
      care: stamp({ birthday: NOW - 300 * DAY }),
    });
    assert.equal(dueCare([exactlyDue], settings(), "fa", NOW)[0]?.kind, "birthday");
  });

  it("skips a guest texted earlier today on a later run", () => {
    // The boot run sends the win-back and stamps the guest; pressing "Send
    // now" the same evening must not produce a second text.
    const gone = guest({ lastVisit: NOW - 40 * DAY });
    assert.equal(dueCare([gone], settings(), "fa", NOW)[0]?.kind, "winback");

    const stamped = guest({ lastVisit: NOW - 40 * DAY, care: stamp({ winback: NOW }) });
    assert.equal(dueCare([stamped], settings(), "fa", NOW + 8 * 3_600_000).length, 0);
  });

  it("owes a milestone once per visit count", () => {
    assert.equal(nextMilestone(9), null);
    assert.equal(nextMilestone(10), 10);
    assert.equal(nextMilestone(30), 25);
    assert.equal(nextMilestone(100), 100);

    const tenth = guest({ visits: 10 });
    assert.equal(dueCare([tenth], settings(), "fa", NOW)[0]?.kind, "milestone");

    const thanked = guest({ visits: 10, care: stamp({ milestoneVisits: 10 }) });
    assert.equal(dueCare([thanked], settings(), "fa", NOW).length, 0);

    const next = guest({ visits: 26, care: stamp({ milestoneVisits: 10 }) });
    assert.equal(dueCare([next], settings(), "fa", NOW)[0]?.milestone, 25);
  });

  it("never texts the same guest twice in one day", () => {
    // Win-back went out this morning; the milestone owed by the same guest
    // waits until tomorrow rather than landing in the same afternoon.
    const textedToday = guest({
      visits: 10,
      lastVisit: NOW - 40 * DAY,
      care: stamp({ winback: NOW - 3 * 3_600_000 }),
    });
    assert.equal(dueCare([textedToday], settings(), "fa", NOW).length, 0);
    assert.equal(dueCare([textedToday], settings(), "fa", NOW + DAY)[0]?.kind, "milestone");
  });

  it("gives each guest at most one message, birthday first", () => {
    // Lapsed AND having a birthday this week: the birthday wins.
    const both = guest({ birthday: "1996-06-16", lastVisit: NOW - 40 * DAY });
    const out = dueCare([both], settings(), "fa", NOW);
    assert.equal(out.length, 1);
    assert.equal(out[0]?.kind, "birthday");
  });

  it("skips guests who never opted in or have no usable number", () => {
    const optedOut = guest({ birthday: "1996-06-16", smsOptIn: false });
    const badPhone = guest({ id: "c-2", phone: "12345", birthday: "1996-06-16" });
    assert.equal(dueCare([optedOut, badPhone], settings(), "fa", NOW).length, 0);
  });

  it("puts birthdays ahead of win-backs in the queue", () => {
    const birthday = guest({ id: "c-b", birthday: "1996-06-16" });
    const lapsed = guest({ id: "c-w", lastVisit: NOW - 90 * DAY });
    const out = dueCare([lapsed, birthday], settings(), "fa", NOW);
    assert.deepEqual(out.map((entry) => entry.kind), ["birthday", "winback"]);
  });

  it("is quiet when the books are clean", () => {
    assert.equal(dueCare([guest()], settings(), "fa", NOW).length, 0);
  });
});

describe("care texts", () => {
  it("personalises with the guest's name and the owner's own slow hours", () => {
    const s = settings({ slowStart: 14, slowEnd: 16 });
    const birthday = careMessage("birthday", guest({ name: "سارا", points: 120 }), s, "fa");
    assert.match(birthday, /سارا/);
    assert.match(birthday, /۱۲۰/); // points in Persian digits

    const winback = careMessage("winback", guest({ name: "Ali", points: 0 }), s, "en", { quiet: 21 });
    assert.match(winback, /Ali/);
    assert.match(winback, /14–16/);
    assert.match(winback, /21/);

    const milestone = careMessage("milestone", guest({ visits: 10 }), s, "fa", { milestone: 10 });
    assert.match(milestone, /۱۰/);
  });

  it("leaves a {name} hole for the SMS screen's editable draft", () => {
    const draft = careMessage("winback", { name: "{name}", points: 0, visits: 0, spent: 0 }, settings(), "en");
    assert.match(draft, /\{name\}/);
  });
});

describe("daily bookkeeping", () => {
  it("counts only what went out today", () => {
    const today = guest({ care: stamp({ winback: NOW }) });
    const yesterday = guest({ id: "c-2", care: stamp({ birthday: NOW - DAY }) });
    assert.equal(sentToday([today, yesterday], NOW), 1);
    assert.equal(sentToday([today, yesterday], NOW + DAY), 0); // both are yesterday's now
  });

  it("keeps a sane cap", () => {
    assert.ok(CARE_DAILY_CAP > 0 && CARE_DAILY_CAP <= 30);
  });
});
