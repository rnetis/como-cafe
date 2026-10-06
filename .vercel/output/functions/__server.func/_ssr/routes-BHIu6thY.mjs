import { i as __toESM } from "../_runtime.mjs";
import { J as require_react, x as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { a as Search, c as Package, d as Coffee, f as BookOpen, i as Settings, l as Minus, o as ScrollText, r as Trash2, s as Plus, t as Users, u as MessageSquare } from "../_libs/lucide-react.mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { n as toast, t as Toaster } from "../_libs/sonner.mjs";
import { t as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { a as ResponsiveContainer, i as Bar, n as YAxis, o as Tooltip, r as XAxis, t as BarChart } from "../_libs/recharts+[...].mjs";
import { n as create, t as persist } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BHIu6thY.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function ComoMark({ className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 72 240",
		className: cn("h-16 w-6 text-ink", className),
		"aria-hidden": "true",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
				x: "1",
				y: "1",
				width: "54",
				height: "214",
				rx: "8",
				fill: "currentColor"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
				fill: "var(--color-paper)",
				fontFamily: "Vazirmatn, DejaVu Sans, sans-serif",
				fontWeight: "800",
				fontSize: "34",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
						x: "28",
						y: "50",
						textAnchor: "middle",
						children: "C"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
						x: "28",
						y: "96",
						textAnchor: "middle",
						children: "O"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
						x: "28",
						y: "142",
						textAnchor: "middle",
						children: "M"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
						x: "28",
						y: "188",
						textAnchor: "middle",
						children: "O"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
				cx: "62",
				cy: "222",
				r: "7",
				fill: "currentColor"
			})
		]
	});
}
function Btn({ tone = "ink", className, type = "button", ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type,
		className: cn("inline-flex h-12 items-center justify-center gap-2 px-4 text-sm font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-40", tone === "ink" && "bg-ink text-paper", tone === "line" && "border border-line bg-sheet text-ink", tone === "ghost" && "text-ink", tone === "stamp" && "bg-stamp text-paper", className),
		...props
	});
}
var fieldClass = "h-12 w-full border border-line bg-sheet px-3 text-base text-ink outline-none focus:border-ink";
function Field({ label, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "block",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "mb-1 block text-xs text-mute",
			children: label
		}), children]
	});
}
function Kpi({ label, value, hint }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "border border-line bg-sheet px-3 py-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-mute",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xl font-medium leading-none",
				children: value
			}),
			hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-xs text-mute",
				children: hint
			}) : null
		]
	});
}
function tx(lang, fa, en) {
	return lang === "fa" ? fa : en;
}
function uid(prefix) {
	return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}
