import type { CategoryId, MenuItem, Mod, RecipeUse, StockItem } from "./types";

export const CATEGORIES: { id: CategoryId; fa: string; en: string }[] = [
  { id: "hot-coffee", fa: "قهوه گرم", en: "Hot coffee" },
  { id: "iced-coffee", fa: "قهوه سرد", en: "Iced coffee" },
  { id: "brew", fa: "دم‌آوری", en: "Brew bar" },
  { id: "hot-drinks", fa: "نوشیدنی گرم", en: "Hot drinks" },
  { id: "mocktail", fa: "موکتیل", en: "Mocktail" },
];

const pair = (sku: string, qty: number): [string, number] => [sku, qty];
const H = pair("cup-h", 1);
const C = pair("cup-c", 1);
const L = pair("lid", 1);
const N = pair("napkin", 1);
const B = pair("beans", 18);
const ICE = (g: number) => pair("ice", g);

type Draft = {
  id: string;
  category: CategoryId;
  nameEn: string;
  nameFa: string;
  price: number;
  recipe: [string, number][];
};

function item(draft: Draft): MenuItem {
  return {
    ...draft,
    active: true,
    recipe: draft.recipe.map(([sku, qty]) => ({ sku, qty })),
  };
}

const K = 1000;

export const MENU: MenuItem[] = [
  item({ id: "espresso", category: "hot-coffee", nameEn: "Espresso", nameFa: "اسپرسو", price: 225 * K, recipe: [B, H, N] }),
  item({ id: "americano", category: "hot-coffee", nameEn: "Americano", nameFa: "امریکانو", price: 245 * K, recipe: [B, H, N] }),
  item({ id: "latte", category: "hot-coffee", nameEn: "Latte", nameFa: "لاته", price: 270 * K, recipe: [B, pair("milk", 180), H, N] }),
  item({ id: "latte-syrup", category: "hot-coffee", nameEn: "Latte + syrup", nameFa: "لاته سیروپ", price: 310 * K, recipe: [B, pair("milk", 170), pair("syrup", 20), H, N] }),
  item({ id: "cortado", category: "hot-coffee", nameEn: "Cortado", nameFa: "کورتادو", price: 280 * K, recipe: [B, pair("milk", 60), H, N] }),
  item({ id: "cappuccino", category: "hot-coffee", nameEn: "Cappuccino", nameFa: "کاپوچینو", price: 285 * K, recipe: [B, pair("milk", 120), H, N] }),

  item({ id: "freddo", category: "iced-coffee", nameEn: "Freddo", nameFa: "فردو", price: 260 * K, recipe: [B, pair("milk", 90), ICE(80), C, L, N] }),
  item({ id: "brown-sugar", category: "iced-coffee", nameEn: "Brown sugar", nameFa: "براون شوگر", price: 280 * K, recipe: [B, pair("milk", 150), pair("brown", 25), ICE(70), C, L, N] }),
  item({ id: "spanish-latte", category: "iced-coffee", nameEn: "Spanish latte", nameFa: "اسپنیش لاته", price: 390 * K, recipe: [B, pair("milk", 140), pair("condensed", 30), ICE(60), C, L, N] }),
  item({ id: "blue-espresso", category: "iced-coffee", nameEn: "Blue espresso", nameFa: "بلو اسپرسو", price: 335 * K, recipe: [B, pair("milk", 50), pair("blue", 25), ICE(70), C, L, N] }),
  item({ id: "mont-blanc", category: "iced-coffee", nameEn: "Mont blanc", nameFa: "مون بلان", price: 390 * K, recipe: [B, pair("milk", 100), pair("cream", 40), pair("choc", 12), ICE(40), C, L, N] }),
  item({ id: "apple-milk", category: "iced-coffee", nameEn: "Apple milk washed", nameFa: "اپل میلک واشد", price: 450 * K, recipe: [B, pair("milk", 110), pair("apple", 40), ICE(50), C, L, N] }),
  item({ id: "iced-americano", category: "iced-coffee", nameEn: "Americano", nameFa: "امریکانو", price: 260 * K, recipe: [B, ICE(100), C, L, N] }),
  item({ id: "iced-latte", category: "iced-coffee", nameEn: "Latte", nameFa: "لاته", price: 310 * K, recipe: [B, pair("milk", 180), ICE(70), C, L, N] }),
  item({ id: "iced-latte-syrup", category: "iced-coffee", nameEn: "Latte + syrup", nameFa: "لاته سیروپ", price: 335 * K, recipe: [B, pair("milk", 160), pair("syrup", 20), ICE(70), C, L, N] }),
  item({ id: "nut-queen", category: "iced-coffee", nameEn: "Nut queen", nameFa: "نات کوئین", price: 380 * K, recipe: [B, pair("milk", 140), pair("hazelnut", 20), ICE(50), C, L, N] }),
  item({ id: "espresso-martini", category: "iced-coffee", nameEn: "Espresso martini", nameFa: "اسپرسو مارتینی", price: 290 * K, recipe: [pair("beans", 36), pair("syrup", 15), ICE(80), C, L, N] }),

  item({ id: "cold-brew", category: "brew", nameEn: "Cold brew", nameFa: "کلد برو", price: 290 * K, recipe: [pair("cb", 140), ICE(40), C, L, N] }),
  item({ id: "cold-brew-raspberry", category: "brew", nameEn: "Cold brew + raspberry", nameFa: "کلد برو رزبری", price: 330 * K, recipe: [pair("cb", 120), pair("rasp", 30), ICE(40), C, L, N] }),
  item({ id: "cold-brew-soda", category: "brew", nameEn: "Cold brew + soda lemon", nameFa: "کلد برو سودا لیمو", price: 330 * K, recipe: [pair("cb", 100), pair("soda", 80), pair("lemon", 15), ICE(40), C, L, N] }),
  item({ id: "v60", category: "brew", nameEn: "V60", nameFa: "وی ۶۰", price: 385 * K, recipe: [pair("beans", 22), pair("f-v60", 1), H, N] }),
  item({ id: "chemex", category: "brew", nameEn: "Chemex", nameFa: "کمکس", price: 450 * K, recipe: [pair("beans", 32), pair("f-chem", 1), H, N] }),
  item({ id: "agave-brew", category: "brew", nameEn: "Agave brew", nameFa: "آگاوه برو", price: 400 * K, recipe: [pair("beans", 20), pair("agave", 15), H, N] }),
  item({ id: "mocha-cold-brew", category: "brew", nameEn: "Mocha cold brew", nameFa: "موکا کلد برو", price: 390 * K, recipe: [pair("cb", 110), pair("milk", 60), pair("choc", 18), ICE(40), C, L, N] }),

  item({ id: "tea", category: "hot-drinks", nameEn: "Tea", nameFa: "چای", price: 210 * K, recipe: [pair("tea", 1), pair("sugar", 8), H, N] }),
  item({ id: "hot-chocolate", category: "hot-drinks", nameEn: "Hot chocolate", nameFa: "هات چاکلت", price: 260 * K, recipe: [pair("cocoa", 18), pair("milk", 200), H, N] }),
  item({ id: "karak", category: "hot-drinks", nameEn: "Karak", nameFa: "کرک", price: 220 * K, recipe: [pair("tea", 1), pair("milk", 160), pair("spice", 4), pair("sugar", 10), H, N] }),
  item({ id: "masala", category: "hot-drinks", nameEn: "Masala", nameFa: "ماسالا", price: 220 * K, recipe: [pair("tea", 1), pair("milk", 160), pair("spice", 6), H, N] }),
  item({ id: "chocolate-raspberry", category: "hot-drinks", nameEn: "Chocolate raspberry", nameFa: "چاکلت رزبری", price: 270 * K, recipe: [pair("cocoa", 16), pair("milk", 160), pair("rasp", 20), H, N] }),

  item({ id: "tequilaina", category: "mocktail", nameEn: "Tequilaina", nameFa: "تکیلانینا", price: 340 * K, recipe: [pair("lime", 30), pair("soda", 140), pair("agave", 15), pair("salt", 1), ICE(80), C, L, N] }),
  item({ id: "como-salty", category: "mocktail", nameEn: "Como salty", nameFa: "کومو سالتی", price: 350 * K, recipe: [pair("lime", 25), pair("soda", 150), pair("salt", 2), ICE(70), C, L, N] }),
  item({ id: "maldive", category: "mocktail", nameEn: "Maldive", nameFa: "مالدیو", price: 310 * K, recipe: [pair("coconut", 80), pair("soda", 80), pair("lime", 15), ICE(70), C, L, N] }),
  item({ id: "redemption", category: "mocktail", nameEn: "Redemption", nameFa: "ردمپشن", price: 330 * K, recipe: [pair("berry", 60), pair("lime", 20), pair("soda", 80), ICE(60), C, L, N] }),
  item({ id: "lemonade", category: "mocktail", nameEn: "Lemonade", nameFa: "لیموناد", price: 290 * K, recipe: [pair("lemon", 40), pair("sugar", 18), pair("soda", 120), ICE(70), C, L, N] }),
  item({ id: "namir-soon", category: "mocktail", nameEn: "Namir soon", nameFa: "نامیر سون", price: 330 * K, recipe: [pair("orange", 80), pair("berry", 30), pair("soda", 60), ICE(60), C, L, N] }),
  item({ id: "brando", category: "mocktail", nameEn: "Brando", nameFa: "برندو", price: 310 * K, recipe: [pair("orange", 50), pair("cb", 60), pair("agave", 10), ICE(50), C, L, N] }),
];

