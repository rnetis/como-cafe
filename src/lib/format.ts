import type { Lang, Unit } from "./types.ts";

export function tx(lang: Lang, fa: string, en: string) {
  return lang === "fa" ? fa : en;
}

export function uid(prefix: string) {
  // crypto.randomUUID exists in every modern browser and Node 19+. Eight hex
  // chars keep ids short while pushing birthday collisions out of reach
  // (Math.random's 36^6 space starts colliding around ~50k live ids).
  const random =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().replaceAll("-", "").slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${random}`;
}

const loc = (lang: Lang) => (lang === "fa" ? "fa-IR" : "en-US");

export function formatToman(n: number, lang: Lang) {
  const s = new Intl.NumberFormat(loc(lang), { maximumFractionDigits: 0 }).format(Math.round(n));
  return tx(lang, `${s} تومان`, `${s} toman`);
}

export function formatCompact(n: number, lang: Lang) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) {
    const s = new Intl.NumberFormat(loc(lang), { maximumFractionDigits: 1 }).format(n / 1_000_000);
    return tx(lang, `${s} میلیون`, `${s}m`);
  }
  return formatToman(n, lang);
}

export function formatMenu(n: number, lang: Lang) {
  return new Intl.NumberFormat(loc(lang), { maximumFractionDigits: 0 }).format(Math.round(n / 1000));
}

export function formatWhen(ts: number, lang: Lang) {
  return new Intl.DateTimeFormat(lang === "fa" ? "fa-IR" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(ts));
}

export function formatDay(ts: number, lang: Lang) {
  return new Intl.DateTimeFormat(lang === "fa" ? "fa-IR" : "en-GB", {
    day: "numeric",
    month: "short",
  }).format(new Date(ts));
}

export function startOfDay(ts = Date.now()) {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Just the clock, for rows already grouped under a day heading. */
export function formatTime(ts: number, lang: Lang) {
  return new Intl.DateTimeFormat(lang === "fa" ? "fa-IR" : "en-GB", { timeStyle: "short" }).format(
    new Date(ts),
  );
}

/**
 * The name of a calendar day: "Today" and "Yesterday" carry more than a date
 * does, and only a day outside the current year needs to say which year.
 */
export function formatDayLabel(ts: number, lang: Lang) {
  const today = startOfDay();
  const day = startOfDay(ts);
  if (day === today) return tx(lang, "امروز", "Today");
  const back = new Date();
  back.setDate(back.getDate() - 1);
  if (day === startOfDay(back.getTime())) return tx(lang, "دیروز", "Yesterday");
  const sameYear = new Date(day).getFullYear() === new Date(today).getFullYear();
  return new Intl.DateTimeFormat(lang === "fa" ? "fa-IR" : "en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    ...(sameYear ? {} : { year: "numeric" }),
  }).format(new Date(day));
}

export function normPhone(input: string) {
  let s = input.replace(/[^\d]/g, "");
  if (s.startsWith("0098")) s = `0${s.slice(4)}`;
  else if (s.startsWith("98") && s.length >= 12) s = `0${s.slice(2)}`;
  else if (s.length === 10 && s.startsWith("9")) s = `0${s}`;
  return s;
}

export function validPhone(input: string) {
  return /^09\d{9}$/.test(normPhone(input));
}

export function unitLabel(unit: Unit, lang: Lang) {
  if (unit === "g") return tx(lang, "گرم", "g");
  if (unit === "ml") return tx(lang, "میلی‌لیتر", "ml");
  return tx(lang, "عدد", "pcs");
}
