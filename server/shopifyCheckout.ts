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
      console.log(`[ShopifyCheckout] ⚡ Using Access Token from DATABASE: ${accessToken.substring(0, 12)}...`);
    } else {
      console.log(`[ShopifyCheckout] ℹ No valid token found in database.`);
    }
    const dbDomain = await storage.getSetting("shopify_shop_domain");
    if (dbDomain?.settingValue) {
      shopDomain = dbDomain.settingValue;
      console.log(`[ShopifyCheckout] ⚡ Using Shop Domain from DATABASE: ${shopDomain}`);
    }
  } catch (e) {
    console.log("[ShopifyCheckout] ⚠ DB settings lookup failed, using env vars fallback");
  }

  if (!accessToken) {
    accessToken =
      process.env.SHOPIFY_ACCESS_TOKEN ||
      process.env.SHOPIFY_ADMIN_ACCESS_TOKEN ||
      null;
    if (accessToken) {
      console.log(`[ShopifyCheckout] 🔗 Using Access Token from ENVIRONMENT: ${accessToken.substring(0, 12)}...`);
    }
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
  _imageBase64?: string; // Base64-encoded PNG image data for Shopify product image
}

// ─── Fetch base product variant from Shopify ─────────────────────────────────
let cachedVariant: { id: number; price: string } | null = null;

async function getBaseProductVariant(
  creds: ShopifyCredentials
): Promise<{ id: number; price: string } | null> {
  if (cachedVariant) return cachedVariant;

  try {
    // First check if there's a configured product ID in settings
    let productId: string | null = null;
    try {
      const setting = await storage.getSetting("shopify_base_product_id");
      if (setting?.settingValue) productId = setting.settingValue;
    } catch {
      // ignore
    }

    const apiVersion = "2025-01";
    let url: string;

    if (productId) {
      url = `https://${creds.shopDomain}/admin/api/${apiVersion}/products/${productId}.json?fields=id,variants`;
    } else {
      // Fetch first product from the store
      url = `https://${creds.shopDomain}/admin/api/${apiVersion}/products.json?limit=1&fields=id,variants`;
    }

    const res = await fetch(url, {
      headers: { "X-Shopify-Access-Token": creds.accessToken },
    });

    if (!res.ok) {
      console.warn(`[ShopifyCheckout] Failed to fetch products: ${res.status}`);
      return null;
    }

    const data: any = await res.json();
    const product = productId ? data.product : data.products?.[0];

    if (product?.variants?.[0]) {
      cachedVariant = {
        id: product.variants[0].id,
        price: product.variants[0].price,
      };
      console.log(
        `[ShopifyCheckout] Using base product variant ${cachedVariant.id} (price: £${cachedVariant.price})`
      );
      return cachedVariant;
    }
  } catch (err) {
    console.warn("[ShopifyCheckout] Error fetching base product:", err);
  }

  return null;
}

// ─── API helpers ─────────────────────────────────────────────────────────────
const API_VERSION = "2025-01";

function shopifyAdminUrl(creds: ShopifyCredentials, path: string): string {
  return `https://${creds.shopDomain}/admin/api/${API_VERSION}/${path}`;
}