export const INGREDIENTS: StockItem[] = [
  { sku: "beans", nameFa: "دانه اسپرسو", nameEn: "Espresso beans", unit: "g", onHand: 4800, par: 2000, cost: 2200 },
  { sku: "milk", nameFa: "شیر", nameEn: "Milk", unit: "ml", onHand: 18000, par: 8000, cost: 55 },
  { sku: "oat", nameFa: "شیر جو", nameEn: "Oat milk", unit: "ml", onHand: 2400, par: 1000, cost: 180 },
  { sku: "syrup", nameFa: "سیروپ", nameEn: "Syrup", unit: "ml", onHand: 900, par: 400, cost: 380 },
  { sku: "brown", nameFa: "سیروپ براون شوگر", nameEn: "Brown sugar syrup", unit: "ml", onHand: 70, par: 300, cost: 420 },
  { sku: "blue", nameFa: "سیروپ بلو", nameEn: "Blue syrup", unit: "ml", onHand: 30, par: 250, cost: 520 },
  { sku: "condensed", nameFa: "شیر عسلی", nameEn: "Condensed milk", unit: "ml", onHand: 700, par: 300, cost: 480 },
  { sku: "cream", nameFa: "خامه", nameEn: "Cream", unit: "ml", onHand: 800, par: 300, cost: 180 },
  { sku: "choc", nameFa: "شکلات", nameEn: "Chocolate", unit: "g", onHand: 900, par: 400, cost: 650 },
  { sku: "cocoa", nameFa: "کاکائو", nameEn: "Cocoa", unit: "g", onHand: 700, par: 250, cost: 500 },
  { sku: "apple", nameFa: "پوره سیب", nameEn: "Apple puree", unit: "ml", onHand: 500, par: 200, cost: 320 },
  { sku: "hazelnut", nameFa: "فندق", nameEn: "Hazelnut", unit: "ml", onHand: 350, par: 200, cost: 540 },
  { sku: "cb", nameFa: "کنسانتره کلدبرو", nameEn: "Cold brew concentrate", unit: "ml", onHand: 3200, par: 1500, cost: 700 },
  { sku: "rasp", nameFa: "رزبری", nameEn: "Raspberry", unit: "ml", onHand: 600, par: 250, cost: 450 },
  { sku: "soda", nameFa: "سودا", nameEn: "Soda", unit: "ml", onHand: 4000, par: 1500, cost: 70 },
  { sku: "lemon", nameFa: "لیمو", nameEn: "Lemon", unit: "ml", onHand: 900, par: 400, cost: 180 },
  { sku: "lime", nameFa: "لایم", nameEn: "Lime", unit: "ml", onHand: 500, par: 200, cost: 220 },
  { sku: "agave", nameFa: "آگاوه", nameEn: "Agave", unit: "ml", onHand: 400, par: 150, cost: 620 },
  { sku: "coconut", nameFa: "نارگیل", nameEn: "Coconut", unit: "ml", onHand: 700, par: 200, cost: 380 },
  { sku: "berry", nameFa: "توت", nameEn: "Berry", unit: "ml", onHand: 450, par: 200, cost: 400 },
  { sku: "orange", nameFa: "پرتقال", nameEn: "Orange", unit: "ml", onHand: 600, par: 200, cost: 250 },
  { sku: "sugar", nameFa: "شکر", nameEn: "Sugar", unit: "g", onHand: 2000, par: 500, cost: 30 },
  { sku: "salt", nameFa: "نمک", nameEn: "Salt", unit: "g", onHand: 400, par: 50, cost: 15 },
  { sku: "spice", nameFa: "ادویه کرک و ماسالا", nameEn: "Karak spice", unit: "g", onHand: 180, par: 60, cost: 1800 },
  { sku: "tea", nameFa: "چای کیسه‌ای", nameEn: "Tea bag", unit: "pcs", onHand: 80, par: 40, cost: 9000 },
  { sku: "ice", nameFa: "یخ", nameEn: "Ice", unit: "g", onHand: 15000, par: 5000, cost: 8 },
  { sku: "cup-h", nameFa: "لیوان گرم", nameEn: "Hot cup", unit: "pcs", onHand: 180, par: 80, cost: 7000 },
  { sku: "cup-c", nameFa: "لیوان سرد", nameEn: "Cold cup", unit: "pcs", onHand: 36, par: 80, cost: 8500 },
  { sku: "lid", nameFa: "درب", nameEn: "Lid", unit: "pcs", onHand: 220, par: 100, cost: 2000 },
  { sku: "f-v60", nameFa: "فیلتر وی۶۰", nameEn: "V60 filter", unit: "pcs", onHand: 14, par: 30, cost: 3500 },
  { sku: "f-chem", nameFa: "فیلتر کمکس", nameEn: "Chemex filter", unit: "pcs", onHand: 18, par: 12, cost: 7000 },
  { sku: "napkin", nameFa: "دستمال", nameEn: "Napkin", unit: "pcs", onHand: 300, par: 100, cost: 400 },
];

export const MODS: Mod[] = [
  { id: "shot", nameFa: "شات اضافه", nameEn: "Extra shot", price: 40 * K, recipe: [{ sku: "beans", qty: 9 }] },
  { id: "syrup", nameFa: "سیروپ", nameEn: "Syrup", price: 25 * K, recipe: [{ sku: "syrup", qty: 15 }] },
  { id: "oat", nameFa: "شیر جو", nameEn: "Oat milk", price: 30 * K, recipe: [{ sku: "oat", qty: 160 }] },
];

export function recipeCost(recipe: RecipeUse[], costOf: (sku: string) => number) {
  let total = 0;
  for (const use of recipe) total += costOf(use.sku) * use.qty;
  return Math.round(total);
}
