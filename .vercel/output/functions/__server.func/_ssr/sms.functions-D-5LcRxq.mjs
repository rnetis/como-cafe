import { t as createServerFn } from "./ssr.mjs";
import { t as createServerRpc } from "./createServerRpc-A6pJPYTF.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/sms.functions-D-5LcRxq.js
var fail = (message) => ({
	ok: false,
	http: 0,
	message,
	balance: null,
	packId: null
});
function asRecord(value) {
	if (value && typeof value === "object") return value;
	return null;
}
var smsCall_createServerFn_handler = createServerRpc({
	id: "e30f1603d2cce39df55cacd4e6a5818bbf027e98dc7f356848295be47b57cfe6",
	name: "smsCall",
	filename: "src/lib/sms.functions.ts"
}, (opts) => smsCall.__executeServer(opts));
var smsCall = createServerFn({ method: "POST" }).validator((input) => input).handler(smsCall_createServerFn_handler, async ({ data }) => {
	const apiKey = data.apiKey?.trim() ?? "";
	if (apiKey.length < 8 || apiKey.length > 200) return fail("کلید API معتبر نیست");
	let path = "";
	let body;
	if (data.op === "credit") path = "/v1/credit";
	else if (data.op === "bulk") {
		const mobiles = (data.mobiles ?? []).slice(0, 100);
		const messageText = (data.messageText ?? "").slice(0, 800);
		if (!/^\d{4,16}$/.test(data.lineNumber ?? "")) return fail("شماره خط نادرست است");
		if (!messageText || mobiles.length === 0) return fail("متن یا گیرنده خالی است");
		path = "/v1/send/bulk";
		body = {
			lineNumber: Number(data.lineNumber),
			messageText,
			mobiles,
			sendDateTime: null
		};
	} else if (data.op === "peers") {
		const mobiles = (data.mobiles ?? []).slice(0, 100);
		const messageTexts = (data.messageTexts ?? []).slice(0, mobiles.length).map((text) => text.slice(0, 800));
		if (!/^\d{4,16}$/.test(data.lineNumber ?? "")) return fail("شماره خط نادرست است");
		if (messageTexts.length !== mobiles.length || mobiles.length === 0) return fail("تعداد متن و شماره یکی نیست");
		path = "/v1/send/likeTolike";
		body = {
			lineNumber: Number(data.lineNumber),
			messageTexts,
			mobiles,
			sendDateTime: null
		};
	} else if (data.op === "verify") {
		const templateId = Number(data.templateId);
		const parameters = (data.parameters ?? []).slice(0, 8).map((item) => ({
			name: String(item.name ?? "").slice(0, 40),
			value: String(item.value ?? "").slice(0, 80)
		}));
		if (!Number.isInteger(templateId) || templateId <= 0) return fail("شناسه قالب نادرست است");
		if (!/^09\d{9}$/.test(data.mobile ?? "")) return fail("موبایل نادرست است");
		path = "/v1/send/verify";
		body = {
			mobile: data.mobile,
			templateId,
			parameters
		};
	} else return fail("عملیات ناشناخته");
	try {
		const response = await fetch(`https://api.sms.ir${path}`, {
			method: data.op === "credit" ? "GET" : "POST",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
				"X-API-KEY": apiKey
			},
			body: body ? JSON.stringify(body) : void 0,
			signal: AbortSignal.timeout(15e3)
		});
		const text = await response.text();
		let parsed = null;
		try {
			parsed = text ? JSON.parse(text) : null;
		} catch {
			parsed = null;
		}
		const record = asRecord(parsed);
		const status = typeof record?.status === "number" ? record.status : response.ok ? 1 : 0;
		const message = typeof record?.message === "string" && record.message ? record.message : response.ok ? "ok" : text.slice(0, 180) || "sms.ir error";
		const payload = asRecord(record?.data);
		const balance = data.op === "credit" && typeof record?.data === "number" ? record.data : null;
		const packRaw = payload?.packId ?? payload?.messageId;
		return {
			ok: response.ok && status === 1,
			http: response.status,
			message,
			balance,
			packId: packRaw == null ? null : String(packRaw)
		};
	} catch (error) {
		return fail(error instanceof Error ? error.message : "network");
	}
});
//#endregion
export { smsCall_createServerFn_handler };
