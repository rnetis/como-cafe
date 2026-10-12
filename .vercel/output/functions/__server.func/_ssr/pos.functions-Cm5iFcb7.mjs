import { t as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-A6pJPYTF.mjs";
import { createRequire } from "module";
//#region node_modules/.nitro/vite/services/ssr/assets/pos.functions-Cm5iFcb7.js
/**
* Physical PEC POS-device bridge, built on the repo-local `pec-pcpos`
* package (a pure-Node port of the Intek.PcPosLibrary protocol that the
* PEC terminals speak). Runs on the desk server for the same reason as
* `pec.functions.ts`: outbound TCP to the terminal or a serial COM port
* is not reachable from the browser, and the device config stays out of
* the bundle.
*
* Ops:
*  - `pay`         — send the transaction amount to the device (LAN or serial)
*  - `test`        — `PecPcpos.testConnection()` without sending money
*  - `banks`       — resolve cardholder bank from a PAN via the BIN table
*  - `raw`         — one-shot `sendTransaction()` for advanced operators
*  - `build`       — inspect the wire hex a device charge would send
*  - `parse`       — parse a raw device response string
*/
var fail = (message) => ({
	ok: false,
	responseCode: null,
	message
});
var isPlain = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
var shallow = (v) => {
	const out = {};
	for (const [k, val] of Object.entries(v)) if (typeof val === "string" || typeof val === "number" || typeof val === "boolean" || val === null) out[k] = val;
	return out;
};
var cachedModule = null;
function loadPcpos() {
	if (!cachedModule) {
		const require = createRequire(import.meta.url);
		try {
			cachedModule = require("../../pec-pcpos/dist/cjs/index.js");
		} catch {
			cachedModule = require("pec-pcpos");
		}
	}
	return cachedModule;
}
function normalize(resp) {
	const responseCode = typeof resp.responseCode === "string" ? resp.responseCode : null;
	return {
		ok: responseCode === "00",
		responseCode,
		message: responseCode === "00" ? "تراکنش روی دستگاه تأیید شد" : `پاسخ دستگاه: ${responseCode ?? "نامشخص"}`,
		data: isPlain(resp) ? shallow(resp) : null
	};
}
var posCall_createServerFn_handler = createServerRpc({
	id: "7cacdf542a79a5292788a4d4cd901f37137cff2a26622bda61e13e4a20f19433",
	name: "posCall",
	filename: "src/lib/pos.functions.ts"
}, (opts) => posCall.__executeServer(opts));
var posCall = createServerFn({ method: "POST" }).validator((input) => input).handler(posCall_createServerFn_handler, async ({ data }) => {
	let mod;
	try {
		mod = loadPcpos();
	} catch (error) {
		return fail(`بارگذاری pec-pcpos ناموفق: ${error instanceof Error ? error.message : "خطا"}`);
	}
	try {
		if (data.op === "banks") return {
			ok: true,
			responseCode: null,
			message: "بانک صادرکننده",
			data: { bankName: mod.getBankNameByPan(data.pan) }
		};
		if (data.op === "build") {
			const amount = Math.round(data.amount);
			if (!Number.isFinite(amount) || amount <= 0) return fail("مبلغ نادرست است");
			const built = mod.buildMessage({
				amount: String(amount),
				...data.prCode ? { prCode: data.prCode } : {},
				...data.currency ? { currency: data.currency } : {}
			});
			return {
				ok: true,
				responseCode: null,
				message: "پیام ساخته شد",
				data: {
					body: built.body,
					hex: built.bytes.toString("hex")
				}
			};
		}
		if (data.op === "parse") {
			const parsed = mod.parseResponse(data.rawResponse);
			return {
				ok: true,
				responseCode: null,
				message: "پاسخ تجزیه شد",
				data: isPlain(parsed) ? shallow(parsed) : null
			};
		}
		if (data.op === "raw") return normalize(await mod.sendTransaction({
			...data.request,
			timeoutMs: data.timeoutMs
		}));
		const wantType = data.type ?? "LAN";
		if (data.op === "test") return await new mod.PecPcpos({
			...wantType === "LAN" && data.ip ? {
				ip: data.ip,
				port: data.port
			} : {},
			...wantType === "SERIAL" && data.comPort ? { comPort: data.comPort } : {},
			...data.timeoutMs ? { timeoutMs: data.timeoutMs } : {}
		}).testConnection({
			type: wantType,
			ip: data.ip,
			port: data.port,
			comPort: data.comPort
		}) ? {
			ok: true,
			responseCode: null,
			message: "دستگاه در دسترس است",
			data: null
		} : fail(wantType === "LAN" ? `دستگاه در ${data.ip ?? "؟"}:${data.port ?? "?"} پاسخ نمی‌دهد` : "درگاه سریال باز نیست");
		const amount = Math.round(data.amount);
		if (!Number.isFinite(amount) || amount <= 0) return fail("مبلغ نادرست است");
		if (wantType === "LAN" && (!data.ip || !data.port)) return fail("آی‌پی و پورت دستگاه را در تنظیمات بگذار");
		if (wantType === "SERIAL" && !data.comPort) return fail("پورت سریال دستگاه را در تنظیمات بگذار");
		return normalize(await new mod.PecPcpos({
			...wantType === "LAN" && data.ip ? {
				ip: data.ip,
				port: data.port
			} : {},
			...data.timeoutMs ? { timeoutMs: data.timeoutMs } : {}
		}).sendTransaction({
			amount: String(amount),
			type: wantType,
			ip: data.ip,
			port: data.port,
			comPort: data.comPort,
			prCode: data.prCode,
			currency: data.currency,
			...data.cardholderReceipt ? { cardholderReceipt: data.cardholderReceipt } : {},
			...data.merchantReceipt ? { merchantReceipt: data.merchantReceipt } : {},
			...data.cardholderTitle ? { cardholderTitle: data.cardholderTitle } : {},
			...data.merchantTitle ? { merchantTitle: data.merchantTitle } : {},
			...data.service ? { service: data.service } : {},
			...data.serviceGroup ? { serviceGroup: data.serviceGroup } : {}
		}));
	} catch (error) {
		return fail(error instanceof Error ? error.message.slice(0, 240) : "دستگاه در دسترس نیست");
	}
});
//#endregion
export { posCall_createServerFn_handler };
