// @ts-check
/**
 * Dev-only bridge for the public REST API (`/api/public/*`). Production gets
 * these endpoints from `server/middleware/public-api.ts` via Nitro (vite.config
 * only adds the nitro plugin on build/preview), so in dev we load that same
 * middleware through `ssrLoadModule` and hand it a Web `Request` — one handler
 * implementation, two runtimes. Same pattern as `grok-pwa-plugin.mjs`.
 * @returns {import("vite").Plugin}
 */
export function publicApiPlugin() {
  /** @type {Promise<(event: unknown, next: () => unknown) => unknown> | undefined} */
  let handlerPromise;

  return {
    name: "como-public-api",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? "/", "http://localhost");
        if (!url.pathname.startsWith("/api/public/")) return next();
        try {
          handlerPromise ??= /** @type {Promise<any>} */ (
            server.ssrLoadModule("/server/middleware/public-api.ts").then((m) => m.default)
          );
          const handler = await handlerPromise;
          /** @type {Buffer[]} */
          const chunks = [];
          for await (const chunk of req) chunks.push(/** @type {Buffer} */ (chunk));
          const body = Buffer.concat(chunks);
          const request = new Request(url, {
            method: req.method,
            headers: new Headers(/** @type {Record<string,string>} */ ({ ...req.headers })),
            ...(body.length > 0 ? { body } : {}),
          });
          const response = /** @type {Response} */ (
            await handler({ url, req: request }, () => {
              throw new Error("public-api middleware fell through");
            })
          );
          res.writeHead(response.status, Object.fromEntries(response.headers));
          res.end(Buffer.from(await response.arrayBuffer()));
        } catch (err) {
          res.statusCode = 500;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) }));
        }
      });
    },
  };
}
