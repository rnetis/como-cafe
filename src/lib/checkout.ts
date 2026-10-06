import { MODS, recipeCost } from "./catalog";
import { normPhone, uid, validPhone } from "./format";
import { birthdaySoon, earnedPoints, inSlowHour, tierOf, tierRate } from "./loyalty";
import type { CheckoutInput, DeskData, Order, OrderLine, StockItem } from "./types";

export type CheckoutError = "empty" | "missing" | "phone" | "stock";

export function applyCheckout(
  data: DeskData,
  input: CheckoutInput,
):
  | { ok: true; data: DeskData; order: Order; warnings: string[] }
  | { ok: false; error: CheckoutError } {
  const linesIn = input.lines
    .filter((line) => Number.isFinite(line.qty) && line.qty > 0)
    .map((line) => ({ ...line, qty: Math.min(99, Math.floor(line.qty)) }))
    .filter((line) => line.qty > 0);
  if (linesIn.length === 0) return { ok: false, error: "empty" };

  const costOf = (sku: string) => data.stock.find((item) => item.sku === sku)?.cost ?? 0;
  const orderLines: OrderLine[] = [];

  for (const line of linesIn) {
    const item = data.menu.find((entry) => entry.id === line.itemId && entry.active);
    if (!item) return { ok: false, error: "missing" };
    const mods = line.mods
      .map((id) => MODS.find((mod) => mod.id === id))
      .filter((mod): mod is (typeof MODS)[number] => Boolean(mod));
    orderLines.push({
      itemId: item.id,
      nameFa: item.nameFa,
      nameEn: item.nameEn,
      qty: line.qty,
      unitPrice: item.price + mods.reduce((sum, mod) => sum + mod.price, 0),
      unitCogs:
        recipeCost(item.recipe, costOf) +
        mods.reduce((sum, mod) => sum + recipeCost(mod.recipe, costOf), 0),
      mods: mods.map((mod) => ({
        id: mod.id,
        nameFa: mod.nameFa,
        nameEn: mod.nameEn,
        price: mod.price,
      })),
    });
  }

  const subtotal = orderLines.reduce((sum, line) => sum + line.unitPrice * line.qty, 0);
  const pct = Math.min(100, Math.max(0, input.discountPct || 0));
  const manualOff = Math.round((subtotal * pct) / 100);
  const cheapest = orderLines.reduce((min, line) => Math.min(min, line.unitPrice), subtotal);

  let customer = input.customerId
    ? (data.customers.find((entry) => entry.id === input.customerId) ?? null)
    : null;
  let creating = false;
  let phone = "";
  if (!customer && input.newPhone?.trim()) {
    phone = normPhone(input.newPhone);
    if (!validPhone(phone)) return { ok: false, error: "phone" };
    const existing = data.customers.find((entry) => entry.phone === phone);
    if (existing) customer = existing;
    else creating = true;
  }

  const now = Date.now();
  const year = new Date(now).getFullYear();
  const goal = Math.max(1, data.settings.stampGoal);
  const cap = data.settings.compCap;
  const limited = (price: number) => (cap > 0 ? Math.min(price, cap) : price);

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
  if (
    input.useGift &&
    customer &&
    birthdaySoon(customer.birthday) &&
    customer.giftYear !== year &&
    remain > 0
  ) {
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
  let referrerId: string | undefined;
  if (creating && input.referralCode?.trim()) {
    const code = input.referralCode.trim().toUpperCase();
    const referrer = data.customers.find((entry) => entry.referral.toUpperCase() === code);
    if (referrer && referrer.phone !== phone) {
      referrerId = referrer.id;
      bonusPoints = Math.max(0, data.settings.referralBonus);
    }
  }

  const guestName = customer
    ? customer.name
    : creating
      ? input.newName?.trim() || (data.settings.lang === "fa" ? "مهمان" : "Guest")
      : "";

  let stampsAfter = customer?.stamps ?? 0;
  if (attached) {
    if (stampRedeemed) stampsAfter = Math.max(0, stampsAfter - goal);
    stampsAfter += qty;
  }
  const pointsAfter = (customer?.points ?? 0) - pointsRedeemed + pointsEarned + bonusPoints;
  const newId = creating ? uid("c") : undefined;
  const number = data.orders.reduce((max, order) => Math.max(max, order.number), 0) + 1;

  const order: Order = {
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
    guestName: guestName || undefined,
    stampsAfter: attached ? stampsAfter : undefined,
    pointsAfter: attached ? pointsAfter : undefined,
    stampRedeemed,
    giftUsed,
    note: input.note.trim().slice(0, 140),
  };

  const usage = new Map<string, number>();
  const addUse = (recipe: { sku: string; qty: number }[], times: number) => {
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

  // A sale must be all-or-nothing: never book a ticket that consumes stock we
  // do not have. The till and LAN orders share this path.
  if (
    [...usage].some(([sku, used]) => {
      const item = data.stock.find((entry) => entry.sku === sku);
      return !item || item.onHand + 1e-9 < used;
    })
  )
    return { ok: false, error: "stock" };

  const warnings: string[] = [];
  const stock: StockItem[] = data.stock.map((item) => {
    const used = usage.get(item.sku) ?? 0;
    if (!used) return item;
    const onHand = Math.round((item.onHand - used) * 1000) / 1000;
    return { ...item, onHand };
  });

  const moves = [
    ...[...usage.entries()].map(([sku, amount]) => ({
      id: uid("mv"),
      at: now,
      sku,
      qty: -amount,
      reason: "sale" as const,
      note: `#${number}`,
    })),
    ...data.moves,
  ].slice(0, 300);

  let customers = data.customers.map((entry) => ({ ...entry }));
  if (referrerId) {
    customers = customers.map((entry) =>
      entry.id === referrerId ? { ...entry, points: entry.points + bonusPoints } : entry,
    );
  }

  const top = [...orderLines].sort((a, b) => b.qty * b.unitPrice - a.qty * a.unitPrice)[0];
  if (customer) {
    customers = customers.map((entry) =>
      entry.id === customer.id
        ? {
            ...entry,
            stamps: stampsAfter,
            points: pointsAfter,
            visits: entry.visits + 1,
            spent: entry.spent + total,
            lastVisit: now,
            favoriteId: entry.favoriteId || top?.itemId,
            giftYear: giftUsed ? year : entry.giftYear,
          }
        : entry,
    );
  } else if (creating && newId) {
    let referral = `C${phone.slice(-4)}`;
    if (customers.some((entry) => entry.referral === referral)) referral = `C${phone.slice(-6)}`;
    customers = [
      {
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
        giftYear: 0,
      },
      ...customers,
    ];
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
      orders: [order, ...data.orders].slice(0, 500),
    },
  };
}