// ─── Create a temporary unpublished Shopify product with the door preview image ──
async function createTempProduct(
  creds: ShopifyCredentials,
  item: CheckoutLineItem,
  index: number
): Promise<{ variantId: number; productId: number } | { _error: string } | null> {
  const cat = (item.category || "shaker");
  const categoryLabel = cat.charAt(0).toUpperCase() + cat.slice(1);
  const title = `Custom ${categoryLabel} Door`;

  const extras: string[] = [];
  if (item.angledLeft) extras.push(`Left Angle ${item.leftAngleDegrees || 45}°`);
  if (item.angledRight) extras.push(`Right Angle ${item.rightAngleDegrees || 45}°`);
  if (item.midRailsEnabled && item.midRails?.length) extras.push(`${item.midRails.length} Mid Rail(s)`);
  if (item.hingeDrilling && item.hinges?.length) extras.push(`${item.hinges.length} Hinge Hole(s)`);

  const variantTitle = [
    `${item.width}×${item.height}×${item.thickness}mm`,
    PANEL_LABELS[item.panelType] || item.panelType,
    FINISH_LABELS[item.finish] || item.finish,
    ...extras,
  ].join(" | ");

  const productPayload: any = {
    product: {
      title,
      body_html: `<p>Custom door: ${variantTitle}</p>`,
      vendor: "Custom Door Designer",
      product_type: "Custom Door",
      tags: "CustomDoorDesigner, TempCheckout, AutoCleanup",
      status: "active", // active is required for images to show up at checkout
      variants: [
        {
          title: variantTitle,
          price: item.price.toFixed(2),
          requires_shipping: true,
          taxable: true,
          inventory_management: null, // Don't track inventory for temp products
          inventory_policy: "continue", // Allow selling even without inventory
        },
      ],
    },
  };

  // Attach the door preview image if available
  if (item._imageUrl) {
    console.log(`[ShopifyCheckout] Attaching image URL for item ${index + 1}: ${item._imageUrl}`);
    productPayload.product.images = [
      {
        src: item._imageUrl,
        filename: `door-preview-${Date.now()}.png`,
      },
    ];
  } else {
    // If no image URL, use a small 1x1 transparent PNG payload so product creation succeeds.
    console.warn(`[ShopifyCheckout] ⚠ No image URL available for item ${index + 1}. Using empty transparent PNG.`);
    const emptyPngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    productPayload.product.images = [
      {
        attachment: emptyPngBase64,
        filename: `door-preview-fallback-${Date.now()}.png`,
      },
    ];
  }

  try {
    const url = shopifyAdminUrl(creds, "products.json");
    console.log(`[ShopifyCheckout] Creating temp product for item ${index + 1} (${item.width}×${item.height}mm)...`);

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": creds.accessToken,
      },
      body: JSON.stringify(productPayload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[ShopifyCheckout] Failed to create temp product: ${res.status}`, errText);
      return { _error: `HTTP ${res.status}: ${errText.substring(0, 150)}` };
    }

    const data: any = await res.json();
    const product = data.product;
    const variant = product?.variants?.[0];
    const image = product?.images?.[0];

    if (!variant) {
      console.error("[ShopifyCheckout] Temp product created but no variant found");
      return null;
    }

    // Explicitly link the image to the variant
    // Shopify draft orders only map the image if the variant itself has an image_id attached
    if (image) {
      try {
        const variantUrl = shopifyAdminUrl(creds, `variants/${variant.id}.json`);
        const variantRes = await fetch(variantUrl, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": creds.accessToken,
          },
          body: JSON.stringify({
            variant: {
              id: variant.id,
              image_id: image.id,
            },
          }),
        });
        if (variantRes.ok) {
          console.log(`[ShopifyCheckout] Successfully linked image ${image.id} to variant ${variant.id}`);
        } else {
          console.warn(`[ShopifyCheckout] Failed to link image to variant: ${variantRes.status}`);
        }
      } catch (linkErr) {
        console.warn(`[ShopifyCheckout] Error linking image to variant:`, linkErr);
      }
    }

    console.log(
      `[ShopifyCheckout] ✓ Temp product ${product.id} created with variant ${variant.id} ` +
      `(price: £${variant.price}, image: ${image ? "yes" : "no"})`
    );

    return { variantId: variant.id, productId: product.id };
  } catch (err) {
    console.error(`[ShopifyCheckout] Error creating temp product for item ${index + 1}:`, err);
    return { _error: `Exception: ${err instanceof Error ? err.message : String(err)}` };
  }
}

// ─── Clean up temporary products (fire-and-forget) ───────────────────────────
async function deleteTempProducts(
  creds: ShopifyCredentials,
  productIds: number[]
): Promise<void> {
  // Wait 2 hours before cleanup — Shopify checkout page loads images from
  // LIVE products, so deleting them immediately makes the images disappear.
  // The checkout session typically completes within 30-60 minutes.
  const CLEANUP_DELAY_MS = 2 * 60 * 60 * 1000; // 2 hours
  console.log(`[ShopifyCheckout] Will clean up ${productIds.length} temp product(s) in 2 hours`);
  await new Promise((resolve) => setTimeout(resolve, CLEANUP_DELAY_MS));

  for (const productId of productIds) {
    try {
      const url = shopifyAdminUrl(creds, `products/${productId}.json`);
      const res = await fetch(url, {
        method: "DELETE",
        headers: { "X-Shopify-Access-Token": creds.accessToken },
      });
      if (res.ok) {
        console.log(`[ShopifyCheckout] ✓ Cleaned up temp product ${productId}`);
      } else {
        console.warn(`[ShopifyCheckout] Failed to clean up product ${productId}: ${res.status}`);
      }
    } catch (err) {
      console.warn(`[ShopifyCheckout] Error cleaning up product ${productId}:`, err);
    }
  }
}

// ─── Create Draft Order ───────────────────────────────────────────────────────
export async function createDraftOrderFromLineItems(
  items: CheckoutLineItem[],
  creds: ShopifyCredentials
): Promise<{ invoiceUrl: string; draftOrderId: string }> {

  // ─── Create a temp Shopify product per door configuration ───
  // Each product has the custom door preview image and correct price.
  // This ensures the Shopify checkout shows the exact door image for every item.
  const tempProductIds: number[] = [];
  const shopifyLineItems: any[] = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];

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

    // Try to create a temp product with the door preview image
    const tempProduct = await createTempProduct(creds, item, i);

    if (tempProduct && !('_error' in tempProduct)) {
      // Use the temp product's variant (has the custom door image)
      tempProductIds.push(tempProduct.productId);
      shopifyLineItems.push({
        variant_id: tempProduct.variantId,
        quantity: item.quantity,
        properties,
      });
    } else {
      // Fallback: custom line item without image (only if product creation fails)
      const errorStr = tempProduct && '_error' in tempProduct ? tempProduct._error : "Unknown failure";
      console.warn(`[ShopifyCheckout] Falling back to custom line item for item ${i + 1}. Reason: ${errorStr}`);
      shopifyLineItems.push({
        title,
        variant_title: variantParts.join(" | "),
        price: item.price.toFixed(2),
        quantity: item.quantity,
        requires_shipping: true,
        taxable: true,
        properties: [
          ...properties,
          ...(item._imageUrl ? [{ name: "Preview Image", value: item._imageUrl }] : []),
          { name: "⚠️ Image Error", value: "Failed to attach custom door image due to Shopify API rejection." },
          { name: "🔧 Debug Log", value: errorStr },
        ],
      });
    }
  }

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

  const url = shopifyAdminUrl(creds, "draft_orders.json");

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

    // Clean up temp products on error
    if (tempProductIds.length > 0) {
      deleteTempProducts(creds, tempProductIds).catch(() => { });
    }

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
    // Clean up temp products
    if (tempProductIds.length > 0) {
      deleteTempProducts(creds, tempProductIds).catch(() => { });
    }
    throw new Error("Payment provider did not return a checkout URL");
  }

  console.log(
    `[ShopifyCheckout] ✓ Draft order ${draftOrder.id} created. Invoice: ${draftOrder.invoice_url}`
  );

  // ─── Schedule temp product cleanup in the background ───
  // Shopify checkout loads product images from LIVE products — deleting them
  // before the customer completes checkout removes the images.
  // Cleanup is delayed 2 hours to allow time for order completion.
  if (tempProductIds.length > 0) {
    console.log(`[ShopifyCheckout] Scheduling cleanup of ${tempProductIds.length} temp product(s) in 2 hours...`);
    deleteTempProducts(creds, tempProductIds).catch((err) => {
      console.warn("[ShopifyCheckout] Background cleanup error:", err);
    });
  }

  return {
    invoiceUrl: draftOrder.invoice_url,
    draftOrderId: draftOrder.id.toString(),
  };
}