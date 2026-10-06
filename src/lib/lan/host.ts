import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { create } from "zustand";
import {
  encodeLanMessage,
  LAN_PROTOCOL_VERSION,
  parseLanMessage,
  type LanMessage,
} from "./protocol";
import { isTauri } from "./detect";
import { snapshotOf } from "../seed";
import { useCafe } from "../store";
import type { CheckoutInput } from "../types";

/**
 * Desk side of the LAN, running inside the Tauri window. Rust owns the socket
 * fan-out (see `src-tauri/src/lan_server.rs`); this module decides *what* goes
 * over it: every change to the books becomes a snapshot, every order request
 * from a phone runs through the same `checkout` the register uses — so prices,
 * stock, loyalty and receipts stay consistent no matter who rings the bell.
 */

export type LanInfo = { running: boolean; port: number | null; clients: number; urls: string[] };

type LanHostState = LanInfo & { busy: boolean; error: string | null };

const DEFAULT_PORT = 8787;
const BROADCAST_DEBOUNCE_MS = 250;

export const useLanHost = create<LanHostState>()(() => ({
  running: false,
  port: null,
  clients: 0,
  urls: [],
  busy: false,
  error: null,
}));

const applyInfo = (info: Partial<LanInfo>) =>
  useLanHost.setState({
    running: info.running ?? false,
    port: info.port ?? null,
    clients: info.clients ?? 0,
    urls: info.urls ?? [],
    error: null,
  });

export async function lanStart(port: number = DEFAULT_PORT): Promise<LanInfo | null> {
  if (!isTauri()) return null;
  useLanHost.setState({ busy: true, error: null });
  try {
    const info = await invoke<LanInfo>("lan_start_server", { port });
    applyInfo(info);
    return info;
  } catch (error) {
    useLanHost.setState({ busy: false, error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

export async function lanStop(): Promise<LanInfo | null> {
  if (!isTauri()) return null;
  useLanHost.setState({ busy: true, error: null });
  try {
    const info = await invoke<LanInfo>("lan_stop_server");
    applyInfo(info);
    useLanHost.setState({ busy: false });
    return info;
  } catch (error) {
    useLanHost.setState({ busy: false, error: error instanceof Error ? error.message : String(error) });
    return null;
  }
}

export async function lanRefresh(): Promise<LanInfo | null> {
  if (!isTauri()) return null;
  try {
    const info = await invoke<LanInfo>("lan_status");
    applyInfo(info);
    useLanHost.setState({ busy: false });
    return info;
  } catch {
    return null;
  }
}

async function broadcast(message: LanMessage): Promise<void> {
  if (!isTauri()) return;
  if (!useLanHost.getState().running) return;
  try {
    await invoke("lan_broadcast", { message: encodeLanMessage(message) });
  } catch (error) {
    console.error("[lan] broadcast failed", error);
  }
}

let seq = 0;

async function broadcastSnapshot(): Promise<void> {
  seq += 1;
  await broadcast({ t: "snapshot", seq, data: snapshotOf(useCafe.getState()) });
}

/** Price and apply a phone's order with the register's own rules. */
function applyRemoteOrder(id: string, lines: { itemId: string; qty: number; mods: string[] }[], pay: CheckoutInput["pay"], note: string): void {
  const input: CheckoutInput = {
    lines: lines.map((line) => ({ itemId: line.itemId, qty: line.qty, mods: line.mods })),
    pay,
    note: note ? `LAN · ${note}`.slice(0, 140) : "LAN",
    discountPct: 0,
    useStamp: false,
    useGift: false,
    redeemPoints: 0,
  };
  const result = useCafe.getState().checkout(input);
  if (result.ok) {
    void broadcast({ t: "order-applied", id, ok: true, order: result.order });
    // checkout() already changed the store; the subscriber ships the snapshot.
  } else {
    void broadcast({ t: "order-applied", id, ok: false, error: result.error });
  }
}

function handleClientFrame(raw: string): void {
  const message = parseLanMessage(raw);
  if (!message) return;
  if (message.t === "hello") {
    void broadcast({ t: "welcome", v: LAN_PROTOCOL_VERSION });
    void broadcastSnapshot();
    return;
  }
  if (message.t === "ping") {
    void broadcast({ t: "pong" });
    return;
  }
  if (message.t === "order-request") {
    applyRemoteOrder(message.id, message.lines, message.pay, message.note);
  }
}

let started = false;
let broadcastTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Wire the desk to the LAN host: relay phones' messages in, push snapshots out
 * on every change (debounced), track the connected count. Idempotent; a no-op
 * outside the Tauri shell.
 */
export function startLanBridge(): void {
  if (!isTauri() || started) return;
  started = true;

  void useCafe.subscribe(() => {
    if (!useLanHost.getState().running) return;
    if (broadcastTimer) clearTimeout(broadcastTimer);
    broadcastTimer = setTimeout(() => {
      broadcastTimer = null;
      void broadcastSnapshot();
    }, BROADCAST_DEBOUNCE_MS);
  });

  void listen<string>("lan-message", (event) => handleClientFrame(event.payload)).catch((error) => {
    console.error("[lan] message listener failed", error);
  });

  void listen<number>("lan-clients", (event) => {
    useLanHost.setState({ clients: event.payload });
  }).catch((error) => {
    console.error("[lan] client listener failed", error);
  });

  void lanRefresh();
}