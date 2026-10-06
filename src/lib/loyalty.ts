import type { Lang, Tier } from "./types.ts";
import { tx } from "./format.ts";

export function tierOf(spent: number): Tier {
  if (spent >= 20_000_000) return "inner";
  if (spent >= 8_000_000) return "como";
  if (spent >= 2_000_000) return "regular";
  return "guest";
}

export function tierRate(tier: Tier) {
  if (tier === "inner") return 0.12;
  if (tier === "como") return 0.08;
  if (tier === "regular") return 0.05;
  return 0;
}

export function tierName(tier: Tier, lang: Lang) {
  const map: Record<Tier, [string, string]> = {
    guest: ["مهمان", "Guest"],
    regular: ["آشنا", "Regular"],
    como: ["کومو", "Como"],
    inner: ["حلقه درونی", "Inner circle"],
  };
  return tx(lang, map[tier][0], map[tier][1]);
}

export function daysUntilBirthday(iso: string, now = new Date()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const month = Number(iso.slice(5, 7));
  const day = Number(iso.slice(8, 10));
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let next = new Date(now.getFullYear(), month - 1, day);
  if (next < today) next = new Date(now.getFullYear() + 1, month - 1, day);
  return Math.round((next.getTime() - today.getTime()) / 86_400_000);
}

export function birthdaySoon(iso: string, within = 7) {
  const days = daysUntilBirthday(iso);
  return days !== null && days <= within;
}

export function quietDays(lastVisit: number, now = Date.now()) {
  if (!lastVisit) return 999;
  return Math.floor((now - lastVisit) / 86_400_000);
}

export function inSlowHour(ts: number, start: number, end: number) {
  const hour = new Date(ts).getHours();
  if (start === end) return false;
  if (start < end) return hour >= start && hour < end;
  return hour >= start || hour < end;
}

export function earnedPoints(total: number, per: number, slow: boolean) {
  if (per <= 0 || total <= 0) return 0;
  const base = Math.floor(total / per);
  return slow ? base * 2 : base;
}
