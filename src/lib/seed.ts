import { INGREDIENTS, MENU, recipeCost } from "./catalog.ts";
import { earnedPoints } from "./loyalty.ts";
import type { Customer, DeskData, Order, OrderLine, Pay, Settings } from "./types.ts";

export function defaultSettings(): Settings {
  return {
    lang: "fa",
    addressFa: "کوچه هفتم، خیابان طلوع، بندرعباس",
    addressEn: "7th Alley of Tolou St., Bandar Abbas",
    phone: "",
    instagram: "@como.coffee",
    pointsPer: 10_000,
    pointValue: 500,
    stampGoal: 8,
    compCap: 310_000,
    slowStart: 14,
    slowEnd: 16,
    referralBonus: 50,
    float: 5_000_000,
    smsApiKey: "",
    smsLine: "",
    pecPin: "",
    pecCallbackUrl: "",
    posType: "LAN",
    posIp: "",
    posPort: 7020,
    posComPort: "",
    paper: 80,
    baud: 9600,
    autoPrint: false,
    autoSms: false,
    expenseCustomLabel: "",
  };
}

function atDays(daysAgo: number, hour: number, minute: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, minute, 0, 0);
  return date.getTime();
}

function isoShift(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

const ROTATION = [
  ["latte", "espresso"],
  ["spanish-latte"],
  ["cappuccino", "tea"],
  ["cold-brew", "karak"],
  ["v60"],
  ["iced-latte", "lemonade"],
  ["mont-blanc"],
  ["chemex", "masala"],
  ["nut-queen"],
  ["como-salty", "americano"],
];

const PAYS: Pay[] = ["card", "cash", "card", "online", "cash", "card"];

function buildOrders(settings: Settings): Order[] {
  const costOf = (sku: string) => INGREDIENTS.find((item) => item.sku === sku)?.cost ?? 0;
  const drafts: Order[] = [];
  let nazaninUsed = false;
  const who = [
    undefined,
    "c-sara",
    "c-ali",
    undefined,
    "c-reza",
    "c-nazanin",
    "c-kamran",
    "c-sara",
    undefined,
    "c-ali",
  ];

  for (let day = 13; day >= 0; day -= 1) {
    for (let slot = 0; slot < 6; slot += 1) {
      const hour = 9 + ((slot * 2) % 11);
      const at = atDays(day, hour, (day * 5 + slot * 7) % 60);
      if (at > Date.now() - 60_000) continue;
      const ids = ROTATION[(day + slot) % ROTATION.length] ?? ["latte"];
      let customerId = who[(day * 3 + slot) % who.length];
      if (customerId === "c-nazanin") {
        if (nazaninUsed || day > 1) customerId = undefined;
        else nazaninUsed = true;
      }
      const lines: OrderLine[] = ids.map((id) => {
        const item = MENU.find((entry) => entry.id === id) ?? MENU[0]!;
        return {
          itemId: item.id,
          nameFa: item.nameFa,
          nameEn: item.nameEn,
          qty: slot % 5 === 0 ? 2 : 1,
          unitPrice: item.price,
          unitCogs: recipeCost(item.recipe, costOf),
          mods: [],
        };
      });
      const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.qty, 0);
      const cogs = lines.reduce((sum, line) => sum + line.unitCogs * line.qty, 0);
      const slow = hour >= settings.slowStart && hour < settings.slowEnd;
      drafts.push({
        id: `seed-${day}-${slot}`,
        number: 0,
        status: "closed",
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
        note: "",
        closedAt: at,
      });
    }
  }

  // The desk opens on a live tab: a table that ordered a couple of drinks and
  // has not settled yet — open, editable, and out of the books until someone
  // closes it. Seeded unconditionally so the ticket workflow is visible on
  // first run at any hour.
  const liveCostOf = (sku: string) => INGREDIENTS.find((item) => item.sku === sku)?.cost ?? 0;
  const liveLines: OrderLine[] = [
    MENU.find((entry) => entry.id === "spanish-latte") ?? MENU[0]!,
    MENU.find((entry) => entry.id === "americano") ?? MENU[0]!,
  ].map((item) => ({
    itemId: item.id,
    nameFa: item.nameFa,
    nameEn: item.nameEn,
    qty: 1,
    unitPrice: item.price,
    unitCogs: recipeCost(item.recipe, liveCostOf),
    mods: [],
  }));
  const liveSubtotal = liveLines.reduce((sum, line) => sum + line.unitPrice * line.qty, 0);
  drafts.push({
    id: "seed-live",
    number: 0,
    status: "open",
    at: Date.now() - 20 * 60 * 1000,
    lines: liveLines,
    subtotal: liveSubtotal,
    manualOff: 0,
    stampOff: 0,
    giftOff: 0,
    tierOff: 0,
    pointsOff: 0,
    pointsRedeemed: 0,
    pointsEarned: 0,
    bonusPoints: 0,
    total: liveSubtotal,
    cogs: liveLines.reduce((sum, line) => sum + line.unitCogs * line.qty, 0),
    pay: "card", // settled when the tab closes
    guestName: settings.lang === "fa" ? "میز ۳" : "Table 3",
    stampRedeemed: false,
    giftUsed: false,
    note: "",
  });

  drafts.sort((a, b) => a.at - b.at);
  drafts.forEach((order, index) => {
    order.number = 1701 + index;
  });
  return drafts.sort((a, b) => b.at - a.at);
}

