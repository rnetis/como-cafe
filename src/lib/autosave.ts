import { sanitizeDeskData } from "./sanitize";
import { snapshotOf } from "./seed";
import { useCafe } from "./store";
import type { DeskData } from "./types";

/**
 * Daily rotating snapshots of the books, kept alongside the live save in
 * localStorage. The store already persists every change — this protects
 * against the failures persistence cannot absorb: a bad restore, a buggy
 * write, or an accidental reset. Three slots rotate per day, so recovery can
 * reach back up to three days.
 */

const META_KEY = "como-backup-meta";
const SLOTS = ["como-backup-0", "como-backup-1", "como-backup-2"] as const;
/** At most ~20 hours between snapshots — a fresh day always gets a fresh copy. */
const MAX_AGE_MS = 20 * 3_600_000;

type Meta = { index: number; at: number };

function readMeta(): Meta | null {
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Meta>;
    if (
      typeof parsed.index !== "number" ||
      parsed.index < 0 ||
      parsed.index >= SLOTS.length ||
      typeof parsed.at !== "number"
    ) {
      return null;
    }
    return { index: parsed.index, at: parsed.at };
  } catch {
    return null;
  }
}

function writeSlot(index: number, data: DeskData): boolean {
  try {
    localStorage.setItem(SLOTS[index]!, JSON.stringify(data));
    return true;
  } catch {
    return false; // storage full/blocked — backups are best-effort
  }
}

/** Snapshot the current books into the next rotation slot, once per day. */
export function maybeAutoBackup(): void {
  if (typeof window === "undefined") return;
  const meta = readMeta();
  if (meta && Date.now() - meta.at < MAX_AGE_MS) return;
  const index = ((meta?.index ?? -1) + 1) % SLOTS.length;
  if (writeSlot(index, snapshotOf(useCafe.getState()))) {
    try {
      localStorage.setItem(META_KEY, JSON.stringify({ index, at: Date.now() }));
    } catch {
      // The slot itself is written; the meta loss only costs one re-write.
    }
  }
}

export type AutoBackup = { data: DeskData; at: number };

/** The most recent auto-backup, validated through the same firewall as imports. */
export function readAutoBackup(): AutoBackup | null {
  if (typeof window === "undefined") return null;
  const meta = readMeta();
  if (!meta) return null;
  try {
    const raw = localStorage.getItem(SLOTS[meta.index]!);
    if (!raw) return null;
    const data = sanitizeDeskData(JSON.parse(raw));
    return data ? { data, at: meta.at } : null;
  } catch {
    return null;
  }
}
