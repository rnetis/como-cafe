import { startOfDay, tx, validPhone } from "./format.ts";
import { daysUntilBirthday, quietDays, tierName, tierOf } from "./loyalty.ts";
import { MILESTONES, nextMilestone } from "./milestones.ts";
import { useCafe } from "./store.ts";
import type { SendOutcome } from "./sms-send.ts";
import type { Customer, Lang, Settings } from "./types.ts";

/**
 * Customer care: the messages the desk sends without anyone asking.
 *
 * Three kinds, each with its own due rule and its own stamp on the guest
 * (`customer.care`), so a reboot, a second tab or a re-opened Guests screen
 * never re-sends:
 *
 *  - `birthday`  — once a year, while the birthday is still within a week
 *  - `winback`  — once per quiet stretch (`settings.careQuietDays`)
 *  - `milestone` — once per visit count (10, 25, 50, 100)
 *
 * A guest gets at most one care message per run, birthday first: nobody wants
 * two texts in one morning, and a birthday beats a "long time no see". On top
 * of that a guest who already had a care text today is not owed another one
 * today, whatever the rules below say — win-back now, milestone tomorrow.
 *
 * `runCare()` is what the desk calls on boot and what the Guests screen calls
 * from "send now". It sends at most `CARE_DAILY_CAP` messages per day, most
 * neglected guest first, so a list that has been ignored for a year rolls out
 * over a few mornings instead of landing as one blast.
 */

export type CareKind = "birthday" | "winback" | "milestone";

export type CareGuest = Pick<Customer, "name" | "points" | "visits" | "spent">;

export type CareDue = {
  customer: Customer;
  kind: CareKind;
  text: string;
  milestone: number | null;
};

export type CareResult = {
  due: number;
  sent: number;
  status: "idle" | "done" | "failed" | "busy";
  detail: string;
};

/** Re-exported from the pure module so existing imports keep working. */
export { MILESTONES, nextMilestone };

/** Care texts per calendar day. A neglected list rolls out over a few days. */
export const CARE_DAILY_CAP = 12;

const DAY = 86_400_000;

/** How many days before the birthday the card goes out. */
export const BIRTHDAY_WINDOW = 7;

/**
 * A birthday card goes out once a year — but measured from the stamp, not from
 * the calendar's year of the stamp. Second-resolution day-of-year comparisons
 * (the old `stampYear < thisYear` rule) let a Dec 29 card for a Jan 3 birthday
 * go a second time in January; a minimum distance of 300 days cannot.
 */
const BIRTHDAY_RESEND_MS = 300 * DAY;


/** Persian digits for Persian prose — «۲۱ روز» reads right, «21 روز» does not. */
const fa = (value: number | string) =>
  String(value).replace(/\d/g, (digit) => "۰۱۲۳۴۵۶۷۸۹"[Number(digit)] ?? digit);

export { fa as faNum };

/**
 * The care messages owed right now, most urgent first. Reads only its
 * arguments — the pure half of the automation, and the half worth testing.
 */
export function dueCare(
  customers: Customer[],
  settings: Settings,
  lang: Lang,
  now = Date.now(),
): CareDue[] {
  if (!settings.careOn) return [];
  const quiet = Math.max(1, Math.round(settings.careQuietDays));
  const out: CareDue[] = [];

  for (const guest of customers) {
    if (!guest.smsOptIn || !validPhone(guest.phone)) continue;
    // One care text per guest per day, whichever kind sent it and whichever
    // path (boot or "Send now") sent it; the stamp's own day is the lock.
    if (stampedToday(guest, now)) continue;

    // Once a year, measured from the stamp rather than the calendar's year, so
    // a card sent on Dec 29 for a Jan 3 birthday cannot go again on Jan 3. The
    // window is measured against the run's `now`, not the wall clock, so the
    // rule stays deterministic (and testable).
    const daysToBirthday = daysUntilBirthday(guest.birthday, new Date(now));
    const birthdayDue =
      daysToBirthday !== null &&
      daysToBirthday <= BIRTHDAY_WINDOW &&
      (guest.care.birthday === 0 || now - guest.care.birthday >= BIRTHDAY_RESEND_MS);
    if (birthdayDue) {
      out.push({
        customer: guest,
        kind: "birthday",
        text: careMessage("birthday", guest, settings, lang),
        milestone: null,
      });
      continue;
    }

    const gone = quietDays(guest.lastVisit, now);
    const winbackDue =
      guest.visits > 0 &&
      guest.lastVisit > 0 &&
      gone >= quiet &&
      (guest.care.winback === 0 || now - guest.care.winback >= quiet * DAY);
    if (winbackDue) {
      out.push({
        customer: guest,
        kind: "winback",
        text: careMessage("winback", guest, settings, lang, { quiet: gone }),
        milestone: null,
      });
      continue;
    }

    const milestone = nextMilestone(guest.visits);
    if (milestone !== null && guest.care.milestoneVisits < milestone) {
      out.push({
        customer: guest,
        kind: "milestone",
        text: careMessage("milestone", guest, settings, lang, { milestone }),
        milestone,
      });
    }
  }

  const weight = (due: CareDue) =>
    due.kind === "birthday" ? 0 : due.kind === "winback" ? 1 : 2;
  return out.sort((a, b) => {
    if (weight(a) !== weight(b)) return weight(a) - weight(b);
    if (a.kind === "winback") {
      return quietDays(b.customer.lastVisit, now) - quietDays(a.customer.lastVisit, now);
    }
    if (a.kind === "birthday") {
      return a.customer.name.localeCompare(b.customer.name);
    }
    return (b.milestone ?? 0) - (a.milestone ?? 0);
  });
}

