import { nextMilestone } from "./milestones.ts";
import { initialData } from "./seed.ts";
import { sanitizeDeskData } from "./sanitize.ts";
import type { CareStamp, DeskData } from "./types.ts";

/**
 * Persisted-state migration, kept pure and outside the store so it is worth
 * testing (the store only wires it into zustand `persist`).
 *
 * Version 3 is the customer-care release. Its whole job is "no surprise paid
 * texts": a save that predates the care switch must NOT start texting guests
 * the moment the shop updates, and it must keep any stamps a WIP save already
 * wrote instead of rewriting the history.
 *
 * So, for a pre-v3 save:
 *  - every stored setting is kept as it was — `autoSms` is never forced on,
 *    and a shop that had receipt texts off stays off;
 *  - care is switched OFF; existing books opt in through the Guests screen;
 *  - every guest is stamped as "just cared for": birthday and win-back stamps
 *    become now, so neither fires until it is genuinely due again, and
 *    `milestoneVisits` starts at the milestone the guest already passed so
 *    the upgrade does not mail a backlog of thank-yous.
 *
 * Version 3 saves are returned exactly as sanitized.
 */
export function migrateDeskData(persisted: unknown, oldVersion: number | undefined): DeskData {
  const data = sanitizeDeskData(persisted) ?? initialData();
  // `undefined` only reaches here from a hand-written save whose envelope lost
  // its version: that predates care too, so it is treated as pre-v3.
  if (typeof oldVersion === "number" && oldVersion >= 3) return data;
  const now = Date.now();
  return {
    ...data,
    // A missing `careQuietDays` needs no special case: the sanitizer above
    // already fills it with the 21-day default and clamps stored values.
    settings: { ...data.settings, careOn: false },
    customers: data.customers.map((guest) => ({
      ...guest,
      care: backfillCare(guest.care, guest.visits, now),
    })),
  };
}

/** True when no care message has ever been recorded for this guest. */
export function careIsBlank(care: CareStamp): boolean {
  return care.birthday === 0 && care.winback === 0 && care.milestone === 0 && care.milestoneVisits === 0;
}

/**
 * Fill a guest's missing stamps as if care had just run — the shape a legacy
 * guest (or a legacy backup) gets on upgrade. Stamps already present win: the
 * migration only ever adds history, it never rewrites it.
 */
export function backfillCare(care: CareStamp, visits: number, now = Date.now()): CareStamp {
  return {
    birthday: care.birthday > 0 ? care.birthday : now,
    winback: care.winback > 0 ? care.winback : now,
    // A fake milestone stamp would un-thank a real one, so it stays untouched.
    milestone: care.milestone,
    milestoneVisits: care.milestoneVisits > 0 ? care.milestoneVisits : (nextMilestone(visits) ?? 0),
  };
}

/** Field-wise newest stamp: restoring a backup never rewinds care history. */
export function maxCare(current: CareStamp, imported: CareStamp): CareStamp {
  return {
    birthday: Math.max(current.birthday, imported.birthday),
    winback: Math.max(current.winback, imported.winback),
    milestone: Math.max(current.milestone, imported.milestone),
    milestoneVisits: Math.max(current.milestoneVisits, imported.milestoneVisits),
  };
}
