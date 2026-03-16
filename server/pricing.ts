// server/pricing.ts — CREATE THIS FILE

import { calculateDoorPrice as sharedCalculatePrice, DEFAULT_PRICING } from "../shared/doorSchema";
import type { DoorConfig } from "../shared/doorSchema";
import { getPricingSettings } from "./settings";

/**
 * Server-side price verification.
 * Uses the SAME shared function as client to ensure consistency.
 * This is the authoritative price — never trust client-submitted prices.
 */
export async function verifyDoorPrice(config: DoorConfig): Promise<number> {
  const dynamicPricing = await getPricingSettings();
  const result = sharedCalculatePrice(config, dynamicPricing);
  return result.unitTotal;
}

/**
 * Calculate order totals with delivery
 */
export async function calculateOrderTotals(
  items: Array<{ config: DoorConfig; quantity: number }>,
  deliveryMiles?: number,
  deliveryHours?: number,
) {
  const dynamicPricing = await getPricingSettings();
  let goodsTotal = 0;

  const lineItems = await Promise.all(items.map(async (item) => {
    const unitPrice = await verifyDoorPrice(item.config);
    const lineTotal = Math.round(unitPrice * item.quantity * 100) / 100;
    return { unitPrice, lineTotal, quantity: item.quantity };
  }));

  for (const item of lineItems) {
    goodsTotal += item.lineTotal;
  }

  goodsTotal = Math.round(goodsTotal * 100) / 100;

  let deliveryCost = 0;
  if (deliveryMiles && deliveryMiles > 0) {
    deliveryCost =
      dynamicPricing.DELIVERY_BASE_FEE +
      deliveryMiles * 2 * dynamicPricing.DELIVERY_PER_MILE + // round trip
      (deliveryHours ?? 1) * dynamicPricing.DELIVERY_PER_HOUR;
    deliveryCost = Math.round(deliveryCost * 100) / 100;
  }

  const subtotal = goodsTotal + deliveryCost;
  const vatAmount = Math.round(subtotal * dynamicPricing.VAT_RATE * 100) / 100;
  const totalOwed = Math.round((subtotal + vatAmount) * 100) / 100;

  return { goodsTotal, deliveryCost, vatAmount, totalOwed, lineItems };
}