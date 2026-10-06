import { sanitizeDeskData } from "../sanitize";
import type { DeskData, Order, Pay } from "../types";

/**
 * The wire format between the desk (Tauri window) and phones/tablets on the
 * café LAN. Tiny and versioned: everything the desk knows travels as a
 * snapshot, everything a phone wants to do is an order request that the desk
 * prices and applies with its own rules — clients never compute money.
 */
export const LAN_PROTOCOL_VERSION = 1;

/** A full books snapshot is the biggest thing on the wire — cap what we parse. */
export const LAN_MAX_MESSAGE_BYTES = 4_000_000;

const MAX_ORDER_LINES = 40;
const MAX_NOTE_LENGTH = 140;
const PAYS: Pay[] = ["cash", "card", "online"];

export type LanOrderLine = { itemId: string; qty: number; mods: string[] };

export type LanClientMessage =
  | { t: "hello"; v: number }
  | {
      t: "order-request";
      id: string;
      lines: LanOrderLine[];
      pay: Pay;
      note: string;
      from?: string;
    }
  | { t: "ping" };

export type LanHostMessage =
  | { t: "welcome"; v: number }
  | { t: "snapshot"; seq: number; data: DeskData }
  | { t: "order-applied"; id: string; ok: boolean; order?: Order; error?: string }
  | { t: "pong" };

export type LanMessage = LanClientMessage | LanHostMessage;

export function encodeLanMessage(message: LanMessage): string {
  return JSON.stringify(message);
}

type Row = Record<string, unknown>;

const row = (value: unknown): Row | null =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Row) : null;

/**
 * Parse an inbound frame. Anything malformed, oversized, from a different
 * protocol version, or carrying a broken snapshot comes back as null — the LAN
 * is untrusted input (anyone on the wifi can dial the socket).
 */
export function parseLanMessage(raw: string): LanMessage | null {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > LAN_MAX_MESSAGE_BYTES) {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  const message = row(parsed);
  if (!message || typeof message.t !== "string") return null;

  if (message.t === "hello") {
    return message.v === LAN_PROTOCOL_VERSION ? { t: "hello", v: LAN_PROTOCOL_VERSION } : null;
  }
  if (message.t === "welcome") {
    return message.v === LAN_PROTOCOL_VERSION ? { t: "welcome", v: LAN_PROTOCOL_VERSION } : null;
  }
  if (message.t === "ping" || message.t === "pong") return { t: message.t };
  if (message.t === "snapshot") {
    const data = sanitizeDeskData(message.data);
    if (!data) return null;
    const seq = Number(message.seq);
    return {
      t: "snapshot",
      seq: Number.isFinite(seq) ? Math.max(0, Math.round(seq)) : 0,
      data,
    };
  }
  if (message.t === "order-applied") {
    if (typeof message.id !== "string" || typeof message.ok !== "boolean") return null;
    return {
      t: "order-applied",
      id: message.id.slice(0, 64),
      ok: message.ok,
      error: typeof message.error === "string" ? message.error.slice(0, 120) : undefined,
    };
  }
  if (message.t === "order-request") {
    if (typeof message.id !== "string" || !message.id) return null;
    const lines = (Array.isArray(message.lines) ? message.lines : [])
      .map(row)
      .filter(
        (line): line is Row & { itemId: string } =>
          line !== null && typeof line.itemId === "string" && line.itemId.length > 0,
      )
      .slice(0, MAX_ORDER_LINES)
      .map((line) => ({
        itemId: line.itemId,
        qty: Math.min(99, Math.max(1, Math.round(Number(line.qty) || 1))),
        mods: (Array.isArray(line.mods) ? line.mods : [])
          .filter((mod): mod is string => typeof mod === "string")
          .slice(0, 8),
      }));
    if (lines.length === 0) return null;
    return {
      t: "order-request",
      id: message.id.slice(0, 64),
      lines,
      pay: PAYS.includes(message.pay as Pay) ? (message.pay as Pay) : "card",
      note: typeof message.note === "string" ? message.note.slice(0, MAX_NOTE_LENGTH) : "",
      from: typeof message.from === "string" ? message.from.slice(0, 60) : undefined,
    };
  }
  return null;
}

export type LanOrderResult = { ok: boolean; order?: Order; error?: string };