/**
 * The text itself. Personalised (name, points, tier, the owner's own slow
 * hours) so a care message never reads like a broadcast — and built from the
 * same settings the register charges with, so it can't promise a discount the
 * till would not honour.
 *
 * `guest.name` may be the literal `{name}` when a template is wanted for the
 * SMS screen's editable draft.
 */
export function careMessage(
  kind: CareKind,
  guest: CareGuest,
  settings: Settings,
  lang: Lang,
  extra: { quiet?: number; milestone?: number } = {},
): string {
  const name = guest.name;
  const slow = `${settings.slowStart}–${settings.slowEnd}`;

  if (kind === "birthday") {
    const points = guest.points > 0 ? fa(guest.points) : "";
    return tx(
      lang,
      `${name} عزیز، تولدت مبارک. این هفته در کومو یک نوشیدنی تا سقف لاته سیروپ مهمان ما.${points ? ` ${points} امتیاز هم داری.` : ""}`,
      `${name}, happy birthday. This week a drink up to a syrup latte is on the house at COMO.${points ? ` You also have ${points} points.` : ""}`,
    );
  }

  if (kind === "winback") {
    const quiet = extra.quiet ?? settings.careQuietDays;
    const points = guest.points > 0 ? fa(guest.points) : "";
    return tx(
      lang,
      `${name} عزیز، ${fa(quiet)} روز بود نیومدی. از ${fa(slow)} امتیازها دو برابر است${points ? ` و ${fa(points)} امتیاز به نامت هست` : ""}. کومو منتظرت است.`,
      `${name}, it has been ${quiet} quiet days. Points double between ${slow}${points ? `, and ${points} points are waiting for you` : ""}. COMO misses you.`,
    );
  }

  const milestone = extra.milestone ?? nextMilestone(guest.visits) ?? 0;
  const tier = tierName(tierOf(guest.spent), lang);
  return tx(
    lang,
    `${name} عزیز، ${fa(milestone)}مین حضورت در کومو ثبت شد. ${tier} شده‌ای و ${fa(guest.points)} امتیاز داری — ممنون که هستی.`,
    `${name}, that is your ${milestone}th visit to COMO. You are a ${tier} with ${guest.points} points — thank you.`,
  );
}

/** The short label for a kind, in the desk's two languages. */
export function careKindLabel(kind: CareKind, lang: Lang): string {
  const per: Record<CareKind, string> = {
    birthday: "تولد",
    winback: "دلتنگی",
    milestone: "سالگرد حضور",
  };
  const eng: Record<CareKind, string> = {
    birthday: "Birthday",
    winback: "Win-back",
    milestone: "Milestone",
  };
  return tx(lang, per[kind], eng[kind]);
}

/** A draft with a `{name}` hole, for the SMS screen's editable preview. */
export function careDraft(kind: CareKind, settings: Settings, lang: Lang): string {
  return careMessage(kind, { name: "{name}", points: 0, visits: 0, spent: 0 }, settings, lang);
}

/** Whether any kind of care text already reached this guest today. */
export function stampedToday(guest: Customer, now = Date.now()): boolean {
  const dayStart = startOfDay(now);
  return (
    guest.care.birthday >= dayStart || guest.care.winback >= dayStart || guest.care.milestone >= dayStart
  );
}

