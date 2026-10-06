import type { Lang, Unit } from "./types";

export function tx(lang: Lang, fa: string, en: string) {
  return lang === "fa" ? fa : en;
}

export function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
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
