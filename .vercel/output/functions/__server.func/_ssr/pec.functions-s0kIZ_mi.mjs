import { t as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-A6pJPYTF.mjs";
import { createRequire } from "module";
//#region node_modules/.nitro/vite/services/ssr/assets/pec.functions-s0kIZ_mi.js
/**
* Parsian E-commerce (pec.ir / pec.shaparak.ir) card-gateway bridge.
*
* The local `pec_ir` package builds SOAP envelopes for the NewIPG services:
* `sale.payment` → payment token + payment link, `confirm.payment` → settle
* the token, `reversal.request` → void it. Calls go through the desk server
* (like SMS) because shaparak blocks direct browser calls and the PIN must
* never sit inside the webview's JS bundle.
*/
var PEC_OK_STATUS = 0;
var fail = (message, status = -1) => ({
	ok: false,
	status,
	message,
	token: null,
	link: null
});
var cachedModule = null;
function loadPec() {
	if (!cachedModule) {
		const require = createRequire(import.meta.url);
		try {
			cachedModule = require("../../pec_ir/index.js");
		} catch {
			cachedModule = require("pec_ir");
		}
	}
	return cachedModule;
}
function normalize(result, fallback) {
	const status = typeof result?.Status === "number" ? result.Status : -1;
	const message = typeof result?.Message === "string" && result.Message ? result.Message : fallback;
	const token = result?.Token == null || Number(result.Token) === 0 ? null : result.Token;
	const link = typeof result?.link === "string" ? result.link : token ? `https://pec.shaparak.ir/NewIPG/?token=${token}` : null;
	return {
		ok: status === PEC_OK_STATUS,
		status,
		message,
		token,
		link
	};
}
var pecCall_createServerFn_handler = createServerRpc({
	id: "a5a9cd36b936e7c4ecd3c9fd70d988609beda37bd6debdec3726e8aa25f93159",
	name: "pecCall",
	filename: "src/lib/pec.functions.ts"
}, (opts) => pecCall.__executeServer(opts));
var pecCall = createServerFn({ method: "POST" }).validator((input) => input).handler(pecCall_createServerFn_handler, async ({ data }) => {
	const pin = data.pin?.trim() ?? "";
	if (pin.length < 6 || pin.length > 80) return fail("کلید پارسیان (PEC PIN) نادرست است");
	let client;
	try {
		client = loadPec()(pin);
	} catch (error) {
		return fail(`بارگذاری pec_ir ناموفق: ${error instanceof Error ? error.message : "خطا"}`);
	}
	try {
		if (data.op === "pay") {
			const amount = Math.round(data.amount);
			if (!Number.isFinite(amount) || amount <= 0) return fail("مبلغ نادرست است");
			if (!data.callBackUrl || !/^https?:\/\//i.test(data.callBackUrl)) return fail("آدرس بازگشت (CallBackUrl) نادرست است");
			const result = await client.sale.payment({
				Amount: amount,
				OrderId: data.orderId,
				CallBackUrl: data.callBackUrl,
				...data.additionalData ? { AdditionalData: data.additionalData } : {},
				...data.originator ? { Originator: data.originator } : {}
			});
			const out = normalize(result, `وضعیت ${result?.Status ?? -1}`);
			return {
				...out,
				ok: out.ok && out.token != null
			};
		}
		if (data.op === "confirm") return normalize(await client.confirm.payment(data.token), "تأیید پرداخت ناموفق");
		if (data.op === "confirm-with-amount") {
			const amount = Math.round(data.amount);
			if (!Number.isFinite(amount) || amount <= 0) return fail("مبلغ نادرست است");
			return normalize(await client.confirm.paymentWithAmount({
				Token: data.token,
				OrderId: data.orderId,
				Amount: amount
			}), "تأیید پرداخت ناموفق");
		}
		if (data.op === "reversal") return normalize(await client.reversal.request(data.token), "برگشت تراکنش ناموفق");
		return fail("عملیات ناشناخته");
	} catch (error) {
		return fail(error instanceof Error ? error.message.slice(0, 240) : "شبکه در دسترس نیست");
	}
});
//#endregion
export { pecCall_createServerFn_handler };
