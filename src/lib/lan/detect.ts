/**
 * Which world is this page running in?
 *
 *  - **host**   — the Tauri desktop window (`__TAURI_INTERNALS__` injected) or
 *                 the hosted web app. Holds the books, hosts phones.
 *  - **client** — a phone/tablet that opened the LAN URL the desk published.
 *                 Served the same bundle, but it is a window into someone
 *                 else's desk, never the source of truth.
 */
export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export function isLanClient(): boolean {
  if (typeof window === "undefined" || isTauri()) return false;
  const host = window.location.hostname;
  if (!host) return false;
  return host !== "localhost" && host !== "127.0.0.1" && host !== "[::1]";
}

/** The desk's WebSocket endpoint on the machine that served this page. */
export function lanSocketUrl(): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws`;
}