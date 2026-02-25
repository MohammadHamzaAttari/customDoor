import fetch from "node-fetch";
import { storage } from "./storage";

// ─── Label maps ───────────────────────────────────────────────────────────────
const PANEL_LABELS: Record<string, string> = {
  STANDARD_12MM: "Standard 12mm",
  REEDED_19MM: "Reeded 19mm",
  MELAMINE_18MM: "Melamine 18mm",
  NONE: "Slab",
  FRETWORK: "Fretwork",
  GLASS: "Glass Ready",
};

const FINISH_LABELS: Record<string, string> = {
  RAW_UNASSEMBLED: "Raw Unassembled",
  ASSEMBLED_PREP: "Assembled & Prepped",
  PRIMED: "Primed",
};

// ─── Credentials (matches shopify.ts pattern exactly) ─────────────────────────
export interface ShopifyCredentials {
  shopDomain: string;
  accessToken: string;
}

// server/shopifyCheckout.ts
// REPLACE getShopifyCredentials with this improved version:

export async function getShopifyCredentials(): Promise<ShopifyCredentials | null> {
  let accessToken: string | null = null;
  let shopDomain: string | null = null;

  try {
    const dbToken = await storage.getSetting("shopify_access_token");
    if (dbToken?.settingValue && dbToken.settingValue.startsWith("shpat_")) {
      accessToken = dbToken.settingValue;
    }
    const dbDomain = await storage.getSetting("shopify_shop_domain");
    if (dbDomain?.settingValue) {
      shopDomain = dbDomain.settingValue;
    }
  } catch (e) {
    console.log("[ShopifyCheckout] DB settings lookup failed, using env vars");
  }

  if (!accessToken) {
    accessToken =
      process.env.SHOPIFY_ACCESS_TOKEN ||
      process.env.SHOPIFY_ADMIN_ACCESS_TOKEN ||
      null;
  }

  if (!shopDomain) {
    shopDomain =
      process.env.SHOPIFY_SHOP_DOMAIN ||
      process.env.SHOPIFY_STORE_DOMAIN ||
      null;
  }

  // ── NEW: Validate token format ──
  if (accessToken && !accessToken.startsWith("shpat_")) {
    console.error(
      `[ShopifyCheckout] ❌ Token doesn't start with 'shpat_'. ` +
      `Got prefix: '${accessToken.substring(0, 10)}'. ` +
      `This looks like an API Secret, not an Access Token.`
    );
    return null;
  }

  // ── NEW: Normalize domain ──
  if (shopDomain) {
    shopDomain = shopDomain
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "")
      .trim();
  }

  console.log(
    `[ShopifyCheckout] Credentials: domain=${shopDomain ?? "MISSING"}, ` +
    `token=${accessToken ? accessToken.substring(0, 12) + "..." : "MISSING"}`
  );

  if (!accessToken || !shopDomain) {
    console.error(
      "[ShopifyCheckout] ❌ Missing credentials:\n" +
      `  SHOPIFY_ACCESS_TOKEN: ${process.env.SHOPIFY_ACCESS_TOKEN ? "SET" : "NOT SET"}\n` +
      `  SHOPIFY_ADMIN_ACCESS_TOKEN: ${process.env.SHOPIFY_ADMIN_ACCESS_TOKEN ? "SET" : "NOT SET"}\n` +
      `  SHOPIFY_SHOP_DOMAIN: ${process.env.SHOPIFY_SHOP_DOMAIN ? "SET" : "NOT SET"}`
    );
    return null;
  }

  return { shopDomain, accessToken };
}

// ─── Line Item Interface ──────────────────────────────────────────────────────
export interface CheckoutLineItem {
  width: number;
  height: number;
  thickness: number;
  panelType: string;
  finish: string;
  price: number;
  quantity: number;
  category?: string;
  angledLeft?: boolean;
  angledRight?: boolean;
  leftAngleDegrees?: number;
  rightAngleDegrees?: number;
  midRailsEnabled?: boolean;
  midRails?: any[];
  hingeDrilling?: boolean;
  hinges?: any[];
  _imageUrl?: string; // Public URL to door preview SVG for Shopify checkout
}

