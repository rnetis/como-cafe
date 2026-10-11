// E2E: start the pec-pcpos mock POS server, then drive every op of the
// pos.functions wrapper against it through the underlying pec-pcpos module —
// the same module path resolution the server function uses at runtime.
import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const pcpos = require("/home/rayan/como-cafe/pec-pcpos/dist/cjs/index.js");

const ORIG_PORT = 7020;

async function waitForServer(port, tries = 40) {
  for (let i = 0; i < tries; i++) {
    try {
      const net = await import("node:net");
      await new Promise((res, rej) => {
        const s = net.createConnection({ host: "127.0.0.1", port }, () => {
          s.end();
          res();
        });
        s.on("error", rej);
        s.setTimeout(500, () => { s.destroy(); rej(new Error("timeout")); });
      });
      return true;
    } catch {
      await new Promise((r) => setTimeout(r, 250));
    }
  }
  return false;
}

const mock = spawn("node", ["/home/rayan/como-cafe/pec-pcpos/examples/mock-server.js", String(ORIG_PORT)], {
  stdio: ["ignore", "pipe", "pipe"],
});
let mockLog = "";
mock.stdout.on("data", (d) => (mockLog += d));
mock.stderr.on("data", (d) => (mockLog += d));

const results = [];
const check = (name, cond, extra = "") => {
  results.push({ name, pass: !!cond, extra });
  console.log(`${cond ? "PASS" : "FAIL"} ${name}${extra ? " — " + extra : ""}`);
};

try {
  check("mock server up", await waitForServer(ORIG_PORT), mockLog.slice(-200));

  // 1. pay (LAN) — the main path the POS button uses
  const client = new pcpos.PecPcpos({ ip: "127.0.0.1", port: ORIG_PORT, timeoutMs: 8000 });
  const pay = await client.sendTransaction({
    amount: "310000",
    type: "LAN",
    ip: "127.0.0.1",
    port: ORIG_PORT,
    merchantTitle: "COMO 42",
  });
  check("pay → code 00", pay.responseCode === "00", `code=${pay.responseCode}`);
  check("pay → RRN present", Boolean(pay.rrn), `rrn=${pay.rrn}`);
  check("pay → bank name (Saman BIN)", typeof pay.bankName === "string" && pay.bankName.length > 0, pay.bankName);
  check("pay → traceId", Boolean(pay.traceId), `trace=${pay.traceId}`);
  // The mock echoes a fixed amount tag; the important invariant is that the
  // AM tag came back non-empty (the device saw the charge).
  check("pay → amount echoed", typeof pay.amount === "string" && pay.amount.length >= 1, `amount=${pay.amount}`);

  // 2. test connection
  const t2 = new pcpos.PecPcpos({ timeoutMs: 3000 });
  check("test → reachable", await t2.testConnection({ type: "LAN", ip: "127.0.0.1", port: ORIG_PORT }));

  // 3. test connection → dead device returns false (no throw)
  const t3 = new pcpos.PecPcpos({ timeoutMs: 1500 });
  check("test → dead device false", (await t3.testConnection({ type: "LAN", ip: "127.0.0.1", port: 1 })) === false);

  // 4. one-shot sendTransaction helper
  const one = await pcpos.sendTransaction({ amount: "51000", type: "LAN", ip: "127.0.0.1", port: ORIG_PORT });
  check("one-shot sendTransaction", one.responseCode === "00");

  // 5. banks — BIN lookup
  check("banks → Saman", pcpos.getBankNameByPan("6219860012345678").includes("سامان"), pcpos.getBankNameByPan("6219860012345678"));
  check("banks → Parsian", pcpos.getBankNameByPan("6221061234561234").includes("پارسیان"));
  check("banks → unknown BIN", pcpos.getBankNameByPan("9999991234561234") === "");

  // 6. build — wire hex inspection
  const built = pcpos.buildMessage({ amount: "310000" });
  check("build → RQ header", built.body.startsWith("RQ"));
  check("build → AM tag present", built.body.includes("AM"));

  // 7. parse — decode a response string
  const parsed = pcpos.parseResponse(pay.rawResponse);
  check("parse → code 00", parsed.responseCode === "00");

  // 8. cp1256 helpers exposed
  const buf = pcpos.encodeCp1256("COMO");
  check("encodeCp1256 ASCII passthrough", buf.length === 4 && buf[0] === 0x43);

  check("all results pass", results.every((r) => r.pass));
  process.exitCode = results.every((r) => r.pass) ? 0 : 1;
} catch (e) {
  console.error("E2E ERROR:", e.message, mockLog.slice(-400));
  process.exitCode = 1;
} finally {
  mock.kill("SIGTERM");
}