var loc = (lang) => lang === "fa" ? "fa-IR" : "en-US";
function formatToman(n, lang) {
	const s = new Intl.NumberFormat(loc(lang), { maximumFractionDigits: 0 }).format(Math.round(n));
	return tx(lang, `${s} تومان`, `${s} toman`);
}
function formatCompact(n, lang) {
	if (Math.abs(n) >= 1e6) {
		const s = new Intl.NumberFormat(loc(lang), { maximumFractionDigits: 1 }).format(n / 1e6);
		return tx(lang, `${s} میلیون`, `${s}m`);
	}
	return formatToman(n, lang);
}
function formatMenu(n, lang) {
	return new Intl.NumberFormat(loc(lang), { maximumFractionDigits: 0 }).format(Math.round(n / 1e3));
}
function formatWhen(ts, lang) {
	return new Intl.DateTimeFormat(lang === "fa" ? "fa-IR" : "en-GB", {
		dateStyle: "medium",
		timeStyle: "short"
	}).format(new Date(ts));
}
function formatDay(ts, lang) {
	return new Intl.DateTimeFormat(lang === "fa" ? "fa-IR" : "en-GB", {
		day: "numeric",
		month: "short"
	}).format(new Date(ts));
}
function startOfDay(ts = Date.now()) {
	const d = new Date(ts);
	d.setHours(0, 0, 0, 0);
	return d.getTime();
}
function normPhone(input) {
	let s = input.replace(/[^\d]/g, "");
	if (s.startsWith("0098")) s = `0${s.slice(4)}`;
	else if (s.startsWith("98") && s.length >= 12) s = `0${s.slice(2)}`;
	else if (s.length === 10 && s.startsWith("9")) s = `0${s}`;
	return s;
}
function validPhone(input) {
	return /^09\d{9}$/.test(normPhone(input));
}
function unitLabel(unit, lang) {
	if (unit === "g") return tx(lang, "گرم", "g");
	if (unit === "ml") return tx(lang, "میلی‌لیتر", "ml");
	return tx(lang, "عدد", "pcs");
}
function inRange(ts, range, now = Date.now()) {
	if (range === "today") return ts >= startOfDay(now);
	const days = range === "d7" ? 7 : 30;
	return ts >= startOfDay(now) - (days - 1) * 864e5;
}
function expectedDrawer(data) {
	const cashSales = data.orders.filter((order) => order.pay === "cash").reduce((sum, order) => sum + order.total, 0);
	const cashExp = data.expenses.filter((expense) => expense.method === "cash").reduce((sum, expense) => sum + expense.amount, 0);
	const moves = data.cashMoves.reduce((sum, move) => sum + move.amount, 0);
	return data.settings.float + cashSales + moves - cashExp;
}
var CATEGORIES = [
	{
		id: "hot-coffee",
		fa: "قهوه گرم",
		en: "Hot coffee"
	},
	{
		id: "iced-coffee",
		fa: "قهوه سرد",
		en: "Iced coffee"
	},
	{
		id: "brew",
		fa: "دم‌آوری",
		en: "Brew bar"
	},
	{
		id: "hot-drinks",
		fa: "نوشیدنی گرم",
		en: "Hot drinks"
	},
	{
		id: "mocktail",
		fa: "موکتیل",
		en: "Mocktail"
	}
];
var pair = (sku, qty) => [sku, qty];
var H = pair("cup-h", 1);
var C = pair("cup-c", 1);
var L = pair("lid", 1);
var N = pair("napkin", 1);
var B = pair("beans", 18);
var ICE = (g) => pair("ice", g);
function item(draft) {
	return {
		...draft,
		active: true,
		recipe: draft.recipe.map(([sku, qty]) => ({
			sku,
			qty
		}))
	};
}
var K = 1e3;
var MENU = [
	item({
		id: "espresso",
		category: "hot-coffee",
		nameEn: "Espresso",
		nameFa: "اسپرسو",
		price: 225 * K,
		recipe: [
			B,
			H,
			N
		]
	}),
	item({
		id: "americano",
		category: "hot-coffee",
		nameEn: "Americano",
		nameFa: "امریکانو",
		price: 245 * K,
		recipe: [
			B,
			H,
			N
		]
	}),
	item({
		id: "latte",
		category: "hot-coffee",
		nameEn: "Latte",
		nameFa: "لاته",
		price: 270 * K,
		recipe: [
			B,
			pair("milk", 180),
			H,
			N
		]
	}),
	item({
		id: "latte-syrup",
		category: "hot-coffee",
		nameEn: "Latte + syrup",
		nameFa: "لاته سیروپ",
		price: 310 * K,
		recipe: [
			B,
			pair("milk", 170),
			pair("syrup", 20),
			H,
			N
		]
	}),
	item({
		id: "cortado",
		category: "hot-coffee",
		nameEn: "Cortado",
		nameFa: "کورتادو",
		price: 280 * K,
		recipe: [
			B,
			pair("milk", 60),
			H,
			N
		]
	}),
	item({
		id: "cappuccino",
		category: "hot-coffee",
		nameEn: "Cappuccino",
		nameFa: "کاپوچینو",
		price: 285 * K,
		recipe: [
			B,
			pair("milk", 120),
			H,
			N
		]
	}),
	item({
		id: "freddo",
		category: "iced-coffee",
		nameEn: "Freddo",
		nameFa: "فردو",
		price: 260 * K,
		recipe: [
			B,
			pair("milk", 90),
			ICE(80),
			C,
			L,
			N
		]
	}),
	item({
		id: "brown-sugar",
		category: "iced-coffee",
		nameEn: "Brown sugar",
		nameFa: "براون شوگر",
		price: 280 * K,
		recipe: [
			B,
			pair("milk", 150),
			pair("brown", 25),
			ICE(70),
			C,
			L,
			N
		]
	}),
	item({
		id: "spanish-latte",
		category: "iced-coffee",
		nameEn: "Spanish latte",
		nameFa: "اسپنیش لاته",
		price: 390 * K,
		recipe: [
			B,
			pair("milk", 140),
			pair("condensed", 30),
			ICE(60),
			C,
			L,
			N
		]
	}),
	item({
		id: "blue-espresso",
		category: "iced-coffee",
		nameEn: "Blue espresso",
		nameFa: "بلو اسپرسو",
		price: 335 * K,
		recipe: [
			B,
			pair("milk", 50),
			pair("blue", 25),
			ICE(70),
			C,
			L,
			N
		]
	}),
	item({
		id: "mont-blanc",
		category: "iced-coffee",
		nameEn: "Mont blanc",
		nameFa: "مون بلان",
		price: 390 * K,
		recipe: [
			B,
			pair("milk", 100),
			pair("cream", 40),
			pair("choc", 12),
			ICE(40),
			C,
			L,
			N
		]
	}),
	item({
		id: "apple-milk",
		category: "iced-coffee",
		nameEn: "Apple milk washed",
		nameFa: "اپل میلک واشد",
		price: 450 * K,
		recipe: [
			B,
			pair("milk", 110),
			pair("apple", 40),
			ICE(50),
			C,
			L,
			N
		]
	}),
	item({
		id: "iced-americano",
		category: "iced-coffee",
		nameEn: "Americano",
		nameFa: "امریکانو",
		price: 260 * K,
		recipe: [
			B,
			ICE(100),
			C,
			L,
			N
		]
	}),
	item({
		id: "iced-latte",
		category: "iced-coffee",
		nameEn: "Latte",
		nameFa: "لاته",
		price: 310 * K,
		recipe: [
			B,
			pair("milk", 180),
			ICE(70),
			C,
			L,
			N
		]
	}),
	item({
		id: "iced-latte-syrup",
		category: "iced-coffee",
		nameEn: "Latte + syrup",
		nameFa: "لاته سیروپ",
		price: 335 * K,
		recipe: [
			B,
			pair("milk", 160),
			pair("syrup", 20),
			ICE(70),
			C,
			L,
			N
		]
	}),
	item({
		id: "nut-queen",
		category: "iced-coffee",
		nameEn: "Nut queen",
		nameFa: "نات کوئین",
		price: 380 * K,
		recipe: [
			B,
			pair("milk", 140),
			pair("hazelnut", 20),
			ICE(50),
			C,
			L,
			N
		]
	}),
	item({
		id: "espresso-martini",
		category: "iced-coffee",
		nameEn: "Espresso martini",
		nameFa: "اسپرسو مارتینی",
		price: 290 * K,
		recipe: [
			pair("beans", 36),
			pair("syrup", 15),
			ICE(80),
			C,
			L,
			N
		]
	}),
	item({
		id: "cold-brew",
		category: "brew",
		nameEn: "Cold brew",
		nameFa: "کلد برو",
		price: 290 * K,
		recipe: [
			pair("cb", 140),
			ICE(40),
			C,
			L,
			N
		]
	}),
	item({
		id: "cold-brew-raspberry",
		category: "brew",
		nameEn: "Cold brew + raspberry",
		nameFa: "کلد برو رزبری",
		price: 330 * K,
		recipe: [
			pair("cb", 120),
			pair("rasp", 30),
			ICE(40),
			C,
			L,
			N
		]
	}),
	item({
		id: "cold-brew-soda",
		category: "brew",
		nameEn: "Cold brew + soda lemon",
		nameFa: "کلد برو سودا لیمو",
		price: 330 * K,
		recipe: [
			pair("cb", 100),
			pair("soda", 80),
			pair("lemon", 15),
			ICE(40),
			C,
			L,
			N
		]
	}),
	item({
		id: "v60",
		category: "brew",
		nameEn: "V60",
		nameFa: "وی ۶۰",
		price: 385 * K,
		recipe: [
			pair("beans", 22),
			pair("f-v60", 1),
			H,
			N
		]
	}),
	item({
		id: "chemex",
		category: "brew",
		nameEn: "Chemex",
		nameFa: "کمکس",
		price: 450 * K,
		recipe: [
			pair("beans", 32),
			pair("f-chem", 1),
			H,
			N
		]
	}),
	item({
		id: "agave-brew",
		category: "brew",
		nameEn: "Agave brew",
		nameFa: "آگاوه برو",
		price: 400 * K,
		recipe: [
			pair("beans", 20),
			pair("agave", 15),
			H,
			N
		]
	}),
	item({
		id: "mocha-cold-brew",
		category: "brew",
		nameEn: "Mocha cold brew",
		nameFa: "موکا کلد برو",
		price: 390 * K,
		recipe: [
			pair("cb", 110),
			pair("milk", 60),
			pair("choc", 18),
			ICE(40),
			C,
			L,
			N
		]
	}),
	item({
		id: "tea",
		category: "hot-drinks",
		nameEn: "Tea",
		nameFa: "چای",
		price: 210 * K,
		recipe: [
			pair("tea", 1),
			pair("sugar", 8),
			H,
			N
		]
	}),
	item({
		id: "hot-chocolate",
		category: "hot-drinks",
		nameEn: "Hot chocolate",
		nameFa: "هات چاکلت",
		price: 260 * K,
		recipe: [
			pair("cocoa", 18),
			pair("milk", 200),
			H,
			N
		]
	}),
	item({
		id: "karak",
		category: "hot-drinks",
		nameEn: "Karak",
		nameFa: "کرک",
		price: 220 * K,
		recipe: [
			pair("tea", 1),
			pair("milk", 160),
			pair("spice", 4),
			pair("sugar", 10),
			H,
			N
		]
	}),
	item({
		id: "masala",
		category: "hot-drinks",
		nameEn: "Masala",
		nameFa: "ماسالا",
		price: 220 * K,
		recipe: [
			pair("tea", 1),
			pair("milk", 160),
			pair("spice", 6),
			H,
			N
		]
	}),
	item({
		id: "chocolate-raspberry",
		category: "hot-drinks",
		nameEn: "Chocolate raspberry",
		nameFa: "چاکلت رزبری",
		price: 270 * K,
		recipe: [
			pair("cocoa", 16),
			pair("milk", 160),
			pair("rasp", 20),
			H,
			N
		]
	}),
	item({
		id: "tequilaina",
		category: "mocktail",
		nameEn: "Tequilaina",
		nameFa: "تکیلانینا",
		price: 340 * K,
		recipe: [
			pair("lime", 30),
			pair("soda", 140),
			pair("agave", 15),
			pair("salt", 1),
			ICE(80),
			C,
			L,
			N
		]
	}),
	item({
		id: "como-salty",
		category: "mocktail",
		nameEn: "Como salty",
		nameFa: "کومو سالتی",
		price: 350 * K,
		recipe: [
			pair("lime", 25),
			pair("soda", 150),
			pair("salt", 2),
			ICE(70),
			C,
			L,
			N
		]
	}),
	item({
		id: "maldive",
		category: "mocktail",
		nameEn: "Maldive",
		nameFa: "مالدیو",
		price: 310 * K,
		recipe: [
			pair("coconut", 80),
			pair("soda", 80),
			pair("lime", 15),
			ICE(70),
			C,
			L,
			N
		]
	}),
	item({
		id: "redemption",
		category: "mocktail",
		nameEn: "Redemption",
		nameFa: "ردمپشن",
		price: 330 * K,
		recipe: [
			pair("berry", 60),
			pair("lime", 20),
			pair("soda", 80),
			ICE(60),
			C,
			L,
			N
		]
	}),
	item({
		id: "lemonade",
		category: "mocktail",
		nameEn: "Lemonade",
		nameFa: "لیموناد",
		price: 290 * K,
		recipe: [
			pair("lemon", 40),
			pair("sugar", 18),
			pair("soda", 120),
			ICE(70),
			C,
			L,
			N
		]
	}),
	item({
		id: "namir-soon",
		category: "mocktail",
		nameEn: "Namir soon",
		nameFa: "نامیر سون",
		price: 330 * K,
		recipe: [
			pair("orange", 80),
			pair("berry", 30),
			pair("soda", 60),
			ICE(60),
			C,
			L,
			N
		]
	}),
	item({
		id: "brando",
		category: "mocktail",
		nameEn: "Brando",
		nameFa: "برندو",
		price: 310 * K,
		recipe: [
			pair("orange", 50),
			pair("cb", 60),
			pair("agave", 10),
			ICE(50),
			C,
			L,
			N
		]
	})
];
var INGREDIENTS = [
	{
		sku: "beans",
		nameFa: "دانه اسپرسو",
		nameEn: "Espresso beans",
		unit: "g",
		onHand: 4800,
		par: 2e3,
		cost: 2200
	},
	{
		sku: "milk",
		nameFa: "شیر",
		nameEn: "Milk",
		unit: "ml",
		onHand: 18e3,
		par: 8e3,
		cost: 55
	},
	{
		sku: "oat",
		nameFa: "شیر جو",
		nameEn: "Oat milk",
		unit: "ml",
		onHand: 2400,
		par: 1e3,
		cost: 180
	},
	{
		sku: "syrup",
		nameFa: "سیروپ",
		nameEn: "Syrup",
		unit: "ml",
		onHand: 900,
		par: 400,
		cost: 380
	},
	{
		sku: "brown",
		nameFa: "سیروپ براون شوگر",
		nameEn: "Brown sugar syrup",
		unit: "ml",
		onHand: 70,
		par: 300,
		cost: 420
	},
	{
		sku: "blue",
		nameFa: "سیروپ بلو",
		nameEn: "Blue syrup",
		unit: "ml",
		onHand: 30,
		par: 250,
		cost: 520
	},
	{
		sku: "condensed",
		nameFa: "شیر عسلی",
		nameEn: "Condensed milk",
		unit: "ml",
		onHand: 700,
		par: 300,
		cost: 480
	},
	{
		sku: "cream",
		nameFa: "خامه",
		nameEn: "Cream",
		unit: "ml",
		onHand: 800,
		par: 300,
		cost: 180
	},
	{
		sku: "choc",
		nameFa: "شکلات",
		nameEn: "Chocolate",
		unit: "g",
		onHand: 900,
		par: 400,
		cost: 650
	},
	{
		sku: "cocoa",
		nameFa: "کاکائو",
		nameEn: "Cocoa",
		unit: "g",
		onHand: 700,
		par: 250,
		cost: 500
	},
	{
		sku: "apple",
		nameFa: "پوره سیب",
		nameEn: "Apple puree",
		unit: "ml",
		onHand: 500,
		par: 200,
		cost: 320
	},
	{
		sku: "hazelnut",
		nameFa: "فندق",
		nameEn: "Hazelnut",
		unit: "ml",
		onHand: 350,
		par: 200,
		cost: 540
	},
	{
		sku: "cb",
		nameFa: "کنسانتره کلدبرو",
		nameEn: "Cold brew concentrate",
		unit: "ml",
		onHand: 3200,
		par: 1500,
		cost: 700
	},
	{
		sku: "rasp",
		nameFa: "رزبری",
		nameEn: "Raspberry",
		unit: "ml",
		onHand: 600,
		par: 250,
		cost: 450
	},
	{
		sku: "soda",
		nameFa: "سودا",
		nameEn: "Soda",
		unit: "ml",
		onHand: 4e3,
		par: 1500,
		cost: 70
	},
	{
		sku: "lemon",
		nameFa: "لیمو",
		nameEn: "Lemon",
		unit: "ml",
		onHand: 900,
		par: 400,
		cost: 180
	},
	{
		sku: "lime",
		nameFa: "لایم",
		nameEn: "Lime",
		unit: "ml",
		onHand: 500,
		par: 200,
		cost: 220
	},
	{
		sku: "agave",
		nameFa: "آگاوه",
		nameEn: "Agave",
		unit: "ml",
		onHand: 400,
		par: 150,
		cost: 620
	},
	{
		sku: "coconut",
		nameFa: "نارگیل",
		nameEn: "Coconut",
		unit: "ml",
		onHand: 700,
		par: 200,
		cost: 380
	},
	{
		sku: "berry",
		nameFa: "توت",
		nameEn: "Berry",
		unit: "ml",
		onHand: 450,
		par: 200,
		cost: 400
	},
	{
		sku: "orange",
		nameFa: "پرتقال",
		nameEn: "Orange",
		unit: "ml",
		onHand: 600,
		par: 200,
		cost: 250
	},
	{
		sku: "sugar",
		nameFa: "شکر",
		nameEn: "Sugar",
		unit: "g",
		onHand: 2e3,
		par: 500,
		cost: 30
	},
	{
		sku: "salt",
		nameFa: "نمک",
		nameEn: "Salt",
		unit: "g",
		onHand: 400,
		par: 50,
		cost: 15
	},
	{
		sku: "spice",
		nameFa: "ادویه کرک و ماسالا",
		nameEn: "Karak spice",
		unit: "g",
		onHand: 180,
		par: 60,
		cost: 1800
	},
	{
		sku: "tea",
		nameFa: "چای کیسه‌ای",
		nameEn: "Tea bag",
		unit: "pcs",
		onHand: 80,
		par: 40,
		cost: 9e3
	},
	{
		sku: "ice",
		nameFa: "یخ",
		nameEn: "Ice",
		unit: "g",
		onHand: 15e3,
		par: 5e3,
		cost: 8
	},
	{
		sku: "cup-h",
		nameFa: "لیوان گرم",
		nameEn: "Hot cup",
		unit: "pcs",
		onHand: 180,
		par: 80,
		cost: 7e3
	},
	{
		sku: "cup-c",
		nameFa: "لیوان سرد",
		nameEn: "Cold cup",
		unit: "pcs",
		onHand: 36,
		par: 80,
		cost: 8500
	},
	{
		sku: "lid",
		nameFa: "درب",
		nameEn: "Lid",
		unit: "pcs",
		onHand: 220,
		par: 100,
		cost: 2e3
	},
	{
		sku: "f-v60",
		nameFa: "فیلتر وی۶۰",
		nameEn: "V60 filter",
		unit: "pcs",
		onHand: 14,
		par: 30,
		cost: 3500
	},
	{
		sku: "f-chem",
		nameFa: "فیلتر کمکس",
		nameEn: "Chemex filter",
		unit: "pcs",
		onHand: 18,
		par: 12,
		cost: 7e3
	},
	{
		sku: "napkin",
		nameFa: "دستمال",
		nameEn: "Napkin",
		unit: "pcs",
		onHand: 300,
		par: 100,
		cost: 400
	}
];
var MODS = [
	{
		id: "shot",
		nameFa: "شات اضافه",
		nameEn: "Extra shot",
		price: 40 * K,
		recipe: [{
			sku: "beans",
			qty: 9
		}]
	},
	{
		id: "syrup",
		nameFa: "سیروپ",
		nameEn: "Syrup",
		price: 25 * K,
		recipe: [{
			sku: "syrup",
			qty: 15
		}]
	},
	{
		id: "oat",
		nameFa: "شیر جو",
		nameEn: "Oat milk",
		price: 30 * K,
		recipe: [{
			sku: "oat",
			qty: 160
		}]
	}
];
function recipeCost(recipe, costOf) {
	let total = 0;
	for (const use of recipe) total += costOf(use.sku) * use.qty;
	return Math.round(total);
}
function tierOf(spent) {
	if (spent >= 2e7) return "inner";
	if (spent >= 8e6) return "como";
	if (spent >= 2e6) return "regular";
	return "guest";
}
function tierRate(tier) {
	if (tier === "inner") return .12;
	if (tier === "como") return .08;
	if (tier === "regular") return .05;
	return 0;
}
function tierName(tier, lang) {
	const map = {
		guest: ["مهمان", "Guest"],
		regular: ["آشنا", "Regular"],
		como: ["کومو", "Como"],
		inner: ["حلقه درونی", "Inner circle"]
	};
	return tx(lang, map[tier][0], map[tier][1]);
}
function daysUntilBirthday(iso, now = /* @__PURE__ */ new Date()) {
	if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
	const month = Number(iso.slice(5, 7));
	const day = Number(iso.slice(8, 10));
	if (month < 1 || month > 12 || day < 1 || day > 31) return null;
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	let next = new Date(now.getFullYear(), month - 1, day);
	if (next < today) next = new Date(now.getFullYear() + 1, month - 1, day);
	return Math.round((next.getTime() - today.getTime()) / 864e5);
}
function birthdaySoon(iso, within = 7) {
	const days = daysUntilBirthday(iso);
	return days !== null && days <= within;
}
function quietDays(lastVisit, now = Date.now()) {
	if (!lastVisit) return 999;
	return Math.floor((now - lastVisit) / 864e5);
}
function inSlowHour(ts, start, end) {
	const hour = new Date(ts).getHours();
	if (start === end) return false;
	if (start < end) return hour >= start && hour < end;
	return hour >= start || hour < end;
}
function earnedPoints(total, per, slow) {
	if (per <= 0 || total <= 0) return 0;
	const base = Math.floor(total / per);
	return slow ? base * 2 : base;
}
function applyCheckout(data, input) {
	const linesIn = input.lines.filter((line) => line.qty > 0);
	if (linesIn.length === 0) return {
		ok: false,
		error: "empty"
	};
	const costOf = (sku) => data.stock.find((item) => item.sku === sku)?.cost ?? 0;
	const orderLines = [];
	for (const line of linesIn) {
		const item = data.menu.find((entry) => entry.id === line.itemId && entry.active);
		if (!item) return {
			ok: false,
			error: "missing"
		};
		const mods = line.mods.map((id) => MODS.find((mod) => mod.id === id)).filter((mod) => Boolean(mod));
		orderLines.push({
			itemId: item.id,
			nameFa: item.nameFa,
			nameEn: item.nameEn,
			qty: Math.min(99, line.qty),
			unitPrice: item.price + mods.reduce((sum, mod) => sum + mod.price, 0),
			unitCogs: recipeCost(item.recipe, costOf) + mods.reduce((sum, mod) => sum + recipeCost(mod.recipe, costOf), 0),
			mods: mods.map((mod) => ({
				id: mod.id,
				nameFa: mod.nameFa,
				nameEn: mod.nameEn,
				price: mod.price
			}))
		});
	}
	const subtotal = orderLines.reduce((sum, line) => sum + line.unitPrice * line.qty, 0);
	const pct = Math.min(100, Math.max(0, input.discountPct || 0));
	const manualOff = Math.round(subtotal * pct / 100);
	const cheapest = orderLines.reduce((min, line) => Math.min(min, line.unitPrice), subtotal);
	let customer = input.customerId ? data.customers.find((entry) => entry.id === input.customerId) ?? null : null;
	let creating = false;
	let phone = "";
	if (!customer && input.newPhone?.trim()) {
		phone = normPhone(input.newPhone);
		if (!validPhone(phone)) return {
			ok: false,
			error: "phone"
		};
		const existing = data.customers.find((entry) => entry.phone === phone);
		if (existing) customer = existing;
		else creating = true;
	}
	const now = Date.now();
	const year = new Date(now).getFullYear();
	const goal = Math.max(1, data.settings.stampGoal);
	const cap = data.settings.compCap;
	const limited = (price) => cap > 0 ? Math.min(price, cap) : price;
	let remain = Math.max(0, subtotal - manualOff);
	let stampOff = 0;
	let stampRedeemed = false;
	if (input.useStamp && customer && customer.stamps >= goal && remain > 0) {
		stampOff = Math.min(limited(cheapest), remain);
		stampRedeemed = stampOff > 0;
		remain -= stampOff;
	}
	let giftOff = 0;
	let giftUsed = false;
	if (input.useGift && customer && birthdaySoon(customer.birthday) && customer.giftYear !== year && remain > 0) {
		giftOff = Math.min(limited(cheapest), remain);
		giftUsed = giftOff > 0;
		remain -= giftOff;
	}
	const rate = customer ? tierRate(tierOf(customer.spent)) : 0;
	const tierOff = Math.round(remain * rate);
	const afterTier = Math.max(0, remain - tierOff);
	let pointsRedeemed = 0;
	let pointsOff = 0;
	if (customer && input.redeemPoints > 0 && data.settings.pointValue > 0) {
		const affordable = Math.floor(afterTier / data.settings.pointValue);
		pointsRedeemed = Math.min(Math.floor(input.redeemPoints), customer.points, affordable);
		pointsOff = pointsRedeemed * data.settings.pointValue;
	}
	const total = Math.max(0, afterTier - pointsOff);
	const cogs = orderLines.reduce((sum, line) => sum + line.unitCogs * line.qty, 0);
	const slow = inSlowHour(now, data.settings.slowStart, data.settings.slowEnd);
	const attached = Boolean(customer) || creating;
	const pointsEarned = attached ? earnedPoints(total, data.settings.pointsPer, slow) : 0;
	const qty = orderLines.reduce((sum, line) => sum + line.qty, 0);
	let bonusPoints = 0;
	let referrerId;
	if (creating && input.referralCode?.trim()) {
		const code = input.referralCode.trim().toUpperCase();
		const referrer = data.customers.find((entry) => entry.referral.toUpperCase() === code);
		if (referrer && referrer.phone !== phone) {
			referrerId = referrer.id;
			bonusPoints = Math.max(0, data.settings.referralBonus);
		}
	}
	const guestName = customer ? customer.name : creating ? input.newName?.trim() || (data.settings.lang === "fa" ? "مهمان" : "Guest") : "";
	let stampsAfter = customer?.stamps ?? 0;
	if (attached) {
		if (stampRedeemed) stampsAfter = Math.max(0, stampsAfter - goal);
		stampsAfter += qty;
	}
	const pointsAfter = (customer?.points ?? 0) - pointsRedeemed + pointsEarned + bonusPoints;
	const newId = creating ? uid("c") : void 0;
	const number = data.orders.reduce((max, order) => Math.max(max, order.number), 0) + 1;
	const order = {
		id: uid("ord"),
		number,
		at: now,
		lines: orderLines,
		subtotal,
		manualOff,
		stampOff,
		giftOff,
		tierOff,
		pointsOff,
		pointsRedeemed,
		pointsEarned,
		bonusPoints,
		total,
		cogs,
		pay: input.pay,
		customerId: customer?.id ?? newId,
		guestName: guestName || void 0,
		stampsAfter: attached ? stampsAfter : void 0,
		pointsAfter: attached ? pointsAfter : void 0,
		stampRedeemed,
		giftUsed,
		note: input.note.trim().slice(0, 140)
	};
	const usage = /* @__PURE__ */ new Map();
	const addUse = (recipe, times) => {
		for (const use of recipe) usage.set(use.sku, (usage.get(use.sku) ?? 0) + use.qty * times);
	};
	for (const line of linesIn) {
		const item = data.menu.find((entry) => entry.id === line.itemId);
		if (!item) continue;
		addUse(item.recipe, line.qty);
		for (const modId of line.mods) {
			const mod = MODS.find((entry) => entry.id === modId);
			if (mod) addUse(mod.recipe, line.qty);
		}
	}
	const warnings = [];
	const stock = data.stock.map((item) => {
		const used = usage.get(item.sku) ?? 0;
		if (!used) return item;
		const onHand = Math.round((item.onHand - used) * 1e3) / 1e3;
		if (onHand < 0) warnings.push(item.sku);
		return {
			...item,
			onHand
		};
	});
	const moves = [...[...usage.entries()].map(([sku, amount]) => ({
		id: uid("mv"),
		at: now,
		sku,
		qty: -amount,
		reason: "sale",
		note: `#${number}`
	})), ...data.moves].slice(0, 300);
	let customers = data.customers.map((entry) => ({ ...entry }));
	if (referrerId) customers = customers.map((entry) => entry.id === referrerId ? {
		...entry,
		points: entry.points + bonusPoints
	} : entry);
	const top = [...orderLines].sort((a, b) => b.qty * b.unitPrice - a.qty * a.unitPrice)[0];
	if (customer) customers = customers.map((entry) => entry.id === customer.id ? {
		...entry,
		stamps: stampsAfter,
		points: pointsAfter,
		visits: entry.visits + 1,
		spent: entry.spent + total,
		lastVisit: now,
		favoriteId: entry.favoriteId || top?.itemId,
		giftYear: giftUsed ? year : entry.giftYear
	} : entry);
	else if (creating && newId) {
		let referral = `C${phone.slice(-4)}`;
		if (customers.some((entry) => entry.referral === referral)) referral = `C${phone.slice(-6)}`;
		customers = [{
			id: newId,
			name: guestName,
			phone,
			birthday: "",
			notes: "",
			points: pointsAfter,
			stamps: stampsAfter,
			visits: 1,
			spent: total,
			createdAt: now,
			lastVisit: now,
			smsOptIn: true,
			referral,
			referredBy: referrerId,
			favoriteId: top?.itemId,
			giftYear: 0
		}, ...customers];
	}
	return {
		ok: true,
		order,
		warnings,
		data: {
			...data,
			stock,
			moves,
			customers,
			orders: [order, ...data.orders].slice(0, 500)
		}
	};
}
function defaultSettings() {
	return {
		lang: "fa",
		addressFa: "کوچه هفتم، خیابان طلوع، بندرعباس",
		addressEn: "7th Alley of Tolou St., Bandar Abbas",
		phone: "",
		instagram: "@como.coffee",
		pointsPer: 1e4,
		pointValue: 500,
		stampGoal: 8,
		compCap: 31e4,
		slowStart: 14,
		slowEnd: 16,
		referralBonus: 50,
		float: 5e6,
		smsApiKey: "",
		smsLine: "",
		paper: 80,
		baud: 9600,
		autoPrint: false,
		autoSms: false
	};
}
function atDays(daysAgo, hour, minute) {
	const date = /* @__PURE__ */ new Date();
	date.setDate(date.getDate() - daysAgo);
	date.setHours(hour, minute, 0, 0);
	return date.getTime();
}
function isoShift(days) {
	const date = /* @__PURE__ */ new Date();
	date.setDate(date.getDate() + days);
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${date.getFullYear()}-${month}-${day}`;
}
var ROTATION = [
	["latte", "espresso"],
	["spanish-latte"],
	["cappuccino", "tea"],
	["cold-brew", "karak"],
	["v60"],
	["iced-latte", "lemonade"],
	["mont-blanc"],
	["chemex", "masala"],
	["nut-queen"],
	["como-salty", "americano"]
];
var PAYS = [
	"card",
	"cash",
	"card",
	"online",
	"cash",
	"card"
];
function buildOrders(settings) {
	const costOf = (sku) => INGREDIENTS.find((item) => item.sku === sku)?.cost ?? 0;
	const drafts = [];
	let nazaninUsed = false;
	const who = [
		void 0,
		"c-sara",
		"c-ali",
		void 0,
		"c-reza",
		"c-nazanin",
		"c-kamran",
		"c-sara",
		void 0,
		"c-ali"
	];
	for (let day = 13; day >= 0; day -= 1) for (let slot = 0; slot < 6; slot += 1) {
		const hour = 9 + slot * 2 % 11;
		const at = atDays(day, hour, (day * 5 + slot * 7) % 60);
		if (at > Date.now() - 6e4) continue;
		const ids = ROTATION[(day + slot) % ROTATION.length] ?? ["latte"];
		let customerId = who[(day * 3 + slot) % who.length];
		if (customerId === "c-nazanin") {
			if (nazaninUsed || day > 1) customerId = void 0;
			else nazaninUsed = true;
		}
		const lines = ids.map((id) => {
			const item = MENU.find((entry) => entry.id === id) ?? MENU[0];
			return {
				itemId: item.id,
				nameFa: item.nameFa,
				nameEn: item.nameEn,
				qty: slot % 5 === 0 ? 2 : 1,
				unitPrice: item.price,
				unitCogs: recipeCost(item.recipe, costOf),
				mods: []
			};
		});
		const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.qty, 0);
		const cogs = lines.reduce((sum, line) => sum + line.unitCogs * line.qty, 0);
		const slow = hour >= settings.slowStart && hour < settings.slowEnd;
		drafts.push({
			id: `seed-${day}-${slot}`,
			number: 0,
			at,
			lines,
			subtotal,
			manualOff: 0,
			stampOff: 0,
			giftOff: 0,
			tierOff: 0,
			pointsOff: 0,
			pointsRedeemed: 0,
			pointsEarned: customerId ? earnedPoints(subtotal, settings.pointsPer, slow) : 0,
			bonusPoints: 0,
			total: subtotal,
			cogs,
			pay: PAYS[(day + slot) % PAYS.length] ?? "card",
			customerId,
			stampRedeemed: false,
			giftUsed: false,
			note: ""
		});
	}
	if (!drafts.some((order) => order.at > Date.now() - 108e5)) {
		const item = MENU.find((entry) => entry.id === "latte") ?? MENU[0];
		const costOf = (sku) => INGREDIENTS.find((entry) => entry.sku === sku)?.cost ?? 0;
		drafts.push({
			id: "seed-live",
			number: 0,
			at: Date.now() - 12e5,
			lines: [{
				itemId: item.id,
				nameFa: item.nameFa,
				nameEn: item.nameEn,
				qty: 1,
				unitPrice: item.price,
				unitCogs: recipeCost(item.recipe, costOf),
				mods: []
			}],
			subtotal: item.price,
			manualOff: 0,
			stampOff: 0,
			giftOff: 0,
			tierOff: 0,
			pointsOff: 0,
			pointsRedeemed: 0,
			pointsEarned: 0,
			bonusPoints: 0,
			total: item.price,
			cogs: recipeCost(item.recipe, costOf),
			pay: "card",
			stampRedeemed: false,
			giftUsed: false,
			note: ""
		});
	}
	drafts.sort((a, b) => a.at - b.at);
	drafts.forEach((order, index) => {
		order.number = 1701 + index;
	});
	return drafts.sort((a, b) => b.at - a.at);
}
function buildCustomers(orders) {
	return [
		{
			id: "c-sara",
			name: "سارا محمدی",
			phone: "09120000001",
			birthday: isoShift(3),
			notes: "شیر جو. اسپرسو را کوتاه می‌خواهد.",
			stamps: 5,
			createdAt: atDays(200, 11, 0),
			smsOptIn: true,
			referral: "C0001",
			favoriteId: "spanish-latte",
			giftYear: 0,
			priorVisits: 40,
			priorSpent: 22e6,
			priorPoints: 640
		},
		{
			id: "c-ali",
			name: "علی رضایی",
			phone: "09120000002",
			birthday: "",
			notes: "بدون شکر.",
			stamps: 8,
			createdAt: atDays(120, 10, 0),
			smsOptIn: true,
			referral: "C0002",
			referredBy: "c-sara",
			favoriteId: "latte",
			giftYear: 0,
			priorVisits: 9,
			priorSpent: 26e5,
			priorPoints: 180
		},
		{
			id: "c-nazanin",
			name: "نازنین کرمی",
			phone: "09120000003",
			birthday: isoShift(0),
			notes: "اولین بار دیروز. تولدش امروز است.",
			stamps: 1,
			createdAt: atDays(1, 17, 0),
			smsOptIn: true,
			referral: "C0003",
			favoriteId: "blue-espresso",
			giftYear: 0,
			priorVisits: 0,
			priorSpent: 0,
			priorPoints: 0
		},
		{
			id: "c-reza",
			name: "رضا حسینی",
			phone: "09120000004",
			birthday: "",
			notes: "کرک را کم‌ادویه.",
			stamps: 3,
			createdAt: atDays(80, 9, 0),
			smsOptIn: true,
			referral: "C0004",
			favoriteId: "karak",
			giftYear: 0,
			priorVisits: 18,
			priorSpent: 84e5,
			priorPoints: 220
		},
		{
			id: "c-maryam",
			name: "مریم قاسمی",
			phone: "09120000005",
			birthday: "",
			notes: "کنار پنجره می‌نشیند. بیست‌وشش روز است نیامده.",
			stamps: 2,
			createdAt: atDays(160, 12, 0),
			smsOptIn: true,
			referral: "C0005",
			favoriteId: "cold-brew",
			giftYear: 0,
			priorVisits: 14,
			priorSpent: 46e5,
			priorPoints: 90,
			quiet: 26
		},
		{
			id: "c-kamran",
			name: "کامران نعمتی",
			phone: "09120000006",
			birthday: "",
			notes: "پیامک نمی‌خواهد.",
			stamps: 3,
			createdAt: atDays(90, 8, 30),
			smsOptIn: false,
			referral: "C0006",
			favoriteId: "v60",
			giftYear: 0,
			priorVisits: 8,
			priorSpent: 22e5,
			priorPoints: 40
		}
	].map((prior) => {
		const mine = orders.filter((order) => order.customerId === prior.id);
		const lastFromOrders = mine.reduce((max, order) => Math.max(max, order.at), 0);
		return {
			id: prior.id,
			name: prior.name,
			phone: prior.phone,
			birthday: prior.birthday,
			notes: prior.notes,
			stamps: prior.stamps,
			createdAt: prior.createdAt,
			smsOptIn: prior.smsOptIn,
			referral: prior.referral,
			referredBy: prior.referredBy,
			favoriteId: prior.favoriteId,
			giftYear: prior.giftYear,
			visits: prior.priorVisits + mine.length,
			spent: prior.priorSpent + mine.reduce((sum, order) => sum + order.total, 0),
			points: prior.priorPoints + mine.reduce((sum, order) => sum + order.pointsEarned, 0),
			lastVisit: prior.quiet ? atDays(prior.quiet, 16, 10) : lastFromOrders || prior.createdAt
		};
	});
}
function initialData() {
	const settings = defaultSettings();
	const orders = buildOrders(settings);
	const day = 864e5;
	return {
		menu: MENU.map((item) => ({
			...item,
			recipe: item.recipe.map((use) => ({ ...use }))
		})),
		stock: INGREDIENTS.map((item) => ({ ...item })),
		customers: buildCustomers(orders),
		orders,
		expenses: [
			{
				id: "ex-rent",
				at: Date.now() - 4 * day,
				category: "rent",
				amount: 48e6,
				note: "اجاره فضا",
				method: "transfer"
			},
			{
				id: "ex-power",
				at: Date.now() - 2 * day,
				category: "utilities",
				amount: 18e5,
				note: "برق و آب",
				method: "card"
			},
			{
				id: "ex-clean",
				at: Date.now() - day,
				category: "supplies",
				amount: 65e4,
				note: "شوینده",
				method: "cash"
			}
		],
		moves: [{
			id: "mv-milk",
			at: Date.now() - day,
			sku: "milk",
			qty: 12e3,
			reason: "purchase",
			note: "خرید شیر"
		}, {
			id: "mv-blue",
			at: Date.now() - 2 * day,
			sku: "blue",
			qty: -20,
			reason: "waste",
			note: "دورریز سیروپ"
		}],
		cashMoves: [{
			id: "cash-milk",
			at: Date.now() - day,
			amount: -14e5,
			note: "خرید شیر"
		}],
		smsLogs: [],
		closes: [],
		settings,
		credit: null
	};
}
function snapshotOf(data) {
	return {
		menu: data.menu,
		stock: data.stock,
		customers: data.customers,
		orders: data.orders,
		expenses: data.expenses,
		moves: data.moves,
		cashMoves: data.cashMoves,
		smsLogs: data.smsLogs,
		closes: data.closes,
		settings: data.settings,
		credit: data.credit
	};
}
function move(sku, qty, reason, note) {
	return {
		id: uid("mv"),
		at: Date.now(),
		sku,
		qty,
		reason,
		note
	};
}
var useCafe = create()(persist((set, get) => ({
	...initialData(),
	receiptId: null,
	openReceipt: (id) => set({ receiptId: id }),
	checkout: (input) => {
		const applied = applyCheckout(snapshotOf(get()), input);
		if (!applied.ok) return applied;
		set(applied.data);
		return {
			ok: true,
			order: applied.order,
			warnings: applied.warnings
		};
	},
	patchSettings: (patch) => set((state) => ({ settings: {
		...state.settings,
		...patch
	} })),
	setPrice: (id, price) => set((state) => ({ menu: state.menu.map((item) => item.id === id ? {
		...item,
		price: Math.max(0, Math.round(price))
	} : item) })),
	toggleItem: (id) => set((state) => ({ menu: state.menu.map((item) => item.id === id ? {
		...item,
		active: !item.active
	} : item) })),
	addMenuItem: (item) => set((state) => ({ menu: [...state.menu, {
		id: uid("item"),
		category: item.category,
		nameFa: item.nameFa.trim() || "بدون نام",
		nameEn: item.nameEn.trim() || "Untitled",
		price: Math.max(0, Math.round(item.price)),
		recipe: [],
		active: true
	}] })),
	receive: (sku, qty, cost, payCash) => {
		if (qty <= 0) return;
		set((state) => {
			const item = state.stock.find((entry) => entry.sku === sku);
			if (!item) return state;
			const base = Math.max(0, item.onHand);
			const nextCost = cost > 0 ? Math.round((base * item.cost + qty * cost) / (base + qty)) : item.cost;
			const paid = cost > 0 ? cost : item.cost;
			const cash = payCash ? [{
				id: uid("cash"),
				at: Date.now(),
				amount: -Math.round(qty * paid),
				note: item.nameFa
			}, ...state.cashMoves] : state.cashMoves;
			return {
				stock: state.stock.map((entry) => entry.sku === sku ? {
					...entry,
					onHand: entry.onHand + qty,
					cost: nextCost
				} : entry),
				moves: [move(sku, qty, "purchase", item.nameFa), ...state.moves].slice(0, 300),
				cashMoves: cash.slice(0, 300)
			};
		});
	},
	waste: (sku, qty, note) => {
		if (qty <= 0) return;
		set((state) => ({
			stock: state.stock.map((entry) => entry.sku === sku ? {
				...entry,
				onHand: entry.onHand - qty
			} : entry),
			moves: [move(sku, -qty, "waste", note), ...state.moves].slice(0, 300)
		}));
	},
	setCount: (sku, next) => set((state) => {
		const item = state.stock.find((entry) => entry.sku === sku);
		if (!item) return state;
		const delta = next - item.onHand;
		return {
			stock: state.stock.map((entry) => entry.sku === sku ? {
				...entry,
				onHand: next
			} : entry),
			moves: [move(sku, delta, "adjust", "شمارش"), ...state.moves].slice(0, 300)
		};
	}),
	addExpense: (expense) => set((state) => ({ expenses: [{
		...expense,
		id: uid("ex"),
		at: Date.now(),
		amount: Math.max(0, expense.amount)
	}, ...state.expenses].slice(0, 400) })),
	patchCustomer: (id, patch) => set((state) => ({ customers: state.customers.map((entry) => {
		if (entry.id !== id) return entry;
		const phone = patch.phone ? normPhone(patch.phone) : entry.phone;
		if (state.customers.some((other) => other.id !== id && other.phone === phone)) return entry;
		return {
			...entry,
			...patch,
			phone
		};
	}) })),
	addCustomer: (input) => {
		const phone = normPhone(input.phone);
		if (!/^09\d{9}$/.test(phone)) return "bad";
		if (get().customers.some((entry) => entry.phone === phone)) return "phone";
		const id = uid("c");
		const now = Date.now();
		set((state) => ({ customers: [{
			id,
			name: input.name.trim() || (state.settings.lang === "fa" ? "مهمان" : "Guest"),
			phone,
			birthday: input.birthday,
			notes: input.notes.trim(),
			points: 0,
			stamps: 0,
			visits: 0,
			spent: 0,
			createdAt: now,
			lastVisit: 0,
			smsOptIn: true,
			referral: `C${phone.slice(-4)}`,
			giftYear: 0
		}, ...state.customers] }));
		return id;
	},
	removeCustomer: (id) => set((state) => ({ customers: state.customers.filter((entry) => entry.id !== id) })),
	logSms: (entry) => set((state) => ({ smsLogs: [{
		...entry,
		id: uid("sms"),
		at: Date.now()
	}, ...state.smsLogs].slice(0, 80) })),
	setCredit: (value) => set({ credit: {
		value,
		at: Date.now()
	} }),
	closeDay: (note) => set((state) => {
		const today = state.orders.filter((order) => order.at >= startOfDay());
		const expenses = state.expenses.filter((expense) => expense.at >= startOfDay()).reduce((sum, expense) => sum + expense.amount, 0);
		return { closes: [{
			id: uid("close"),
			at: Date.now(),
			sales: today.reduce((sum, order) => sum + order.total, 0),
			cash: today.filter((order) => order.pay === "cash").reduce((sum, order) => sum + order.total, 0),
			card: today.filter((order) => order.pay === "card").reduce((sum, order) => sum + order.total, 0),
			online: today.filter((order) => order.pay === "online").reduce((sum, order) => sum + order.total, 0),
			expenses,
			drawer: expectedDrawer(snapshotOf(state)),
			note: note.trim()
		}, ...state.closes].slice(0, 60) };
	}),
	importBackup: (raw) => {
		if (!raw || typeof raw !== "object") return false;
		const data = raw;
		if (!Array.isArray(data.menu) || !Array.isArray(data.orders) || !Array.isArray(data.stock)) return false;
		const fresh = initialData();
		set({
			...fresh,
			...data,
			settings: {
				...fresh.settings,
				...data.settings ?? {}
			},
			receiptId: null
		});
		return true;
	},
	reset: () => set({
		...initialData(),
		receiptId: null
	})
}), {
	name: "como-desk-v1",
	partialize: (state) => ({
		menu: state.menu,
		stock: state.stock,
		customers: state.customers,
		orders: state.orders,
		expenses: state.expenses,
		moves: state.moves,
		cashMoves: state.cashMoves,
		smsLogs: state.smsLogs,
		closes: state.closes,
		settings: state.settings,
		credit: state.credit
	})
}));
var ranges = [
	{
		id: "today",
		fa: "امروز",
		en: "Today"
	},
	{
		id: "d7",
		fa: "۷ روز",
		en: "7 days"
	},
	{
		id: "d30",
		fa: "۳۰ روز",
		en: "30 days"
	}
];
var categories = [
	{
		id: "rent",
		fa: "اجاره",
		en: "Rent"
	},
	{
		id: "payroll",
		fa: "حقوق",
		en: "Payroll"
	},
	{
		id: "utilities",
		fa: "آب و برق",
		en: "Utilities"
	},
	{
		id: "supplies",
		fa: "مصرفی",
		en: "Supplies"
	},
	{
		id: "other",
		fa: "سایر",
		en: "Other"
	}
];
function Books() {
	const data = useCafe();
	const lang = data.settings.lang;
	const [range, setRange] = (0, import_react.useState)("d7");
	const [category, setCategory] = (0, import_react.useState)("supplies");
	const [amount, setAmount] = (0, import_react.useState)(0);
	const [note, setNote] = (0, import_react.useState)("");
	const [method, setMethod] = (0, import_react.useState)("cash");
	const [closeNote, setCloseNote] = (0, import_react.useState)("");
	const orders = data.orders.filter((order) => inRange(order.at, range));
	const expenses = data.expenses.filter((expense) => inRange(expense.at, range));
	const sales = orders.reduce((sum, order) => sum + order.total, 0);
	const cogs = orders.reduce((sum, order) => sum + order.cogs, 0);
	const expenseTotal = expenses.reduce((sum, expense) => sum + expense.amount, 0);
	const gross = sales - cogs;
	const net = gross - expenseTotal;
	const tickets = orders.length;
	const avg = tickets ? sales / tickets : 0;
	const days = range === "today" ? 1 : range === "d7" ? 7 : 30;
	const series = Array.from({ length: days }, (_, index) => {
		const start = startOfDay(Date.now() - (days - 1 - index) * 864e5);
		const total = data.orders.filter((order) => order.at >= start && order.at < start + 864e5).reduce((sum, order) => sum + order.total, 0);
		return {
			label: formatDay(start, lang),
			total
		};
	});
	const drawer = expectedDrawer(data);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap items-end justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-medium",
				children: tx(lang, "دفتر", "Books")
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex border border-line",
				children: ranges.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setRange(item.id),
					className: `h-11 px-3 text-sm ${range === item.id ? "bg-ink text-paper" : "bg-sheet"}`,
					children: tx(lang, item.fa, item.en)
				}, item.id))
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
					label: tx(lang, "فروش", "Sales"),
					value: formatCompact(sales, lang),
					hint: `${tickets} · ${formatCompact(avg, lang)}`
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
					label: tx(lang, "سود ناخالص", "Gross"),
					value: formatCompact(gross, lang),
					hint: tx(lang, "فروش منهای بهای دستور", "Sales minus recipe cost")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
					label: tx(lang, "هزینه", "Expenses"),
					value: formatCompact(expenseTotal, lang)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Kpi, {
					label: tx(lang, "سود خالص", "Net"),
					value: formatCompact(net, lang)
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			dir: "ltr",
			className: "mt-4 h-52 border border-line bg-sheet p-2",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
				width: "100%",
				height: "100%",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(BarChart, {
					data: series,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
							dataKey: "label",
							interval: days > 14 ? 4 : 0,
							tick: {
								fill: "var(--color-mute)",
								fontSize: 12
							}
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, { hide: true }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
							formatter: (value) => formatToman(Number(value ?? 0), lang),
							cursor: { fill: "var(--color-paper-2)" },
							contentStyle: {
								background: "var(--color-ink)",
								border: "none",
								color: "var(--color-paper)"
							}
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
							dataKey: "total",
							fill: "var(--color-ink)",
							maxBarSize: 28
						})
					]
				})
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-3 text-sm",
			children: [
				tx(lang, "صندوق مورد انتظار", "Expected drawer"),
				": ",
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-medium",
					children: formatToman(drawer, lang)
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 max-w-xl text-xs text-mute",
			children: tx(lang, "تنخواه به‌علاوه فروش نقد، منهای هزینه نقد و خرید نقدی انبار. سود، خرید انبار را هزینه حساب نمی‌کند.", "Float plus cash sales, minus cash expenses and cash stock buys. Profit does not treat stock purchases as expenses.")
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-8 grid gap-6 lg:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "grid gap-3 border border-line bg-sheet p-4",
				onSubmit: (event) => {
					event.preventDefault();
					if (amount <= 0) return;
					data.addExpense({
						category,
						amount,
						note,
						method
					});
					setAmount(0);
					setNote("");
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-lg font-medium",
						children: tx(lang, "هزینه", "Expense")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: tx(lang, "دسته", "Category"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
							className: fieldClass,
							value: category,
							onChange: (event) => setCategory(event.target.value),
							children: categories.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: item.id,
								children: tx(lang, item.fa, item.en)
							}, item.id))
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: tx(lang, "مبلغ تومان", "Amount, toman"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							dir: "ltr",
							type: "number",
							className: fieldClass,
							value: amount || "",
							onChange: (event) => setAmount(Number(event.target.value))
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: tx(lang, "شرح", "Note"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: fieldClass,
							value: note,
							onChange: (event) => setNote(event.target.value)
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex gap-1",
						children: [
							"cash",
							"card",
							"transfer"
						].map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setMethod(item),
							className: `h-11 flex-1 text-sm ${method === item ? "bg-ink text-paper" : "border border-line"}`,
							children: item === "cash" ? tx(lang, "نقد", "Cash") : item === "card" ? tx(lang, "کارت", "Card") : tx(lang, "انتقال", "Transfer")
						}, item))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
						type: "submit",
						children: tx(lang, "ثبت هزینه", "Add expense")
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "border border-line p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-lg font-medium",
						children: tx(lang, "بستن امروز", "Close today")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: `${fieldClass} mt-3`,
						placeholder: tx(lang, "یادداشت صندوق", "Drawer note"),
						value: closeNote,
						onChange: (event) => setCloseNote(event.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
						className: "mt-3",
						tone: "line",
						onClick: () => data.closeDay(closeNote),
						children: tx(lang, "ثبت بستن", "Record close")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
						className: "mt-4 space-y-2 text-sm",
						children: [data.closes.slice(0, 4).map((close) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "border-t border-line pt-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-mute",
									children: formatWhen(close.at, lang)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "ms-2",
									children: formatCompact(close.sales, lang)
								}),
								close.note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mt-1 block text-xs",
									children: close.note
								}) : null
							]
						}, close.id)), data.closes.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
							className: "text-mute",
							children: tx(lang, "هنوز بستی نیست.", "No close yet.")
						}) : null]
					})
				]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mt-8 text-lg font-medium",
			children: tx(lang, "آخرین هزینه‌ها", "Recent expenses")
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-2 divide-y divide-line border-y border-line text-sm",
			children: data.expenses.slice(0, 8).map((expense) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "flex items-center justify-between gap-3 py-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [tx(lang, categories.find((item) => item.id === expense.category)?.fa ?? "", categories.find((item) => item.id === expense.category)?.en ?? ""), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "ms-2 text-xs text-mute",
					children: expense.note
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatCompact(expense.amount, lang) })]
			}, expense.id))
		})
	] });
}
function Cellar() {
	const lang = useCafe((state) => state.settings.lang);
	const stock = useCafe((state) => state.stock);
	const moves = useCafe((state) => state.moves);
	const menu = useCafe((state) => state.menu);
	const receive = useCafe((state) => state.receive);
	const waste = useCafe((state) => state.waste);
	const setCount = useCafe((state) => state.setCount);
	const [sku, setSku] = (0, import_react.useState)(stock[0]?.sku ?? "");
	const [qty, setQty] = (0, import_react.useState)(1);
	const [cost, setCost] = (0, import_react.useState)(0);
	const [cash, setCash] = (0, import_react.useState)(true);
	const [note, setNote] = (0, import_react.useState)("");
	const item = stock.find((entry) => entry.sku === sku) ?? stock[0];
	const ordered = (0, import_react.useMemo)(() => [...stock].sort((a, b) => a.onHand / Math.max(1, a.par) - b.onHand / Math.max(1, b.par)), [stock]);
	const low = ordered.filter((entry) => entry.onHand < entry.par);
	const usedIn = menu.filter((drink) => drink.recipe.some((use) => use.sku === item?.sku));
	if (!item) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "text-2xl font-medium",
			children: tx(lang, "انبار", "Cellar")
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mt-1 max-w-xl text-sm text-mute",
			children: tx(lang, "فروش، دستور را از موجودی کم می‌کند. خرید موجودی هزینه نیست؛ فقط اگر نقد بدهی از صندوق می‌رود.", "Sales pull recipes out of stock. A purchase is not an expense — cash only leaves the drawer if you mark it paid.")
		}),
		low.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-4 border border-stamp px-3 py-2 text-sm text-stamp",
			children: [
				tx(lang, "زیر خط سفارش", "Below par"),
				": ",
				low.map((entry) => lang === "fa" ? entry.nameFa : entry.nameEn).join(tx(lang, "، ", ", "))
			]
		}) : null,
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 grid gap-3 border border-line bg-sheet p-4 md:grid-cols-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: tx(lang, "کالا", "Item"),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
						className: fieldClass,
						value: item.sku,
						onChange: (event) => setSku(event.target.value),
						children: ordered.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: entry.sku,
							children: lang === "fa" ? entry.nameFa : entry.nameEn
						}, entry.sku))
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: tx(lang, "مقدار", "Quantity"),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						dir: "ltr",
						type: "number",
						className: fieldClass,
						value: qty,
						onChange: (event) => setQty(Number(event.target.value))
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: tx(lang, "بهای واحد تازه، برای میانگین", "New unit cost, for the average"),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						dir: "ltr",
						type: "number",
						className: fieldClass,
						value: cost,
						onChange: (event) => setCost(Number(event.target.value))
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					label: tx(lang, "یادداشت دورریز", "Waste note"),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: fieldClass,
						value: note,
						onChange: (event) => setNote(event.target.value)
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "flex items-center gap-2 text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "checkbox",
						checked: cash,
						onChange: (event) => setCash(event.target.checked)
					}), tx(lang, "خرید از صندوق نقد رفت", "Paid from the cash drawer")]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
							onClick: () => receive(item.sku, qty, cost, cash),
							children: tx(lang, "رسید خرید", "Receive")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
							tone: "line",
							onClick: () => waste(item.sku, qty, note || tx(lang, "دورریز", "Waste")),
							children: tx(lang, "دورریز", "Waste")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
							tone: "line",
							onClick: () => setCount(item.sku, qty),
							children: tx(lang, "شمارش مطلق", "Set count")
						})
					]
				}),
				usedIn.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs text-mute md:col-span-2",
					children: [
						tx(lang, "در دستور", "In"),
						": ",
						usedIn.map((drink) => lang === "fa" ? drink.nameFa : drink.nameEn).join(tx(lang, "، ", ", "))
					]
				}) : null
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-4 grid gap-2",
			children: ordered.map((entry) => {
				const ratio = entry.par > 0 ? Math.max(0, Math.min(1, entry.onHand / entry.par)) : 1;
				const critical = entry.onHand < entry.par;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => setSku(entry.sku),
					className: cn("w-full border px-3 py-3 text-start", entry.sku === item.sku ? "border-ink" : "border-line"),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-baseline justify-between gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-medium",
								children: lang === "fa" ? entry.nameFa : entry.nameEn
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: cn("text-sm", critical ? "text-stamp" : "text-ink"),
								children: [
									entry.onHand,
									" ",
									unitLabel(entry.unit, lang)
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mt-2 block h-1.5 bg-paper-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: cn("block h-full", critical ? "bg-stamp" : "bg-ink"),
								style: { width: `${ratio * 100}%` }
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "mt-1 block text-xs text-mute",
							children: [
								tx(lang, "خط سفارش", "Par"),
								" ",
								entry.par
							]
						})
					]
				}) }, entry.sku);
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "mt-8 text-lg font-medium",
			children: tx(lang, "گردش", "Movement")
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-2 divide-y divide-line border-y border-line text-sm",
			children: moves.slice(0, 12).map((move) => {
				const named = stock.find((entry) => entry.sku === move.sku);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex items-center justify-between gap-3 py-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [named ? lang === "fa" ? named.nameFa : named.nameEn : move.sku, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "ms-2 text-xs text-mute",
						children: formatWhen(move.at, lang)
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						dir: "ltr",
						children: move.qty > 0 ? `+${move.qty}` : move.qty
					})]
				}, move.id);
			})
		})
	] });
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var smsCall = createServerFn({ method: "POST" }).validator((input) => input).handler(createSsrRpc("e30f1603d2cce39df55cacd4e6a5818bbf027e98dc7f356848295be47b57cfe6"));
async function sendOut(opts) {
	const messages = opts.messages.map((message) => ({
		mobile: normPhone(message.mobile),
		text: message.text.trim()
	})).filter((message) => validPhone(message.mobile) && message.text);
	const body = messages[0]?.text ?? "";
	const to = messages.map((message) => message.mobile);
	if (messages.length === 0) return {
		status: "failed",
		detail: "گیرنده‌ای نیست",
		balance: null,
		kind: opts.kind,
		to,
		body
	};
	if (!opts.apiKey.trim()) return {
		status: "demo",
		detail: "کلید SMS.ir نیست — پیام فقط در دفترچه تمرین ماند",
		balance: null,
		kind: opts.kind,
		to,
		body
	};
	const same = messages.every((message) => message.text === messages[0]?.text);
	let result;
	if (same) result = await smsCall({ data: {
		op: "bulk",
		apiKey: opts.apiKey.trim(),
		lineNumber: opts.line.trim(),
		messageText: messages[0].text,
		mobiles: to
	} });
	else result = await smsCall({ data: {
		op: "peers",
		apiKey: opts.apiKey.trim(),
		lineNumber: opts.line.trim(),
		messageTexts: messages.map((message) => message.text),
		mobiles: to
	} });
	return {
		status: result.ok ? "sent" : "failed",
		detail: result.packId ? `${result.message} · ${result.packId}` : result.message,
		balance: result.balance,
		kind: opts.kind,
		to,
		body: same ? body : messages.map((message) => message.text).join("\n")
	};
}
function Guests() {
	const lang = useCafe((state) => state.settings.lang);
	const customers = useCafe((state) => state.customers);
	const addCustomer = useCafe((state) => state.addCustomer);
	const [query, setQuery] = (0, import_react.useState)("");
	const [selected, setSelected] = (0, import_react.useState)(null);
	const [draftName, setDraftName] = (0, import_react.useState)("");
	const [draftPhone, setDraftPhone] = (0, import_react.useState)("");
	const guest = customers.find((entry) => entry.id === selected) ?? null;
	const q = query.trim();
	const list = customers.filter((entry) => !q || entry.name.includes(q) || entry.phone.includes(q) || entry.referral.toLowerCase().includes(q.toLowerCase()));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "lg:flex lg:gap-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: cn("lg:w-80 lg:shrink-0", guest ? "hidden lg:block" : ""),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-2xl font-medium",
					children: tx(lang, "مهمان‌ها", "Guests")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-mute",
					children: tx(lang, "مهر ۸تایی تا سقف لاته سیروپ. امتیاز ۱۴ تا ۱۶ دو برابر. سطح از خرج عمر. تولد همین هفته یک هدیه.", "Eight stamps, capped at a syrup latte. Double points 14:00–16:00. Tiers follow lifetime spend. A birthday gift this week.")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: `${fieldClass} mt-4`,
					placeholder: tx(lang, "نام یا شماره", "Name or mobile"),
					value: query,
					onChange: (event) => setQuery(event.target.value)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
					className: "mt-3 divide-y divide-line border-y border-line",
					children: list.map((entry) => {
						const quiet = quietDays(entry.lastVisit) >= 21;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => setSelected(entry.id),
							className: "flex w-full items-start justify-between gap-2 py-3 text-start",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block font-medium",
								children: entry.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-mute",
								dir: "ltr",
								children: entry.phone
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-end text-xs",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "block",
										children: tierName(tierOf(entry.spent), lang)
									}),
									birthdaySoon(entry.birthday) ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-stamp",
										children: tx(lang, "تولد", "Birthday")
									}) : null,
									quiet ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "block text-warn",
										children: tx(lang, "خاموش", "Quiet")
									}) : null
								]
							})]
						}) }, entry.id);
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					className: "mt-4 grid gap-2",
					onSubmit: (event) => {
						event.preventDefault();
						const result = addCustomer({
							name: draftName,
							phone: draftPhone,
							birthday: "",
							notes: ""
						});
						if (result === "bad" || result === "phone") {
							toast(result === "phone" ? tx(lang, "این شماره هست", "That number exists") : tx(lang, "شماره نادرست است", "Bad mobile"));
							return;
						}
						setSelected(result);
						setDraftName("");
						setDraftPhone("");
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: fieldClass,
							placeholder: tx(lang, "نام", "Name"),
							value: draftName,
							onChange: (event) => setDraftName(event.target.value)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							dir: "ltr",
							className: fieldClass,
							placeholder: "09",
							value: draftPhone,
							onChange: (event) => setDraftPhone(event.target.value)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
							type: "submit",
							children: tx(lang, "مهمان تازه", "New guest")
						})
					]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: cn("min-w-0 flex-1", guest ? "" : "hidden lg:block"),
			children: guest ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Profile, {
				guest,
				onBack: () => setSelected(null)
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "border border-dashed border-line p-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-2xl italic leading-snug",
					children: tx(lang, "یک نفر را انتخاب کن تا مکثش را ببینی.", "Pick someone to see their pause.")
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "mt-4 space-y-2 text-sm text-ink-soft",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: tx(lang, "مهمان ۰ · آشنا ۵٪ از ۲ میلیون · کومو ۸٪ از ۸ · حلقه ۱۲٪ از ۲۰", "Guest 0 · Regular 5% after 2m · Como 8% after 8m · Inner 12% after 20m") }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: tx(lang, "هر ۱۰ هزار تومان یک امتیاز. صد امتیاز پنجاه هزار تومان است.", "One point per 10,000 toman. One hundred points are 50,000 toman.") }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: tx(lang, "کد معرفی C و چهار رقم آخر است. هر دو طرف ۵۰ امتیاز می‌گیرند.", "Referral code is C plus the last four digits. Both sides get 50 points.") }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: tx(lang, "بیست‌ویک روز سکوت، برای پیام دلتنگی علامت می‌خورد.", "Twenty-one quiet days flags a win-back message.") })
					]
				})]
			})
		})]
	});
}
function Profile({ guest, onBack }) {
	const lang = useCafe((state) => state.settings.lang);
	const settings = useCafe((state) => state.settings);
	const menu = useCafe((state) => state.menu);
	const orders = useCafe((state) => state.orders);
	const patchCustomer = useCafe((state) => state.patchCustomer);
	const removeCustomer = useCafe((state) => state.removeCustomer);
	const logSms = useCafe((state) => state.logSms);
	const favorite = menu.find((item) => item.id === guest.favoriteId);
	const history = orders.filter((order) => order.customerId === guest.id).slice(0, 6);
	const tier = tierOf(guest.spent);
	const days = daysUntilBirthday(guest.birthday);
	const quiet = quietDays(guest.lastVisit);
	const send = async (kind) => {
		const text = kind === "birthday" ? tx(lang, `${guest.name}، تولدت مبارک. این هفته در کومو یک نوشیدنی تا سقف لاته سیروپ مهمان توست.`, `${guest.name}, happy birthday. This week a drink up to a syrup latte is on COMO.`) : tx(lang, `${guest.name} عزیز، ساعت ۲ تا ۴ امتیاز مکث در کومو دو برابر است.`, `${guest.name}, points double at COMO between 2 and 4.`);
		const outcome = await sendOut({
			apiKey: settings.smsApiKey,
			line: settings.smsLine,
			kind,
			messages: [{
				mobile: guest.phone,
				text
			}]
		});
		logSms({
			to: outcome.to,
			body: outcome.body,
			kind,
			status: outcome.status,
			detail: outcome.detail
		});
		toast(outcome.status === "failed" ? outcome.detail : tx(lang, "پیام ثبت شد", "Message kept"));
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "mb-3 text-sm text-mute lg:hidden",
			onClick: onBack,
			children: tx(lang, "بازگشت به فهرست", "Back to the list")
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap items-start justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-2xl font-medium",
				children: guest.name
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-mute",
				dir: "ltr",
				children: [
					guest.phone,
					" · ",
					guest.referral
				]
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm",
				children: [
					tierName(tier, lang),
					" · ",
					formatCompact(guest.spent, lang)
				]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 flex gap-1",
			children: [Array.from({ length: settings.stampGoal }, (_, index) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("size-4 border border-ink", index < Math.min(guest.stamps, settings.stampGoal) ? "bg-ink" : "bg-sheet") }, index)), guest.stamps >= settings.stampGoal ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "ms-2 text-sm text-stamp",
				children: tx(lang, "مهر آماده است", "Stamp is ready")
			}) : null]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "mt-3 text-sm text-ink-soft",
			children: [
				guest.points,
				" ",
				tx(lang, "امتیاز", "points"),
				" · ",
				guest.visits,
				" ",
				tx(lang, "مراجعه", "visits"),
				favorite ? ` · ${tx(lang, "معمول", "Usual")}: ${lang === "fa" ? favorite.nameFa : favorite.nameEn}` : "",
				days !== null && days <= 7 ? ` · ${tx(lang, `تولد تا ${days} روز`, `birthday in ${days}d`)}` : "",
				quiet >= 21 ? ` · ${tx(lang, `${quiet} روز خاموش`, `${quiet} quiet days`)}` : ""
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
			className: "mt-4 block text-xs text-mute",
			children: [tx(lang, "یادداشت باریستا", "Barista note"), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
				className: "mt-1 h-24 w-full border border-line bg-sheet p-3 text-base text-ink outline-none focus:border-ink",
				value: guest.notes,
				onChange: (event) => patchCustomer(guest.id, { notes: event.target.value })
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-3 grid gap-2 sm:grid-cols-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "text-xs text-mute",
				children: [tx(lang, "تولد", "Birthday"), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					dir: "ltr",
					type: "date",
					className: `${fieldClass} mt-1`,
					value: guest.birthday,
					onChange: (event) => patchCustomer(guest.id, { birthday: event.target.value })
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "text-xs text-mute",
				children: [tx(lang, "امتیاز", "Points"), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					dir: "ltr",
					type: "number",
					className: `${fieldClass} mt-1`,
					value: guest.points,
					onChange: (event) => patchCustomer(guest.id, { points: Math.max(0, Number(event.target.value)) })
				})]
			})]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
			className: "mt-3 flex items-center gap-2 text-sm",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				type: "checkbox",
				checked: guest.smsOptIn,
				onChange: (event) => patchCustomer(guest.id, { smsOptIn: event.target.checked })
			}), tx(lang, "پیامک مجاز است", "SMS allowed")]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 flex flex-wrap gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
					tone: "line",
					disabled: !guest.smsOptIn,
					onClick: () => void send("loyalty"),
					children: tx(lang, "پیام ساعت آرام", "Slow-hour note")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
					tone: "stamp",
					disabled: !guest.smsOptIn || !birthdaySoon(guest.birthday),
					onClick: () => void send("birthday"),
					children: tx(lang, "پیام تولد", "Birthday note")
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
					tone: "ghost",
					onClick: () => {
						removeCustomer(guest.id);
						onBack();
					},
					children: tx(lang, "حذف", "Remove")
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
			className: "mt-6 text-sm text-mute",
			children: tx(lang, "آخرین فیش‌ها", "Recent tickets")
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
			className: "mt-2 divide-y divide-line border-y border-line text-sm",
			children: [history.map((order) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "flex justify-between gap-3 py-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
					"#",
					order.number,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "ms-2 text-xs text-mute",
						children: formatWhen(order.at, lang)
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatCompact(order.total, lang) })]
			}, order.id)), history.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
				className: "py-2 text-mute",
				children: tx(lang, "هنوز فیشی نیست.", "No tickets yet.")
			}) : null]
		})
	] });
}
var PAUSES = {
	fa: [
		"یک دقیقه. قبل از اولین جرعه.",
		"قهوه بهانه است. مکث اصل ماجراست.",
		"این فیش یک مکث کوچک است."
	],
	en: [
		"One minute. Before the first sip.",
		"Coffee is the excuse. The pause is the point.",
		"This ticket is a small pause."
	]
};
function payLabel(pay, lang) {
	if (pay === "cash") return tx(lang, "نقد", "Cash");
	if (pay === "card") return tx(lang, "کارت", "Card");
	return tx(lang, "آنلاین", "Online");
}
function buildReceiptDoc(order, customer, settings) {
	const lang = settings.lang;
	const rows = [{
		label: tx(lang, "جمع", "Subtotal"),
		value: formatToman(order.subtotal, lang)
	}];
	if (order.manualOff) rows.push({
		label: tx(lang, "تخفیف", "Discount"),
		value: formatToman(order.manualOff, lang)
	});
	if (order.stampOff) rows.push({
		label: tx(lang, "مهر رایگان", "Stamp"),
		value: formatToman(order.stampOff, lang)
	});
	if (order.giftOff) rows.push({
		label: tx(lang, "هدیه تولد", "Birthday"),
		value: formatToman(order.giftOff, lang)
	});
	if (order.tierOff) rows.push({
		label: tx(lang, "تخفیف سطح", "Tier"),
		value: formatToman(order.tierOff, lang)
	});
	if (order.pointsOff) rows.push({
		label: tx(lang, "امتیاز", "Points"),
		value: formatToman(order.pointsOff, lang)
	});
	const loyaltyBits = [];
	if (order.guestName) loyaltyBits.push(order.guestName);
	if (order.pointsEarned) loyaltyBits.push(tx(lang, `${order.pointsEarned} امتیاز این فیش`, `${order.pointsEarned} pts`));
	if (order.bonusPoints) loyaltyBits.push(tx(lang, `${order.bonusPoints} امتیاز معرفی`, `${order.bonusPoints} referral`));
	if (typeof order.stampsAfter === "number") loyaltyBits.push(tx(lang, `مهر ${order.stampsAfter} از ${settings.stampGoal}`, `stamps ${order.stampsAfter}/${settings.stampGoal}`));
	if (typeof order.pointsAfter === "number") loyaltyBits.push(tx(lang, `مانده امتیاز ${order.pointsAfter}`, `${order.pointsAfter} pts left`));
	if (!order.guestName) loyaltyBits.push(tx(lang, "بدون مهر — شماره نگرفتیم", "No stamp — no number"));
	const pause = PAUSES[lang][order.number % PAUSES[lang].length] ?? PAUSES[lang][0];
	return {
		dir: lang === "fa" ? "rtl" : "ltr",
		lang,
		kicker: "COFFEE. PEOPLE. MOMENTS.",
		address: lang === "fa" ? settings.addressFa : settings.addressEn,
		instagram: settings.instagram,
		phone: settings.phone,
		number: tx(lang, `فیش ${order.number}`, `Ticket ${order.number}`),
		when: formatWhen(order.at, lang),
		lines: order.lines.map((line) => {
			const mods = line.mods.map((mod) => lang === "fa" ? mod.nameFa : mod.nameEn).join(tx(lang, "، ", ", "));
			const title = `${line.qty} × ${lang === "fa" ? line.nameFa : line.nameEn}`;
			const sub = lang === "fa" ? line.nameEn : line.nameFa;
			return {
				title: mods ? `${title} · ${mods}` : title,
				sub,
				amount: formatToman(line.unitPrice * line.qty, lang)
			};
		}),
		rows,
		totalLabel: tx(lang, "قابل پرداخت", "Due"),
		total: formatToman(order.total, lang),
		pay: payLabel(order.pay, lang),
		note: order.note,
		pause,
		loyalty: loyaltyBits.join(" · "),
		footer: customer ? "" : ""
	};
}
function esc(value) {
	return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll("\"", "&quot;");
}
function receiptHtml(doc, paper) {
	const width = paper === 58 ? "54mm" : "72mm";
	const lines = doc.lines.map((line) => `<tr>
        <td style="padding:4px 0; vertical-align:top">
          <div style="font-weight:700">${esc(line.title)}</div>
          <div style="color:#555; font-size:11px">${esc(line.sub)}</div>
        </td>
        <td style="padding:4px 0 4px 8px; text-align:end; white-space:nowrap; vertical-align:top">${esc(line.amount)}</td>
      </tr>`).join("");
	const rows = doc.rows.map((row) => `<tr><td style="padding:2px 0; color:#333">${esc(row.label)}</td><td style="padding:2px 0; text-align:end">${esc(row.value)}</td></tr>`).join("");
	return `<!doctype html><html dir="${doc.dir}" lang="${doc.lang}"><head><meta charset="utf-8"><title>COMO</title>
    <style>
      @page { size: ${paper}mm auto; margin: 4mm; }
      html, body { margin: 0; padding: 0; background: #fff; color: #111; }
      body { font-family: Vazirmatn, "DejaVu Sans", sans-serif; width: ${width}; font-size: 12px; }
      h1 { font-size: 28px; letter-spacing: 0.18em; text-align: center; margin: 0; }
      .center { text-align: center; }
      .rule { border-top: 1px dashed #111; margin: 8px 0; }
      table { width: 100%; border-collapse: collapse; }
      .total { font-size: 16px; font-weight: 700; }
    </style></head><body>
    <h1>COMO</h1>
    <p class="center" style="letter-spacing:.14em; font-size:10px; margin:4px 0">${esc(doc.kicker)}</p>
    <p class="center" style="margin:0">${esc(doc.address)}</p>
    ${doc.phone ? `<p class="center" style="margin:0">${esc(doc.phone)}</p>` : ""}
    <p class="center" style="margin:0">${esc(doc.instagram)}</p>
    <div class="rule"></div>
    <table><tr><td>${esc(doc.number)}</td><td style="text-align:end">${esc(doc.when)}</td></tr></table>
    <div class="rule"></div>
    <table>${lines}</table>
    <div class="rule"></div>
    <table>${rows}</table>
    <table class="total"><tr><td>${esc(doc.totalLabel)}</td><td style="text-align:end">${esc(doc.total)}</td></tr></table>
    <p>${esc(doc.pay)}</p>
    ${doc.note ? `<p>${esc(doc.note)}</p>` : ""}
    <div class="rule"></div>
    <p>${esc(doc.loyalty)}</p>
    <p class="center" style="font-style:italic">${esc(doc.pause)}</p>
    <p class="center">EST. 2026</p>
    </body></html>`;
}
function printReceipt(doc, paper) {
	const frame = document.createElement("iframe");
	frame.setAttribute("aria-hidden", "true");
	frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0";
	document.body.appendChild(frame);
	const target = frame.contentDocument;
	const win = frame.contentWindow;
	if (!target || !win) {
		frame.remove();
		return;
	}
	target.open();
	target.write(receiptHtml(doc, paper));
	target.close();
	window.setTimeout(() => {
		win.focus();
		win.print();
		window.setTimeout(() => frame.remove(), 1200);
	}, 200);
}
async function paint(doc, width) {
	const height = 360 + doc.lines.length * 72 + doc.rows.length * 28;
	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext("2d");
	if (!ctx) return canvas;
	try {
		await document.fonts.load("700 42px Vazirmatn");
		await document.fonts.load("400 22px Vazirmatn");
	} catch {}
	ctx.fillStyle = "#fff";
	ctx.fillRect(0, 0, width, height);
	ctx.fillStyle = "#000";
	ctx.textBaseline = "top";
	const rtl = doc.dir === "rtl";
	const margin = 24;
	let y = 20;
	const center = (text, size, weight = "700") => {
		ctx.font = `${weight} ${size}px Vazirmatn, "DejaVu Sans", sans-serif`;
		ctx.textAlign = "center";
		ctx.fillText(text, width / 2, y);
		y += size + 10;
	};
	const row = (left, right, size = 22, weight = "400") => {
		ctx.font = `${weight} ${size}px Vazirmatn, "DejaVu Sans", sans-serif`;
		ctx.textAlign = rtl ? "right" : "left";
		ctx.fillText(left, rtl ? width - margin : margin, y, width - 48 - 8);
		ctx.textAlign = rtl ? "left" : "right";
		ctx.fillText(right, rtl ? margin : width - margin, y);
		y += size + 8;
	};
	center("COMO", 42);
	center(doc.kicker, 14, "400");
	center(doc.address, 18, "400");
	if (doc.phone) center(doc.phone, 16, "400");
	center(doc.instagram, 16, "400");
	y += 6;
	ctx.beginPath();
	ctx.moveTo(margin, y);
	ctx.lineTo(width - margin, y);
	ctx.stroke();
	y += 12;
	row(doc.number, doc.when, 18);
	y += 4;
	for (const line of doc.lines) {
		row(line.title, line.amount, 22, "700");
		ctx.font = `400 16px Vazirmatn, "DejaVu Sans", sans-serif`;
		ctx.textAlign = rtl ? "right" : "left";
		ctx.fillText(line.sub, rtl ? width - margin : margin, y);
		y += 26;
	}
	ctx.beginPath();
	ctx.moveTo(margin, y);
	ctx.lineTo(width - margin, y);
	ctx.stroke();
	y += 12;
	for (const entry of doc.rows) row(entry.label, entry.value, 18);
	row(doc.totalLabel, doc.total, 26, "700");
	row(doc.pay, "", 18);
	if (doc.note) {
		ctx.font = `400 16px Vazirmatn, "DejaVu Sans", sans-serif`;
		ctx.textAlign = rtl ? "right" : "left";
		ctx.fillText(doc.note, rtl ? width - margin : margin, y, width - 48);
		y += 28;
	}
	y += 8;
	ctx.font = `400 16px Vazirmatn, "DejaVu Sans", sans-serif`;
	ctx.textAlign = "center";
	const loyalty = doc.loyalty.length > 80 ? `${doc.loyalty.slice(0, 80)}…` : doc.loyalty;
	ctx.fillText(loyalty, width / 2, y, width - 48);
	y += 28;
	ctx.font = `italic 500 18px Fraunces, Vazirmatn, serif`;
	ctx.fillText(doc.pause, width / 2, y, width - 48);
	return canvas;
}
function raster(canvas) {
	const ctx = canvas.getContext("2d");
	if (!ctx) return new Uint8Array([27, 64]);
	const { width, height } = canvas;
	const image = ctx.getImageData(0, 0, width, height);
	const widthBytes = Math.ceil(width / 8);
	const dots = new Uint8Array(widthBytes * height);
	for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) {
		const index = (y * width + x) * 4;
		if ((image.data[index] ?? 255) * .3 + (image.data[index + 1] ?? 255) * .59 + (image.data[index + 2] ?? 255) * .11 < 170) dots[y * widthBytes + (x >> 3)] |= 128 >> (x & 7);
	}
	const header = new Uint8Array([
		27,
		64,
		29,
		118,
		48,
		0,
		widthBytes & 255,
		widthBytes >> 8 & 255,
		height & 255,
		height >> 8 & 255
	]);
	const tail = new Uint8Array([
		10,
		10,
		10,
		29,
		86,
		0
	]);
	const out = new Uint8Array(header.length + dots.length + tail.length);
	out.set(header, 0);
	out.set(dots, header.length);
	out.set(tail, header.length + dots.length);
	return out;
}
function drawerPulse() {
	return new Uint8Array([
		27,
		112,
		0,
		25,
		250
	]);
}
async function receiptBytes(doc, paper, kick) {
	const body = raster(await paint(doc, paper === 80 ? 576 : 384));
	if (!kick) return body;
	const pulse = drawerPulse();
	const out = new Uint8Array(pulse.length + body.length);
	out.set(pulse, 0);
	out.set(body, pulse.length);
	return out;
}
function serialAvailable() {
	return typeof navigator !== "undefined" && "serial" in navigator;
}
async function sendToPrinter(bytes, baud) {
	const serial = navigator.serial;
	if (!serial) throw new Error("Web Serial فقط در Chrome روی اتصال امن هست");
	const port = await serial.requestPort();
	await port.open({ baudRate: baud });
	const writable = port.writable;
	if (!writable) throw new Error("درگاه نوشتن ندارد");
	const writer = writable.getWriter();
	try {
		const size = 4096;
		for (let index = 0; index < bytes.length; index += size) await writer.write(bytes.subarray(index, index + size));
	} finally {
		writer.releaseLock();
		await port.close();
	}
}
function downloadBytes(bytes, filename) {
	const copy = new ArrayBuffer(bytes.byteLength);
	new Uint8Array(copy).set(bytes);
	const blob = new Blob([copy], { type: "application/octet-stream" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	link.click();
	URL.revokeObjectURL(url);
}
function House() {
	const store = useCafe();
	const lang = store.settings.lang;
	const settings = store.settings;
	const [arm, setArm] = (0, import_react.useState)(false);
	const [nameFa, setNameFa] = (0, import_react.useState)("");
	const [nameEn, setNameEn] = (0, import_react.useState)("");
	const [category, setCategory] = (0, import_react.useState)("hot-coffee");
	const [price, setPrice] = (0, import_react.useState)(200);
	const patch = store.patchSettings;
	const number = (key, value) => {
		const next = Number(value);
		if (Number.isFinite(next)) patch({ [key]: next });
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "max-w-3xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-medium",
				children: tx(lang, "خانه", "House")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-mute",
				children: tx(lang, "کوچه هفتم خیابان طلوع. داده‌ها روی همین دستگاه می‌مانند.", "7th alley of Tolou St. The books stay on this device.")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid gap-3 md:grid-cols-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: tx(lang, "نشانی فارسی", "Persian address"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: fieldClass,
							value: settings.addressFa,
							onChange: (event) => patch({ addressFa: event.target.value })
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: tx(lang, "نشانی انگلیسی", "English address"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: fieldClass,
							value: settings.addressEn,
							onChange: (event) => patch({ addressEn: event.target.value })
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: tx(lang, "تلفن کافه", "Cafe phone"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							dir: "ltr",
							className: fieldClass,
							value: settings.phone,
							onChange: (event) => patch({ phone: event.target.value })
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "Instagram",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							dir: "ltr",
							className: fieldClass,
							value: settings.instagram,
							onChange: (event) => patch({ instagram: event.target.value })
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-8 text-lg font-medium",
				children: tx(lang, "چاپگر حرارتی", "Thermal printer")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex flex-wrap gap-2",
				children: [[80, 58].map((paper) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => patch({ paper }),
					className: `h-11 px-3 text-sm ${settings.paper === paper ? "bg-ink text-paper" : "border border-line"}`,
					children: [paper, " mm"]
				}, paper)), [9600, 115200].map((baud) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => patch({ baud }),
					className: `h-11 px-3 text-sm ${settings.baud === baud ? "bg-ink text-paper" : "border border-line"}`,
					children: baud
				}, baud))]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex flex-wrap gap-4 text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "checkbox",
						checked: settings.autoPrint,
						onChange: (event) => patch({ autoPrint: event.target.checked })
					}), tx(lang, "چاپ خودکار فیش", "Auto-print tickets")]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "checkbox",
						checked: settings.autoSms,
						onChange: (event) => patch({ autoSms: event.target.checked })
					}), tx(lang, "پیامک خودکار فیش", "Auto-text tickets")]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
				className: "mt-3",
				tone: "line",
				onClick: () => {
					const order = store.orders[0];
					if (!order) return;
					printReceipt(buildReceiptDoc(order, store.customers.find((entry) => entry.id === order.customerId), settings), settings.paper);
				},
				children: tx(lang, "چاپ آزمایشی آخرین فیش", "Test-print the last ticket")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-8 text-lg font-medium",
				children: tx(lang, "قانون وفاداری", "Loyalty rules")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 grid gap-3 sm:grid-cols-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
						label: tx(lang, "تومان برای یک امتیاز", "Toman per point"),
						value: settings.pointsPer,
						onChange: (value) => number("pointsPer", value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
						label: tx(lang, "ارزش هر امتیاز", "Value of a point"),
						value: settings.pointValue,
						onChange: (value) => number("pointValue", value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
						label: tx(lang, "مهر لازم", "Stamps needed"),
						value: settings.stampGoal,
						onChange: (value) => number("stampGoal", value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
						label: tx(lang, "سقف مهمانی، ۰ یعنی آزاد", "Comp cap, 0 is open"),
						value: settings.compCap,
						onChange: (value) => number("compCap", value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
						label: tx(lang, "شروع ساعت آرام", "Slow hour starts"),
						value: settings.slowStart,
						onChange: (value) => number("slowStart", value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
						label: tx(lang, "پایان ساعت آرام", "Slow hour ends"),
						value: settings.slowEnd,
						onChange: (value) => number("slowEnd", value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
						label: tx(lang, "امتیاز معرفی", "Referral points"),
						value: settings.referralBonus,
						onChange: (value) => number("referralBonus", value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Num, {
						label: tx(lang, "تنخواه", "Float"),
						value: settings.float,
						onChange: (value) => number("float", value)
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-8 text-lg font-medium",
				children: tx(lang, "قیمت منو، به هزار", "Menu prices, in thousands")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-3 divide-y divide-line border-y border-line",
				children: store.menu.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex items-center gap-3 py-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "block text-sm",
								children: lang === "fa" ? item.nameFa : item.nameEn
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-mute",
								children: tx(lang, CATEGORIES.find((entry) => entry.id === item.category)?.fa ?? "", CATEGORIES.find((entry) => entry.id === item.category)?.en ?? "")
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							dir: "ltr",
							type: "number",
							className: "h-11 w-24 border border-line bg-sheet px-2 text-center",
							value: Math.round(item.price / 1e3),
							onChange: (event) => store.setPrice(item.id, Number(event.target.value) * 1e3)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "w-10 text-xs text-mute",
							children: formatMenu(item.price, lang)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "h-11 px-2 text-xs",
							onClick: () => store.toggleItem(item.id),
							children: item.active ? tx(lang, "هست", "On") : tx(lang, "تمام", "86")
						})
					]
				}, item.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mt-4 grid gap-2 sm:grid-cols-2",
				onSubmit: (event) => {
					event.preventDefault();
					store.addMenuItem({
						nameFa,
						nameEn,
						category,
						price: price * 1e3
					});
					setNameFa("");
					setNameEn("");
				},
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: fieldClass,
						placeholder: tx(lang, "نام فارسی", "Persian name"),
						value: nameFa,
						onChange: (event) => setNameFa(event.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: fieldClass,
						placeholder: tx(lang, "نام انگلیسی", "English name"),
						value: nameEn,
						onChange: (event) => setNameEn(event.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
						className: fieldClass,
						value: category,
						onChange: (event) => setCategory(event.target.value),
						children: CATEGORIES.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: entry.id,
							children: tx(lang, entry.fa, entry.en)
						}, entry.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						dir: "ltr",
						type: "number",
						className: fieldClass,
						value: price,
						onChange: (event) => setPrice(Number(event.target.value))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
						type: "submit",
						children: tx(lang, "افزودن به منو", "Add to the menu")
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-8 text-lg font-medium",
				children: tx(lang, "نسخه", "Copy")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 flex flex-wrap gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
						tone: "line",
						onClick: () => {
							const blob = new Blob([JSON.stringify(snapshotOf(store))], { type: "application/json" });
							const url = URL.createObjectURL(blob);
							const link = document.createElement("a");
							link.href = url;
							link.download = "como-desk.json";
							link.click();
							URL.revokeObjectURL(url);
						},
						children: tx(lang, "دانلود دفتر", "Download the books")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "inline-flex h-12 cursor-pointer items-center border border-line bg-sheet px-4 text-sm",
						children: [tx(lang, "بازگردانی", "Restore"), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "file",
							accept: "application/json",
							className: "sr-only",
							onChange: (event) => {
								const file = event.target.files?.[0];
								if (!file) return;
								file.text().then((text) => {
									if (text.length > 2e6) return;
									try {
										store.importBackup(JSON.parse(text));
									} catch {}
								});
							}
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
						tone: "stamp",
						onClick: () => arm ? store.reset() : setArm(true),
						children: arm ? tx(lang, "بله، از نو", "Yes, start over") : tx(lang, "پاک کردن شیفت نمونه", "Clear the sample shift")
					})
				]
			})
		]
	});
}
function Num({ label, value, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
		label,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			dir: "ltr",
			type: "number",
			className: fieldClass,
			value,
			onChange: (event) => onChange(event.target.value)
		})
	});
}
var payOptions = [
	{
		id: "cash",
		fa: "نقد",
		en: "Cash"
	},
	{
		id: "card",
		fa: "کارت",
		en: "Card"
	},
	{
		id: "online",
		fa: "آنلاین",
		en: "Online"
	}
];
function errorText(code, lang) {
	if (code === "empty") return tx(lang, "فیش خالی است", "Ticket is empty");
	if (code === "phone") return tx(lang, "شماره موبایل درست نیست", "That mobile is not valid");
	return tx(lang, "یکی از آیتم‌ها تمام شده", "An item was 86’d");
}
function Pos() {
	const lang = useCafe((state) => state.settings.lang);
	const menu = useCafe((state) => state.menu);
	const customers = useCafe((state) => state.customers);
	const settings = useCafe((state) => state.settings);
	const checkout = useCafe((state) => state.checkout);
	const openReceipt = useCafe((state) => state.openReceipt);
	const logSms = useCafe((state) => state.logSms);
	const stock = useCafe((state) => state.stock);
	const [cat, setCat] = (0, import_react.useState)("hot-coffee");
	const [query, setQuery] = (0, import_react.useState)("");
	const [cart, setCart] = (0, import_react.useState)([]);
	const [pay, setPay] = (0, import_react.useState)("card");
	const [phone, setPhone] = (0, import_react.useState)("");
	const [name, setName] = (0, import_react.useState)("");
	const [referral, setReferral] = (0, import_react.useState)("");
	const [customerId, setCustomerId] = (0, import_react.useState)();
	const [discount, setDiscount] = (0, import_react.useState)(0);
	const [useStamp, setUseStamp] = (0, import_react.useState)(false);
	const [useGift, setUseGift] = (0, import_react.useState)(false);
	const [points, setPoints] = (0, import_react.useState)(0);
	const [note, setNote] = (0, import_react.useState)("");
	const [open, setOpen] = (0, import_react.useState)(false);
	const guest = customers.find((entry) => entry.id === customerId);
	const normalized = normPhone(phone);
	const matches = phone.trim() ? customers.filter((entry) => entry.phone.includes(normalized) || entry.name.includes(phone.trim())).slice(0, 4) : [];
	const known = customers.find((entry) => entry.phone === normalized);
	const showNew = validPhone(phone) && !guest && !known;
	const q = query.trim().toLowerCase();
	const shown = menu.filter((item) => {
		if (!item.active) return false;
		if (q) return item.nameFa.includes(query.trim()) || item.nameEn.toLowerCase().includes(q);
		return cat === "all" || item.category === cat;
	});
	const preview = (0, import_react.useMemo)(() => {
		const lines = cart.map((line) => {
			const item = menu.find((entry) => entry.id === line.itemId);
			if (!item) return null;
			const mods = line.mods.map((id) => MODS.find((mod) => mod.id === id)).filter(Boolean);
			const unit = item.price + mods.reduce((sum, mod) => sum + (mod?.price ?? 0), 0);
			return {
				...line,
				item,
				unit
			};
		}).filter((line) => Boolean(line));
		const subtotal = lines.reduce((sum, line) => sum + line.unit * line.qty, 0);
		const manual = Math.round(subtotal * Math.min(100, Math.max(0, discount)) / 100);
		let remain = Math.max(0, subtotal - manual);
		const cheapest = lines.reduce((min, line) => Math.min(min, line.unit), subtotal || 0);
		const cap = settings.compCap > 0 ? Math.min(cheapest, settings.compCap) : cheapest;
		const stamp = useStamp && guest && guest.stamps >= settings.stampGoal ? Math.min(cap, remain) : 0;
		remain -= stamp;
		const year = (/* @__PURE__ */ new Date()).getFullYear();
		const gift = useGift && guest && birthdaySoon(guest.birthday) && guest.giftYear !== year ? Math.min(cap, remain) : 0;
		remain -= gift;
		const rate = guest ? tierRate(tierOf(guest.spent)) : 0;
		const tier = Math.round(remain * rate);
		remain -= tier;
		const redeemValue = guest ? Math.min(points, guest.points) * settings.pointValue : 0;
		const pointsOff = Math.min(remain, redeemValue);
		return {
			lines,
			subtotal,
			manual,
			stamp,
			gift,
			tier,
			pointsOff,
			total: Math.max(0, remain - pointsOff)
		};
	}, [
		cart,
		menu,
		discount,
		useStamp,
		useGift,
		guest,
		settings,
		points
	]);
	const add = (itemId) => {
		setCart((current) => {
			const found = current.find((line) => line.itemId === itemId && line.mods.length === 0);
			if (found) return current.map((line) => line.key === found.key ? {
				...line,
				qty: line.qty + 1
			} : line);
			return [...current, {
				key: `${itemId}-${Date.now()}`,
				itemId,
				qty: 1,
				mods: []
			}];
		});
		setOpen(true);
	};
	const charge = async () => {
		const result = checkout({
			lines: cart.map((line) => ({
				itemId: line.itemId,
				qty: line.qty,
				mods: line.mods
			})),
			pay,
			note,
			customerId: guest?.id,
			newName: showNew ? name : void 0,
			newPhone: showNew ? phone : known && !guest ? known.phone : void 0,
			referralCode: showNew ? referral : void 0,
			discountPct: discount,
			useStamp,
			useGift,
			redeemPoints: points
		});
		if (!result.ok) {
			toast(errorText(result.error, lang));
			return;
		}
		if (result.warnings.length) {
			const names = result.warnings.map((sku) => stock.find((item) => item.sku === sku)).map((item) => item ? lang === "fa" ? item.nameFa : item.nameEn : "").filter(Boolean).join(tx(lang, "، ", ", "));
			toast(tx(lang, `موجودی منفی شد: ${names}`, `Stock went negative: ${names}`));
		}
		const fresh = useCafe.getState();
		const placed = fresh.orders.find((order) => order.id === result.order.id) ?? result.order;
		const person = fresh.customers.find((entry) => entry.id === placed.customerId);
		openReceipt(placed.id);
		if (fresh.settings.autoPrint) printReceipt(buildReceiptDoc(placed, person, fresh.settings), fresh.settings.paper);
		if (fresh.settings.autoSms && person?.smsOptIn) {
			const doc = buildReceiptDoc(placed, person, fresh.settings);
			const text = `COMO\n${doc.number}\n${doc.totalLabel}: ${doc.total}\n${doc.pause}`;
			const outcome = await sendOut({
				apiKey: fresh.settings.smsApiKey,
				line: fresh.settings.smsLine,
				kind: "receipt",
				messages: [{
					mobile: person.phone,
					text
				}]
			});
			logSms({
				to: outcome.to,
				body: outcome.body,
				kind: "receipt",
				status: outcome.status,
				detail: outcome.detail
			});
		}
		setCart([]);
		setPhone("");
		setName("");
		setReferral("");
		setCustomerId(void 0);
		setDiscount(0);
		setUseStamp(false);
		setUseGift(false);
		setPoints(0);
		setNote("");
		setOpen(false);
		toast(tx(lang, `فیش ${placed.number} بسته شد`, `Ticket ${placed.number} closed`));
	};
	const favorite = guest?.favoriteId ? menu.find((item) => item.id === guest.favoriteId && item.active) : void 0;
	const slow = inSlowHour(Date.now(), settings.slowStart, settings.slowEnd);
	const ticket = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex h-full flex-col",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-baseline justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-lg font-medium",
					children: tx(lang, "فیش", "Ticket")
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs text-mute",
					children: preview.lines.reduce((sum, line) => sum + line.qty, 0)
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "mt-3 block",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "sr-only",
					children: tx(lang, "شماره مهمان", "Guest mobile")
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					dir: "ltr",
					className: fieldClass,
					inputMode: "tel",
					placeholder: "09…",
					value: phone,
					onChange: (event) => {
						setPhone(event.target.value);
						setCustomerId(void 0);
					}
				})]
			}),
			matches.length > 0 && !guest ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-2 border border-line bg-sheet",
				children: matches.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "flex h-12 w-full items-center justify-between px-3 text-sm",
					onClick: () => {
						setCustomerId(entry.id);
						setPhone(entry.phone);
						setUseStamp(false);
						setPoints(0);
					},
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: entry.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-mute",
						dir: "ltr",
						children: entry.phone
					})]
				}) }, entry.id))
			}) : null,
			guest ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 border border-line bg-sheet p-3 text-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-medium",
							children: guest.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-mute",
							children: [
								tierName(tierOf(guest.spent), lang),
								" · ",
								guest.points,
								" ",
								tx(lang, "امتیاز", "pts"),
								" ·",
								" ",
								tx(lang, "مهر", "stamps"),
								" ",
								guest.stamps,
								"/",
								settings.stampGoal
							]
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "text-xs text-mute",
							onClick: () => setCustomerId(void 0),
							children: tx(lang, "جدا کن", "Detach")
						})]
					}),
					favorite ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						className: "mt-2 text-sm text-stamp",
						onClick: () => add(favorite.id),
						children: [
							tx(lang, "معمولش", "Usual"),
							": ",
							lang === "fa" ? favorite.nameFa : favorite.nameEn
						]
					}) : null,
					guest.notes ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-xs text-ink-soft",
						children: guest.notes
					}) : null
				]
			}) : null,
			showNew ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 grid gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: fieldClass,
					placeholder: tx(lang, "نام مهمان جدید", "New guest name"),
					value: name,
					onChange: (event) => setName(event.target.value)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: fieldClass,
					dir: "ltr",
					placeholder: tx(lang, "کد معرفی", "Referral code"),
					value: referral,
					onChange: (event) => setReferral(event.target.value)
				})]
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "mt-3 flex-1 space-y-3 overflow-auto",
				children: preview.lines.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "border border-dashed border-line p-4 font-display text-lg italic leading-snug",
					children: tx(lang, "یک مکث خالی. چیزی انتخاب کن.", "An empty pause. Add a drink.")
				}) : preview.lines.map((line) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "border-b border-line pb-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-medium",
							children: lang === "fa" ? line.item.nameFa : line.item.nameEn
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-mute",
							children: formatToman(line.unit, lang)
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-1",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "flex size-11 items-center justify-center border border-line",
									onClick: () => setCart((current) => current.flatMap((entry) => entry.key !== line.key ? entry : entry.qty <= 1 ? [] : [{
										...entry,
										qty: entry.qty - 1
									}])),
									"aria-label": "-",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { className: "size-4" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "w-6 text-center text-sm",
									children: line.qty
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "flex size-11 items-center justify-center border border-line",
									onClick: () => setCart((current) => current.map((entry) => entry.key === line.key ? {
										...entry,
										qty: entry.qty + 1
									} : entry)),
									"aria-label": "+",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "flex size-11 items-center justify-center",
									onClick: () => setCart((current) => current.filter((entry) => entry.key !== line.key)),
									"aria-label": tx(lang, "حذف", "Remove"),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" })
								})
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-2 flex flex-wrap gap-1",
						children: MODS.map((mod) => {
							const on = line.mods.includes(mod.id);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setCart((current) => current.map((entry) => entry.key === line.key ? {
									...entry,
									mods: on ? entry.mods.filter((id) => id !== mod.id) : [...entry.mods, mod.id]
								} : entry)),
								className: cn("h-9 px-2 text-xs", on ? "bg-ink text-paper" : "border border-line"),
								children: lang === "fa" ? mod.nameFa : mod.nameEn
							}, mod.id);
						})
					})]
				}, line.key))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 space-y-2 border-t border-line pt-3 text-sm",
				children: [
					slow ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs",
						children: tx(lang, "ساعت آرام: امتیاز این فیش دو برابر است.", "Slow hour: points double.")
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-mute",
							children: tx(lang, "تخفیف ٪", "Discount %")
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							dir: "ltr",
							type: "number",
							min: 0,
							max: 100,
							className: "h-11 w-20 border border-line bg-sheet px-2 text-center",
							value: discount,
							onChange: (event) => setDiscount(Number(event.target.value))
						})]
					}),
					guest && guest.stamps >= settings.stampGoal ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
						on: useStamp,
						onClick: () => setUseStamp((value) => !value),
						label: tx(lang, "مهر رایگان", "Free stamp")
					}) : null,
					guest && birthdaySoon(guest.birthday) && guest.giftYear !== (/* @__PURE__ */ new Date()).getFullYear() ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toggle, {
						on: useGift,
						onClick: () => setUseGift((value) => !value),
						label: tx(lang, "هدیه تولد", "Birthday gift")
					}) : null,
					guest && guest.points > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: tx(lang, "خرج امتیاز", "Redeem") }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "size-11 border border-line",
									onClick: () => setPoints((value) => Math.max(0, value - 50)),
									children: "-"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "w-10 text-center",
									children: Math.min(points, guest.points)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "size-11 border border-line",
									onClick: () => setPoints((value) => Math.min(guest.points, value + 50)),
									children: "+"
								})
							]
						})]
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						className: fieldClass,
						placeholder: tx(lang, "یادداشت فیش", "Ticket note"),
						value: note,
						onChange: (event) => setNote(event.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex justify-between text-base font-medium",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: tx(lang, "قابل پرداخت", "Due") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatToman(preview.total, lang) })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-3 gap-1",
						children: payOptions.map((option) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => setPay(option.id),
							className: cn("h-11 text-sm", pay === option.id ? "bg-ink text-paper" : "border border-line"),
							children: tx(lang, option.fa, option.en)
						}, option.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
						className: "w-full",
						disabled: preview.lines.length === 0,
						onClick: () => void charge(),
						children: tx(lang, "بستن فیش", "Close ticket")
					})
				]
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "lg:flex lg:gap-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 flex-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute start-3 top-3.5 size-4 text-mute" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							className: cn(fieldClass, "ps-10"),
							placeholder: tx(lang, "جست‌وجوی منو", "Search the menu"),
							value: query,
							onChange: (event) => setQuery(event.target.value)
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-3 flex gap-2 overflow-x-auto pb-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CatButton, {
							active: !q && cat === "all",
							onClick: () => {
								setCat("all");
								setQuery("");
							},
							label: tx(lang, "همه", "All")
						}), CATEGORIES.map((category) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CatButton, {
							active: !q && cat === category.id,
							onClick: () => {
								setCat(category.id);
								setQuery("");
							},
							label: tx(lang, category.fa, category.en)
						}, category.id))]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-4",
						children: shown.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => add(item.id),
							className: "flex min-h-28 flex-col border border-line bg-sheet p-3 text-start transition-colors duration-200 hover:border-ink",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs text-mute",
									children: lang === "fa" ? item.nameEn : item.nameFa
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mt-1 text-base font-medium leading-snug",
									children: lang === "fa" ? item.nameFa : item.nameEn
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "mt-auto pt-3 text-stamp",
									children: [formatMenu(item.price, lang), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "ms-1 text-xs text-mute",
										children: tx(lang, "هزار", "k")
									})]
								})
							]
						}, item.id))
					}),
					cart.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => setOpen(true),
						className: "fixed inset-x-4 bottom-20 z-30 flex h-14 items-center justify-between bg-ink px-4 text-paper lg:hidden",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
							preview.lines.reduce((sum, line) => sum + line.qty, 0),
							" ",
							tx(lang, "قلم", "items")
						] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatToman(preview.total, lang) })]
					}) : null
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
				className: "mt-6 hidden w-96 shrink-0 border border-line bg-sheet p-4 lg:block",
				children: ticket
			}),
			open ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "fixed inset-0 z-40 flex flex-col bg-paper lg:hidden",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between border-b border-line px-4 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-medium",
						children: tx(lang, "فیش", "Ticket")
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "h-11 px-3 text-sm text-mute",
						onClick: () => setOpen(false),
						children: tx(lang, "منو", "Menu")
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "min-h-0 flex-1 overflow-auto px-4 pb-24",
					children: ticket
				})]
			}) : null
		]
	});
}
function CatButton({ active, label, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick,
		className: cn("h-11 shrink-0 border-b-2 px-2 text-sm", active ? "border-ink text-ink" : "border-transparent text-mute"),
		children: label
	});
}
function Toggle({ on, onClick, label }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick,
		className: cn("h-11 w-full text-sm", on ? "bg-stamp text-paper" : "border border-line"),
		children: label
	});
}
function ReceiptSheet() {
	const receiptId = useCafe((state) => state.receiptId);
	const openReceipt = useCafe((state) => state.openReceipt);
	const order = useCafe((state) => state.orders.find((entry) => entry.id === receiptId));
	const customer = useCafe((state) => state.customers.find((entry) => entry.id === order?.customerId));
	const settings = useCafe((state) => state.settings);
	const logSms = useCafe((state) => state.logSms);
	const [busy, setBusy] = (0, import_react.useState)(false);
	const lang = settings.lang;
	if (!order) return null;
	const doc = buildReceiptDoc(order, customer, settings);
	const sms = async () => {
		if (!customer) {
			toast(tx(lang, "این فیش مهمان ندارد", "This ticket has no guest"));
			return;
		}
		if (!customer.smsOptIn) {
			toast(tx(lang, "پیامک این مهمان خاموش است", "This guest opted out"));
			return;
		}
		setBusy(true);
		const lines = order.lines.map((line) => `${line.qty}× ${lang === "fa" ? line.nameFa : line.nameEn}`).join("\n");
		const text = `COMO\n${doc.number}\n${lines}\n${doc.totalLabel}: ${doc.total}\n${doc.pause}\n${settings.instagram}`;
		const outcome = await sendOut({
			apiKey: settings.smsApiKey,
			line: settings.smsLine,
			kind: "receipt",
			messages: [{
				mobile: customer.phone,
				text
			}]
		});
		logSms({
			to: outcome.to,
			body: outcome.body,
			kind: "receipt",
			status: outcome.status,
			detail: outcome.detail
		});
		setBusy(false);
		toast(outcome.status === "failed" ? outcome.detail : tx(lang, "فیش برای پیامک ثبت شد", "Receipt queued"));
	};
	const serial = async () => {
		setBusy(true);
		try {
			await sendToPrinter(await receiptBytes(doc, settings.paper, order.pay === "cash"), settings.baud);
			toast(tx(lang, "به چاپگر حرارتی رفت", "Sent to the thermal printer"));
		} catch (error) {
			toast(error instanceof Error ? error.message : "printer");
		} finally {
			setBusy(false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 flex items-end justify-center bg-ink/40 sm:items-center",
		onClick: () => openReceipt(null),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex max-h-screen w-full max-w-md flex-col bg-paper",
			onClick: (event) => event.stopPropagation(),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-h-0 flex-1 overflow-auto p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
					id: "thermal-root",
					dir: doc.dir,
					className: "mx-auto w-full max-w-xs border border-line bg-sheet px-4 py-5 text-ink",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-center font-display text-4xl tracking-widest",
							children: "COMO"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-center text-xs tracking-widest text-mute",
							children: doc.kicker
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-center text-sm",
							children: doc.address
						}),
						doc.phone ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-center text-sm",
							children: doc.phone
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-center text-sm text-mute",
							children: doc.instagram
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "my-3 border-t border-dashed border-ink" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: doc.number }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: doc.when })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "my-3 border-t border-dashed border-ink" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "space-y-2",
							children: doc.lines.map((line) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-start justify-between gap-3 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block font-medium",
									children: line.title
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs text-mute",
									children: line.sub
								})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "shrink-0",
									children: line.amount
								})]
							}, `${line.title}-${line.amount}`))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "my-3 border-t border-dashed border-ink" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "space-y-1 text-sm",
							children: doc.rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-mute",
									children: row.label
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: row.value })]
							}, row.label))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-3 flex justify-between text-base font-medium",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: doc.totalLabel }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: doc.total })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-sm",
							children: doc.pay
						}),
						doc.note ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-sm text-ink-soft",
							children: doc.note
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "my-3 border-t border-dashed border-ink" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm",
							children: doc.loyalty
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-3 text-center font-display text-lg italic",
							children: doc.pause
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-center text-xs tracking-widest text-mute",
							children: "EST. 2026"
						})
					]
				}), !serialAvailable() ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-xs text-mute",
					children: tx(lang, "چاپ سریال فقط در Chrome است. چاپ حرارتی از درایور سیستم همیشه‌کار است.", "Serial print is Chrome-only. The print button uses the system thermal driver.")
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-xs text-mute",
					children: tx(lang, "پرداخت نقد، پالس کشو را هم می‌فرستد.", "Cash also pulses the drawer.")
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 gap-2 border-t border-line p-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
						onClick: () => printReceipt(doc, settings.paper),
						children: tx(lang, "چاپ حرارتی", "Print")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
						tone: "line",
						disabled: busy || !serialAvailable(),
						onClick: () => void serial(),
						children: tx(lang, "پورت سریال", "Serial")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
						tone: "line",
						disabled: busy,
						onClick: () => {
							receiptBytes(doc, settings.paper, order.pay === "cash").then((bytes) => downloadBytes(bytes, `como-${order.number}.bin`));
						},
						children: "ESC/POS"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
						tone: "line",
						disabled: busy,
						onClick: () => void sms(),
						children: tx(lang, "پیامک فیش", "SMS")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
						tone: "ghost",
						className: "col-span-2",
						onClick: () => openReceipt(null),
						children: tx(lang, "بستن", "Close")
					})
				]
			})]
		})
	});
}
function Tickets() {
	const lang = useCafe((state) => state.settings.lang);
	const orders = useCafe((state) => state.orders);
	const openReceipt = useCafe((state) => state.openReceipt);
	const [query, setQuery] = (0, import_react.useState)("");
	const q = query.trim();
	const list = orders.filter((order) => {
		if (!q) return true;
		return String(order.number).includes(q) || (order.guestName ?? "").includes(q) || order.lines.some((line) => line.nameFa.includes(q) || line.nameEn.toLowerCase().includes(q.toLowerCase()));
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
			className: "text-2xl font-medium",
			children: tx(lang, "فیش‌ها", "Tickets")
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			className: "mt-4 h-12 w-full max-w-md border border-line bg-sheet px-3 text-base outline-none focus:border-ink",
			placeholder: tx(lang, "شماره، نام، نوشیدنی", "Number, name, drink"),
			value: query,
			onChange: (event) => setQuery(event.target.value)
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
			className: "mt-4 divide-y divide-line border-y border-line",
			children: list.slice(0, 80).map((order) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => openReceipt(order.id),
				className: "flex w-full items-start justify-between gap-3 py-3 text-start",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "block font-medium",
						children: ["#", order.number]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-xs text-mute",
						children: [formatWhen(order.at, lang), order.guestName ? ` · ${order.guestName}` : ""]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "mt-1 block text-sm text-ink-soft",
						children: order.lines.map((line) => `${line.qty}× ${lang === "fa" ? line.nameFa : line.nameEn}`).join(tx(lang, "، ", ", "))
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "shrink-0 text-sm",
					children: formatToman(order.total, lang)
				})]
			}) }, order.id))
		})
	] });
}
function Wire() {
	const settings = useCafe((state) => state.settings);
	const customers = useCafe((state) => state.customers);
	const logs = useCafe((state) => state.smsLogs);
	const credit = useCafe((state) => state.credit);
	const patchSettings = useCafe((state) => state.patchSettings);
	const logSms = useCafe((state) => state.logSms);
	const setCredit = useCafe((state) => state.setCredit);
	const lang = settings.lang;
	const [segment, setSegment] = (0, import_react.useState)("quiet");
	const [draft, setDraft] = (0, import_react.useState)(lang === "fa" ? "{name} عزیز، چند وقتی است مکث نکردی. ساعت ۲ تا ۴ امتیازت در کومو دو برابر است." : "{name}, it has been a while. Points double at COMO between 2 and 4.");
	const [templateId, setTemplateId] = (0, import_react.useState)("");
	const [paramName, setParamName] = (0, import_react.useState)("CODE");
	const [paramValue, setParamValue] = (0, import_react.useState)("1234");
	const [verifyMobile, setVerifyMobile] = (0, import_react.useState)("09120000001");
	const [busy, setBusy] = (0, import_react.useState)(false);
	const pool = customers.filter((guest) => {
		if (!guest.smsOptIn) return false;
		if (segment === "quiet") return quietDays(guest.lastVisit) >= 21;
		if (segment === "birthday") return birthdaySoon(guest.birthday);
		if (segment === "inner") return tierOf(guest.spent) === "inner" || tierOf(guest.spent) === "como";
		return true;
	});
	const checkCredit = async () => {
		if (!settings.smsApiKey.trim()) {
			toast(tx(lang, "اول کلید را بگذار", "Add the API key first"));
			return;
		}
		setBusy(true);
		const result = await smsCall({ data: {
			op: "credit",
			apiKey: settings.smsApiKey.trim()
		} });
		setBusy(false);
		if (result.ok && result.balance !== null) {
			setCredit(result.balance);
			toast(tx(lang, `اعتبار ${result.balance}`, `Credit ${result.balance}`));
		} else toast(result.message);
	};
	const blast = async () => {
		setBusy(true);
		const outcome = await sendOut({
			apiKey: settings.smsApiKey,
			line: settings.smsLine,
			kind: segment === "birthday" ? "birthday" : "campaign",
			messages: pool.map((guest) => ({
				mobile: guest.phone,
				text: draft.replaceAll("{name}", guest.name)
			}))
		});
		logSms({
			to: outcome.to,
			body: outcome.body,
			kind: outcome.kind,
			status: outcome.status,
			detail: outcome.detail
		});
		setBusy(false);
		toast(outcome.status === "failed" ? outcome.detail : tx(lang, `${outcome.to.length} پیام ثبت شد`, `${outcome.to.length} kept`));
	};
	const verify = async () => {
		if (!settings.smsApiKey.trim()) {
			toast(tx(lang, "بدون کلید، الگو واقعاً نمی‌رود", "A template needs the API key"));
			return;
		}
		setBusy(true);
		const result = await smsCall({ data: {
			op: "verify",
			apiKey: settings.smsApiKey.trim(),
			mobile: verifyMobile,
			templateId: Number(templateId),
			parameters: [{
				name: paramName,
				value: paramValue
			}]
		} });
		logSms({
			to: [verifyMobile],
			body: `${paramName}=${paramValue}`,
			kind: "loyalty",
			status: result.ok ? "sent" : "failed",
			detail: result.message
		});
		setBusy(false);
		toast(result.message);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "max-w-3xl",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-medium",
				children: tx(lang, "پیامک", "SMS")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-ink-soft",
				children: tx(lang, "ارسال از سرور میز به api.sms.ir می‌رود تا مرورگر گیر CORS نماند. هدر X-API-KEY است.", "The desk sends through its server to api.sms.ir so the browser is not blocked by CORS. The header is X-API-KEY.")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: "mt-3 space-y-1 text-xs text-mute",
				dir: "ltr",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "GET /v1/credit" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "POST /v1/send/bulk · lineNumber, messageText, mobiles" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "POST /v1/send/likeTolike · lineNumber, messageTexts, mobiles" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "POST /v1/send/verify · mobile, templateId, parameters" })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 grid gap-3 border border-line bg-sheet p-4 md:grid-cols-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: tx(lang, "کلید API", "API key"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							dir: "ltr",
							className: fieldClass,
							type: "password",
							autoComplete: "off",
							value: settings.smsApiKey,
							onChange: (event) => patchSettings({ smsApiKey: event.target.value })
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: tx(lang, "شماره خط", "Line number"),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							dir: "ltr",
							className: fieldClass,
							value: settings.smsLine,
							onChange: (event) => patchSettings({ smsLine: event.target.value })
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "md:col-span-2 flex flex-wrap items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
							tone: "line",
							disabled: busy,
							onClick: () => void checkCredit(),
							children: tx(lang, "اعتبار", "Credit")
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm text-mute",
							children: credit ? tx(lang, `${credit.value} تا ${formatWhen(credit.at, lang)}`, `${credit.value} at ${formatWhen(credit.at, lang)}`) : tx(lang, "هنوز پرسیده نشده", "Not checked")
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-mute md:col-span-2",
						children: tx(lang, "بدون کلید، پیام‌ها در حالت تمرین در دفترچه می‌مانند و به SMS.ir نمی‌روند.", "With no key, messages stay in the practice log and never reach SMS.ir.")
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-8 text-lg font-medium",
				children: tx(lang, "جمع", "A round")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 flex flex-wrap gap-1",
				children: [
					["quiet", tx(lang, "خاموش ۲۱ روز", "Quiet 21 days")],
					["birthday", tx(lang, "تولد این هفته", "Birthday week")],
					["inner", tx(lang, "کومو و حلقه", "Como & inner")],
					["opt", tx(lang, "همه مجازها", "Everyone opted in")]
				].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => setSegment(id),
					className: `h-11 px-3 text-sm ${segment === id ? "bg-ink text-paper" : "border border-line"}`,
					children: label
				}, id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 text-xs text-mute",
				children: [
					pool.length,
					" ",
					tx(lang, "نفر · {name} اسم می‌شود", "people · {name} becomes the name")
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
				className: "mt-2 h-28 w-full border border-line bg-sheet p-3 text-base outline-none focus:border-ink",
				value: draft,
				onChange: (event) => setDraft(event.target.value)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
				className: "mt-2",
				disabled: busy || pool.length === 0,
				onClick: () => void blast(),
				children: tx(lang, "بفرست", "Send")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-8 text-lg font-medium",
				children: tx(lang, "قالب تأیید", "Verify template")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs text-mute",
				children: tx(lang, "شناسه قالب باید در پنل SMS.ir تأیید شده باشد. نام پارامتر همان نام داخل قالب است.", "The template id must already be approved in SMS.ir. The parameter name has to match the template.")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 grid gap-2 md:grid-cols-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						dir: "ltr",
						className: fieldClass,
						placeholder: "templateId",
						value: templateId,
						onChange: (event) => setTemplateId(event.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						dir: "ltr",
						className: fieldClass,
						placeholder: "09",
						value: verifyMobile,
						onChange: (event) => setVerifyMobile(event.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						dir: "ltr",
						className: fieldClass,
						value: paramName,
						onChange: (event) => setParamName(event.target.value)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						dir: "ltr",
						className: fieldClass,
						value: paramValue,
						onChange: (event) => setParamValue(event.target.value)
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Btn, {
				className: "mt-2",
				tone: "line",
				disabled: busy,
				onClick: () => void verify(),
				children: tx(lang, "ارسال الگو", "Send template")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-8 text-lg font-medium",
				children: tx(lang, "دفترچه", "Log")
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
				className: "mt-2 divide-y divide-line border-y border-line text-sm",
				children: [logs.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
					className: "py-3 text-mute",
					children: tx(lang, "هنوز پیامی نرفته.", "Nothing sent yet.")
				}) : null, logs.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "py-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-xs text-mute",
							children: [
								formatWhen(entry.at, lang),
								" · ",
								entry.status,
								" · ",
								entry.kind
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 whitespace-pre-wrap",
							children: entry.body
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-mute",
							children: entry.detail
						})
					]
				}, entry.id))]
			})
		]
	});
}
var VIEWS = [
	{
		id: "desk",
		icon: Coffee,
		fa: "صندوق",
		en: "Desk"
	},
	{
		id: "tickets",
		icon: ScrollText,
		fa: "فیش",
		en: "Tickets"
	},
	{
		id: "cellar",
		icon: Package,
		fa: "انبار",
		en: "Cellar"
	},
	{
		id: "books",
		icon: BookOpen,
		fa: "دفتر",
		en: "Books"
	},
	{
		id: "guests",
		icon: Users,
		fa: "مهمان",
		en: "Guests"
	},
	{
		id: "wire",
		icon: MessageSquare,
		fa: "پیامک",
		en: "SMS"
	},
	{
		id: "house",
		icon: Settings,
		fa: "خانه",
		en: "House"
	}
];
function Desk() {
	const [view, setView] = (0, import_react.useState)("desk");
	const [now, setNow] = (0, import_react.useState)(() => Date.now());
	const lang = useCafe((state) => state.settings.lang);
	const settings = useCafe((state) => state.settings);
	const orders = useCafe((state) => state.orders);
	const stock = useCafe((state) => state.stock);
	const customers = useCafe((state) => state.customers);
	const patchSettings = useCafe((state) => state.patchSettings);
	(0, import_react.useEffect)(() => {
		document.documentElement.lang = lang === "fa" ? "fa" : "en";
		document.documentElement.dir = lang === "fa" ? "rtl" : "ltr";
	}, [lang]);
	(0, import_react.useEffect)(() => {
		const timer = window.setInterval(() => setNow(Date.now()), 3e4);
		return () => window.clearInterval(timer);
	}, []);
	const today = orders.filter((order) => order.at >= startOfDay(now)).reduce((sum, order) => sum + order.total, 0);
	const low = stock.some((item) => item.onHand < item.par);
	const birthdays = customers.some((guest) => birthdaySoon(guest.birthday));
	const slow = inSlowHour(now, settings.slowStart, settings.slowEnd);
	const clock = new Intl.DateTimeFormat(lang === "fa" ? "fa-IR" : "en-GB", {
		hour: "2-digit",
		minute: "2-digit"
	}).format(now);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-paper text-ink md:flex",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
				className: "hidden w-60 shrink-0 flex-col border-e border-line bg-sheet md:flex",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start gap-3 px-4 py-5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ComoMark, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-2xl leading-none",
							children: "COMO"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 text-xs tracking-widest text-mute",
							children: "EST. 2026"
						})] })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "px-4 text-xs text-mute",
						children: tx(lang, settings.addressFa, settings.addressEn)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-3 px-4 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-mute",
							children: tx(lang, "امروز", "Today")
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "ms-2 font-medium",
							children: formatCompact(today, lang)
						})]
					}),
					slow ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mx-4 mt-3 border border-ink px-2 py-1 text-xs",
						children: tx(lang, "ساعت آرام · امتیاز دو برابر", "Slow hour · double points")
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
						className: "mt-4 flex flex-1 flex-col gap-1 px-2",
						children: VIEWS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NavButton, {
							active: view === item.id,
							label: tx(lang, item.fa, item.en),
							icon: item.icon,
							alert: item.id === "cellar" && low || item.id === "guests" && birthdays,
							onClick: () => setView(item.id)
						}, item.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "border-t border-line p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LangToggle, {
							lang,
							onChange: (next) => patchSettings({ lang: next })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-4 text-xs tracking-widest text-mute",
							children: "COFFEE. PEOPLE. MOMENTS."
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "min-w-0 flex-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
						className: "sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-line bg-paper px-4 py-3 md:hidden",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ComoMark, { className: "h-10 w-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-medium leading-none",
								children: "COMO"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-mute",
								children: clock
							})] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LangToggle, {
							lang,
							onChange: (next) => patchSettings({ lang: next })
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "hidden items-center justify-between border-b border-line px-6 py-3 md:flex",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-lg italic",
							children: tx(lang, "قهوه فقط یک نوشیدنی نیست. یک مکث است.", "Coffee isn't just a drink. It's a pause.")
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-mute",
							children: clock
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
						className: "px-4 py-4 pb-24 md:px-6 md:pb-8",
						children: [
							view === "desk" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pos, {}) : null,
							view === "tickets" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tickets, {}) : null,
							view === "cellar" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cellar, {}) : null,
							view === "books" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Books, {}) : null,
							view === "guests" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Guests, {}) : null,
							view === "wire" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wire, {}) : null,
							view === "house" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(House, {}) : null
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
				className: "fixed inset-x-0 bottom-0 z-40 flex border-t border-line bg-sheet md:hidden",
				children: VIEWS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => setView(item.id),
					className: cn("relative flex h-16 flex-1 flex-col items-center justify-center gap-1 text-xs", view === item.id ? "text-ink" : "text-mute"),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(item.icon, {
							className: "size-5",
							strokeWidth: 1.5
						}),
						tx(lang, item.fa, item.en),
						item.id === "cellar" && low || item.id === "guests" && birthdays ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "absolute top-2 size-1.5 rounded-full bg-stamp" }) : null
					]
				}, item.id))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReceiptSheet, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
				position: "top-center",
				toastOptions: { style: {
					background: "var(--color-ink)",
					color: "var(--color-paper)",
					border: "none",
					borderRadius: 2
				} }
			})
		]
	});
}
function NavButton({ active, label, icon: Icon, alert, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick,
		"aria-current": active ? "page" : void 0,
		className: cn("flex h-11 items-center gap-3 px-3 text-sm", active ? "bg-ink text-paper" : "text-ink-soft"),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
				className: "size-4",
				strokeWidth: 1.5
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "flex-1 text-start",
				children: label
			}),
			alert ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("size-1.5 rounded-full", active ? "bg-paper" : "bg-stamp") }) : null
		]
	});
}
function LangToggle({ lang, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex border border-line",
		children: ["fa", "en"].map((code) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: () => onChange(code),
			className: cn("h-10 px-3 text-xs", lang === code ? "bg-ink text-paper" : "bg-sheet text-mute"),
			children: code === "fa" ? "فا" : "EN"
		}, code))
	});
}
function Home() {
	const [ready, setReady] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (useCafe.persist.hasHydrated()) {
			setReady(true);
			return;
		}
		return useCafe.persist.onFinishHydration(() => setReady(true));
	}, []);
	if (!ready) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Boot, {});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Desk, {});
}
function Boot() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "flex min-h-screen flex-col justify-between bg-paper px-6 py-8 text-ink",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ComoMark, { className: "h-24 w-9" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-6 font-display text-4xl tracking-wide",
					children: "COMO"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-mute",
					children: "Est. 2026 · Bandar Abbas"
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "max-w-xs font-display text-2xl italic leading-snug",
				children: "Coffee isn't just a drink. It's a pause."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs tracking-widest text-mute",
				children: "COFFEE. PEOPLE. MOMENTS."
			})
		]
	});
}
//#endregion
export { Home as component };
