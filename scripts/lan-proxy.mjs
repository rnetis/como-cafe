#!/usr/bin/env node
/**
 * The LAN door for the desk.
 *
 * The dev server owns 127.0.0.1:8080 and stays there — that is the live-preview
 * contract, and it is also what keeps one Vite instance (and one `.vite` cache)
 * behind every screen in the café. This script binds the whole LAN on :3000 and
 * forwards everything to it, WebSocket upgrades included, so a tablet or phone
 * opening http://<café-machine>:3000 gets the same desk, with hot reload.
 *
 * `Host` is rewritten to loopback before the request reaches Vite: the dev
 * server's DNS-rebinding guard only trusts local hosts, and a request arriving
 * with `Host: 192.168.x.x:3000` would otherwise be refused. The real host rides
 * along in `X-Forwarded-Host` for anything that cares.
 *
 * No dependencies, no config: `node scripts/lan-proxy.mjs`.
 */
import http from "node:http";
import net from "node:net";

const PORT = Number(process.env.LAN_PORT ?? 3000);
const HOST = process.env.LAN_HOST ?? "0.0.0.0";
const TARGET_HOST = process.env.LAN_TARGET_HOST ?? "127.0.0.1";
const TARGET_PORT = Number(process.env.LAN_TARGET_PORT ?? 8080);

/** The headers we hand upstream: the original ones, with the door's own facts
 *  attached and `Host` pointed at the dev server. */
function upstreamHeaders(headers, origin) {
  const out = {};
  for (const [key, value] of Object.entries(headers)) {
    if (value === undefined) continue;
    out[key] = Array.isArray(value) ? value.join(", ") : value;
  }
  out.host = `${TARGET_HOST}:${TARGET_PORT}`;
  out["x-forwarded-host"] = headers.host ?? "";
  out["x-forwarded-proto"] = "http";
  if (origin) out["x-forwarded-for"] = origin;
  return out;
}

const server = http.createServer((req, res) => {
  const upstream = http.request(
    {
      host: TARGET_HOST,
      port: TARGET_PORT,
      method: req.method,
      path: req.url,
      headers: upstreamHeaders(req.headers, req.socket.remoteAddress ?? ""),
    },
    (reply) => {
      res.writeHead(reply.statusCode ?? 502, reply.headers);
      reply.pipe(res);
    },
  );
  upstream.on("error", () => {
    if (!res.headersSent) res.writeHead(502, { "content-type": "text/plain; charset=utf-8" });
    res.end("COMO desk is not up yet — the dev server on the other side is not answering.");
  });
  req.pipe(upstream);
});

// Hot reload talks WebSocket. The browser dials this door, so the upgrade has to
// be tunnelled too — and the `Origin` rewritten to loopback, or Vite's own host
// check drops the socket and the café screens never see an edit.
server.on("upgrade", (req, socket, head) => {
  const headers = upstreamHeaders(req.headers, req.socket.remoteAddress ?? "");
  if (req.headers.origin) headers.origin = `http://${TARGET_HOST}:${TARGET_PORT}`;
  const upstream = net.connect(TARGET_PORT, TARGET_HOST, () => {
    upstream.write(
      `${req.method} ${req.url} HTTP/1.1\r\n` +
        Object.entries(headers)
          .map(([key, value]) => `${key}: ${value}`)
          .join("\r\n") +
        "\r\n\r\n",
    );
    if (head?.length) upstream.write(head);
    upstream.pipe(socket);
    socket.pipe(upstream);
  });
  const drop = () => {
    socket.destroy();
    upstream.destroy();
  };
  upstream.on("error", drop);
  socket.on("error", drop);
});

server.on("error", (error) => {
  console.error(`[como] LAN door could not open ${HOST}:${PORT} —`, error.message);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log(`[como] LAN door open on http://${HOST}:${PORT} → ${TARGET_HOST}:${TARGET_PORT}`);
});
