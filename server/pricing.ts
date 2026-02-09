// server/pricing.ts — CREATE THIS FILE

import { calculateDoorPrice as sharedCalculatePrice, DEFAULT_PRICING } from "../shared/doorSchema";
import type { DoorConfig } from "../shared/doorSchema";

/**
 * Server-side price verification.
 * Uses the SAME shared function as client to ensure consistency.
 * This is the authoritative price — never trust client-submitted prices.
 */
export function verifyDoorPrice(config: DoorConfig): number {
  const result = sharedCalculatePrice(config, DEFAULT_PRICING);
  return result.unitTotal;
}

/**
 * Calculate order totals with delivery
 */
export function calculateOrderTotals(
  items: Array<{ config: DoorConfig; quantity: number }>,
  deliveryMiles?: number,
  deliveryHours?: number,
) {
  let goodsTotal = 0;

  const lineItems = items.map((item) => {
    const unitPrice = verifyDoorPrice(item.config);
    const lineTotal = Math.round(unitPrice * item.quantity * 100) / 100;
    goodsTotal += lineTotal;
    return { unitPrice, lineTotal, quantity: item.quantity };
  });

  goodsTotal = Math.round(goodsTotal * 100) / 100;

  let deliveryCost = 0;
  if (deliveryMiles && deliveryMiles > 0) {
    deliveryCost =
      DEFAULT_PRICING.DELIVERY_BASE_FEE +
      deliveryMiles * 2 * DEFAULT_PRICING.DELIVERY_PER_MILE + // round trip
      (deliveryHours ?? 1) * DEFAULT_PRICING.DELIVERY_PER_HOUR;
    deliveryCost = Math.round(deliveryCost * 100) / 100;
  }

  const subtotal = goodsTotal + deliveryCost;
  const vatAmount = Math.round(subtotal * DEFAULT_PRICING.VAT_RATE * 100) / 100;
  const totalOwed = Math.round((subtotal + vatAmount) * 100) / 100;

  return { goodsTotal, deliveryCost, vatAmount, totalOwed, lineItems };
}