// ─── Create Draft Order ───────────────────────────────────────────────────────
export async function createDraftOrderFromLineItems(
  items: CheckoutLineItem[],
  creds: ShopifyCredentials
): Promise<{ invoiceUrl: string; draftOrderId: string }> {
  // Build Shopify line items with production details
  const shopifyLineItems = items.map((item) => {
    const extras: string[] = [];
    if (item.angledLeft)
      extras.push(`Left Angle ${item.leftAngleDegrees || 45}°`);
    if (item.angledRight)
      extras.push(`Right Angle ${item.rightAngleDegrees || 45}°`);
    if (item.midRailsEnabled && item.midRails?.length)
      extras.push(`${item.midRails.length} Mid Rail(s)`);
    if (item.hingeDrilling && item.hinges?.length)
      extras.push(`${item.hinges.length} Hinge Hole(s)`);

    const cat = (item.category || "shaker");
    const categoryLabel = cat.charAt(0).toUpperCase() + cat.slice(1);

    const title = `Custom ${categoryLabel} Door`;

    const variantParts = [
      `${item.width}×${item.height}×${item.thickness}mm`,
      PANEL_LABELS[item.panelType] || item.panelType,
      FINISH_LABELS[item.finish] || item.finish,
      ...extras,
    ];

    const properties = [
      { name: "Width", value: `${item.width}mm` },
      { name: "Height", value: `${item.height}mm` },
      { name: "Thickness", value: `${item.thickness}mm` },
      { name: "Panel Type", value: PANEL_LABELS[item.panelType] || item.panelType },
      { name: "Finish", value: FINISH_LABELS[item.finish] || item.finish },
      ...(item.angledLeft
        ? [{ name: "Left Angle", value: `${item.leftAngleDegrees || 45}°` }]
        : []),
      ...(item.angledRight
        ? [{ name: "Right Angle", value: `${item.rightAngleDegrees || 45}°` }]
        : []),
      ...(item.midRailsEnabled && item.midRails?.length
        ? [{ name: "Mid Rails", value: `${item.midRails.length}` }]
        : []),
      ...(item.hingeDrilling && item.hinges?.length
        ? [{ name: "Hinge Holes", value: `${item.hinges.length}` }]
        : []),
    ];

    const lineItem: any = {
      title,
      variant_title: variantParts.join(" | "),
      price: item.price.toFixed(2),
      quantity: item.quantity,
      requires_shipping: true,
      taxable: true,
      properties,
    };

    // Include door preview image if available
    if (item._imageUrl) {
      lineItem.image_url = item._imageUrl;
    }

    return lineItem;
  });

  // Build note summary
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const note = [
    `Custom Door Designer Order`,
    `${items.length} product(s), ${totalQty} total item(s)`,
    `Subtotal ex-VAT: £${subtotal.toFixed(2)}`,
    ...items.map(
      (item, idx) =>
        `Item ${idx + 1}: ${item.width}×${item.height}×${item.thickness}mm ${PANEL_LABELS[item.panelType] || item.panelType} x${item.quantity}`
    ),
  ].join("\n");

  const draftOrderPayload = {
    draft_order: {
      line_items: shopifyLineItems,
      note,
      tags: "CustomDoorDesigner, QuickCheckout",
      use_customer_default_address: true,
      tax_exempt: false,
    },
  };

  console.log(
    `[ShopifyCheckout] Creating draft order with ${shopifyLineItems.length} line item(s)...`
  );

  // Use a stable API version
  const apiVersion = "2025-01";
  const url = `https://${creds.shopDomain}/admin/api/${apiVersion}/draft_orders.json`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": creds.accessToken,
    },
    body: JSON.stringify(draftOrderPayload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      `[ShopifyCheckout] Shopify error ${response.status}:`,
      errorText
    );

    // Parse for user-friendly message
    let userMessage = "Failed to create order with payment provider.";
    try {
      const errorJson = JSON.parse(errorText);
      if (errorJson.errors) {
        if (typeof errorJson.errors === "string") {
          userMessage = errorJson.errors;
        } else {
          userMessage = Object.entries(errorJson.errors)
            .map(([key, val]) => `${key}: ${val}`)
            .join("; ");
        }
      }
    } catch {
      // Keep generic message
    }

    throw new Error(userMessage);
  }

  const data: any = await response.json();
  const draftOrder = data.draft_order;

  if (!draftOrder?.invoice_url) {
    console.error(
      "[ShopifyCheckout] No invoice URL in response:",
      JSON.stringify(data, null, 2)
    );
    throw new Error("Payment provider did not return a checkout URL");
  }

  console.log(
    `[ShopifyCheckout] ✓ Draft order ${draftOrder.id} created. Invoice: ${draftOrder.invoice_url}`
  );

  return {
    invoiceUrl: draftOrder.invoice_url,
    draftOrderId: draftOrder.id.toString(),
  };
}