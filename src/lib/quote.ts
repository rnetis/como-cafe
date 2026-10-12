import { birthdaySoon, tierOf, tierRate } from "./loyalty.ts";
import type { Customer, Settings } from "./types.ts";

/**
 * What a ticket costs right now, priced in the exact order the ledger uses
 * (`applyCheckout`): manual discount, free stamp, birthday gift, tier rate,
 * then redeemed points. One quote for the register, the open-ticket editor and
 * the close panel, so the number on screen is the number that will be booked.
 */
export type Quote = {
  /** Manual discount % turned into money. */
  manual: number;
  stamp: number;
  gift: number;
  tier: number;
  pointsOff: number;
  /** Points actually spent — whole points only, never more than the guest has. */
  pointsRedeemed: number;
  total: number;
};

export function quote(input: {
  subtotal: number;
  cheapest: number;
  discountPct: number;
  useStamp: boolean;
  useGift: boolean;
  redeemPoints: number;
  customer?: Customer;
  settings: Settings;
  now?: number;
}): Quote {
  const { subtotal, cheapest, customer, settings } = input;
  const pct = Math.min(100, Math.max(0, input.discountPct || 0));
  const manual = Math.round((subtotal * pct) / 100);
  let remain = Math.max(0, subtotal - manual);

  const cap = settings.compCap;
  const limited = (price: number) => (cap > 0 ? Math.min(price, cap) : price);
  const cheapestLine = Math.min(cheapest, remain);

  let stamp = 0;
  if (input.useStamp && customer && customer.stamps >= Math.max(1, settings.stampGoal) && remain > 0) {
    stamp = Math.min(limited(cheapestLine), remain);
    remain -= stamp;
  }

  let gift = 0;
  const year = new Date(input.now ?? Date.now()).getFullYear();
  if (
    input.useGift &&
    customer &&
    birthdaySoon(customer.birthday) &&
    customer.giftYear !== year &&
    remain > 0
  ) {
    gift = Math.min(limited(cheapestLine), remain);
    remain -= gift;
  }

  const rate = customer ? tierRate(tierOf(customer.spent)) : 0;
  const tier = Math.round(remain * rate);
  remain = Math.max(0, remain - tier);

  let pointsRedeemed = 0;
  let pointsOff = 0;
  if (customer && input.redeemPoints > 0 && settings.pointValue > 0) {
    const affordable = Math.floor(remain / settings.pointValue);
    pointsRedeemed = Math.min(Math.floor(input.redeemPoints), customer.points, affordable);
    pointsOff = pointsRedeemed * settings.pointValue;
  }

  return {
    manual,
    stamp,
    gift,
    tier,
    pointsOff,
    pointsRedeemed,
    total: Math.max(0, remain - pointsOff),
  };
}