type Prior = {
  id: string;
  name: string;
  phone: string;
  birthday: string;
  notes: string;
  stamps: number;
  createdAt: number;
  smsOptIn: boolean;
  referral: string;
  referredBy?: string;
  favoriteId?: string;
  giftYear: number;
  priorVisits: number;
  priorSpent: number;
  priorPoints: number;
  quiet?: number;
};

function buildCustomers(orders: Order[]): Customer[] {
  const priors: Prior[] = [
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
      priorSpent: 22_000_000,
      priorPoints: 640,
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
      priorSpent: 2_600_000,
      priorPoints: 180,
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
      priorPoints: 0,
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
      priorSpent: 8_400_000,
      priorPoints: 220,
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
      priorSpent: 4_600_000,
      priorPoints: 90,
      quiet: 26,
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
      priorSpent: 2_200_000,
      priorPoints: 40,
    },
  ];

  return priors.map((prior) => {
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
      walletBalance: 0,
      lastVisit: prior.quiet ? atDays(prior.quiet, 16, 10) : lastFromOrders || prior.createdAt,
    };
  });
}

export function initialData(): DeskData {
  const settings = defaultSettings();
  const orders = buildOrders(settings);
  const day = 86_400_000;
  return {
    menu: MENU.map((item) => ({ ...item, recipe: item.recipe.map((use) => ({ ...use })) })),
    stock: INGREDIENTS.map((item) => ({ ...item })),
    customers: buildCustomers(orders),
    orders,
    expenses: [
      {
        id: "ex-rent",
        at: Date.now() - 4 * day,
        category: "rent",
        amount: 48_000_000,
        note: "اجاره فضا",
        method: "transfer",
        custom: "آقای صادقی",
      },
      {
        id: "ex-power",
        at: Date.now() - 2 * day,
        category: "utilities",
        amount: 1_800_000,
        note: "برق و آب",
        method: "card",
        custom: "",
      },
      {
        id: "ex-clean",
        at: Date.now() - day,
        category: "supplies",
        amount: 650_000,
        note: "شوینده",
        method: "cash",
        custom: "",
      },
    ],
    moves: [
      {
        id: "mv-milk",
        at: Date.now() - day,
        sku: "milk",
        qty: 12_000,
        reason: "purchase",
        note: "خرید شیر",
      },
      {
        id: "mv-blue",
        at: Date.now() - 2 * day,
        sku: "blue",
        qty: -20,
        reason: "waste",
        note: "دورریز سیروپ",
      },
    ],
    cashMoves: [
      { id: "cash-milk", at: Date.now() - day, amount: -1_400_000, note: "خرید شیر" },
    ],
    customerCreditMoves: [],
    smsLogs: [],
    closes: [],
    settings,
    credit: null,
  };
}

export function snapshotOf(data: DeskData): DeskData {
  return {
    menu: data.menu,
    stock: data.stock,
    customers: data.customers,
    orders: data.orders,
    expenses: data.expenses,
    moves: data.moves,
    cashMoves: data.cashMoves,
    customerCreditMoves: data.customerCreditMoves,
    smsLogs: data.smsLogs,
    closes: data.closes,
    settings: data.settings,
    credit: data.credit,
  };
}