/** How many care messages already went out today, across every kind. */
export function sentToday(customers: Customer[], now = Date.now()): number {
  return customers.filter((guest) => stampedToday(guest, now)).length;
}

let inFlight: Promise<CareResult> | null = null;

/**
 * Send everything due, up to the daily cap. Safe to call from anywhere and
 * any number of times: an in-flight run is shared, and the stamps written
 * after a send keep the next call from repeating it.
 *
 * Nothing is sent (or logged, or stamped) without an API key: "practice mode"
 * writing stamps would mark real messages as already delivered, and the guest
 * would never get their birthday text once the owner adds the key. Failures
 * are not stamped either — a bad key should retry on the next boot rather
 * than swallow the day's messages.
 */
export async function runCare(opts: { cap?: number } = {}): Promise<CareResult> {
  if (inFlight) return inFlight;
  const run = (async (): Promise<CareResult> => {
    const state = useCafe.getState();
    const { settings, customers } = state;
    const lang = settings.lang;
    if (!settings.careOn) {
      return { due: 0, sent: 0, status: "idle", detail: tx(lang, "مراقبت از مشتری خاموش است", "Customer care is off") };
    }
    if (!settings.smsApiKey.trim()) {
      return {
        due: 0,
        sent: 0,
        status: "idle",
        detail: tx(
          lang,
          "کلید SMS.ir نیست — پیامی فرستاده نشد",
          "No SMS.ir API key — nothing was sent",
        ),
      };
    }

    const now = Date.now();
    const due = dueCare(customers, settings, lang, now);
    if (due.length === 0) {
      return { due: 0, sent: 0, status: "idle", detail: tx(lang, "چیزی در نوبت نیست", "Nothing is due") };
    }

    // The panel's own cap can never flood the list: at most 100 guests per run.
    const cap = Math.min(100, Math.max(1, Math.round(opts.cap ?? CARE_DAILY_CAP)));
    const room = cap - sentToday(customers, now);
    const take = due.slice(0, Math.max(0, room));
    if (take.length === 0) {
      return {
        due: due.length,
        sent: 0,
        status: "idle",
        detail: tx(lang, `سقف امروز (${fa(cap)} پیام) پر شد؛ بقیه فردا`, `Today's ${cap}-message cap is full; the rest go tomorrow`),
      };
    }

    // Loaded here rather than at the top: the due-rules and templates are
    // pure and testable without dragging the SMS transport (and the server
    // function behind it) into the module graph. The transport can reject (a
    // dead server function, a network blip), so it is fenced: care automation
    // must never take the desk's boot down with it.
    let outcome: SendOutcome;
    try {
      const { sendOut } = await import("./sms-send.ts");
      outcome = await sendOut({
        apiKey: settings.smsApiKey,
        line: settings.smsLine,
        kind: "care",
        messages: take.map((entry) => ({ mobile: entry.customer.phone, text: entry.text })),
      });
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      const detail = tx(lang, `ارسال نشد: ${reason}`, `Send failed: ${reason}`);
      useCafe.getState().logSms({ to: [], body: "", kind: "care", status: "failed", detail });
      return { due: due.length, sent: 0, status: "failed", detail };
    }

    // One store write for the log row and the stamps: the log can never show
    // a message the automation would happily send again, and a partial write
    // can never stamp a send that did not happen. Only a real "sent" stamps.
    const at = Date.now();
    const sent = outcome.status === "sent";
    useCafe.getState().recordCare({
      log: { to: outcome.to, body: outcome.body, kind: "care", status: outcome.status, detail: outcome.detail },
      marks: sent
        ? take.map((entry) => ({
            id: entry.customer.id,
            kind: entry.kind,
            at,
            ...(entry.kind === "milestone" && entry.milestone !== null
              ? { milestoneVisits: entry.milestone }
              : {}),
          }))
        : [],
    });

    return {
      due: due.length,
      sent: sent ? take.length : 0,
      status: outcome.status === "failed" ? "failed" : "done",
      detail:
        outcome.status === "sent"
          ? tx(lang, `${fa(take.length)} پیام ارسال شد`, `${take.length} messages sent`)
          : outcome.detail,
    };
  })();

  inFlight = run;
  try {
    return await run;
  } finally {
    if (inFlight === run) inFlight = null;
  }
}
