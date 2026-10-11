export type Lang = "fa" | "en";

export type CategoryId = "hot-coffee" | "iced-coffee" | "brew" | "hot-drinks" | "mocktail";

export type Pay = "cash" | "card" | "online" | "wallet";

export type Unit = "g" | "ml" | "pcs";

export type Tier = "guest" | "regular" | "como" | "inner";

export type RecipeUse = { sku: string; qty: number };

export type MenuItem = {
  id: string;
  category: CategoryId;
  nameEn: string;
  nameFa: string;
  price: number;
  recipe: RecipeUse[];
  active: boolean;
};

export type StockItem = {
  sku: string;
  nameFa: string;
  nameEn: string;
  unit: Unit;
  onHand: number;
  par: number;
  cost: number;
};

export type Mod = {
  id: string;
  nameFa: string;
  nameEn: string;
  price: number;
  recipe: RecipeUse[];
};

export type LineMod = { id: string; nameFa: string; nameEn: string; price: number };

export type OrderLine = {
  itemId: string;
  nameFa: string;
  nameEn: string;
  qty: number;
  unitPrice: number;
  unitCogs: number;
  mods: LineMod[];
};

export type Order = {
  id: string;
  number: number;
  at: number;
  lines: OrderLine[];
  subtotal: number;
  manualOff: number;
  stampOff: number;
  giftOff: number;
  tierOff: number;
  pointsOff: number;
  pointsRedeemed: number;
  pointsEarned: number;
  bonusPoints: number;
  total: number;
  cogs: number;
  pay: Pay;
  customerId?: string;
  guestName?: string;
  stampsAfter?: number;
  pointsAfter?: number;
  stampRedeemed: boolean;
  giftUsed: boolean;
  note: string;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  birthday: string;
  notes: string;
  points: number;
  stamps: number;
  visits: number;
  spent: number;
  createdAt: number;
  lastVisit: number;
  smsOptIn: boolean;
  referral: string;
  referredBy?: string;
  favoriteId?: string;
  giftYear: number;
  walletBalance: number;
};

export type CustomerCreditMove = {
  id: string;
  at: number;
  customerId: string;
  amount: number;
  kind: "topup" | "sale";
  method?: "cash" | "card" | "transfer";
  orderId?: string;
  note: string;
};

export type ExpenseCategory = "rent" | "payroll" | "utilities" | "supplies" | "other";

export type Expense = {
  id: string;
  at: number;
  category: ExpenseCategory;
  amount: number;
  note: string;
  method: "cash" | "card" | "transfer";
};

export type StockReason = "sale" | "purchase" | "waste" | "adjust";

export type StockMove = {
  id: string;
  at: number;
  sku: string;
  qty: number;
  reason: StockReason;
  note: string;
};

export type CashMove = {
  id: string;
  at: number;
  amount: number;
  note: string;
};

export type SmsKind = "receipt" | "welcome" | "loyalty" | "campaign" | "birthday";

export type SmsLog = {
  id: string;
  at: number;
  to: string[];
  body: string;
  kind: SmsKind;
  status: "sent" | "demo" | "failed";
  detail: string;
};

export type CloseOut = {
  id: string;
  at: number;
  sales: number;
  cash: number;
  card: number;
  online: number;
  wallet: number;
  expenses: number;
  drawer: number;
  note: string;
};

export type Settings = {
  lang: Lang;
  addressFa: string;
  addressEn: string;
  phone: string;
  instagram: string;
  pointsPer: number;
  pointValue: number;
  stampGoal: number;
  compCap: number;
  slowStart: number;
  slowEnd: number;
  referralBonus: number;
  float: number;
  smsApiKey: string;
  smsLine: string;
  pecPin: string;
  pecCallbackUrl: string;
  posType: "LAN" | "SERIAL";
  posIp: string;
  posPort: number;
  posComPort: string;
  paper: 58 | 80;
  baud: 9600 | 115200;
  autoPrint: boolean;
  autoSms: boolean;
};

export type CreditSnap = { value: number; at: number } | null;

export type DeskData = {
  menu: MenuItem[];
  stock: StockItem[];
  customers: Customer[];
  orders: Order[];
  expenses: Expense[];
  moves: StockMove[];
  cashMoves: CashMove[];
  customerCreditMoves: CustomerCreditMove[];
  smsLogs: SmsLog[];
  closes: CloseOut[];
  settings: Settings;
  credit: CreditSnap;
};

export type CheckoutInput = {
  lines: { itemId: string; qty: number; mods: string[] }[];
  pay: Pay;
  note: string;
  customerId?: string;
  newName?: string;
  newPhone?: string;
  referralCode?: string;
  discountPct: number;
  useStamp: boolean;
  useGift: boolean;
  redeemPoints: number;
};
