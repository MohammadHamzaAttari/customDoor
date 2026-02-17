import { shopifyApi, ApiVersion } from "@shopify/shopify-api";
import "@shopify/shopify-api/adapters/node";
import fetch from "node-fetch";
import { storage } from "./storage";
import type { Order, OrderItem, Customer } from "../shared/schema";

// Initialize Shopify API
const shopify = shopifyApi({
    apiKey: process.env.SHOPIFY_API_KEY || "",
    apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
    adminApiAccessToken: process.env.SHOPIFY_ACCESS_TOKEN || "",
    hostName: process.env.SHOPIFY_SHOP_DOMAIN || "",
    apiVersion: ApiVersion.October24, // October 2024 is a safe stable version
    isEmbeddedApp: false,
});

async function getAccessToken() {
    // 1. Try DB first (most up to date if user performed OAuth)
    const dbToken = await storage.getSetting("shopify_access_token");
    console.log(`[Shopify] DB Token found: ${dbToken ? "YES" : "NO"}`);
    if (dbToken && dbToken.settingValue && dbToken.settingValue.startsWith("shpat_")) {
        return dbToken.settingValue;
    }

    // 2. Fallback to Env
    const envToken = process.env.SHOPIFY_ACCESS_TOKEN;
    console.log(`[Shopify] Env Token found: ${envToken ? "YES" : "NO"}`);
    if (envToken) {
        return envToken;
    }

    return null;
}

async function getShopDomain() {
    // 1. Try DB first
    const dbDomain = await storage.getSetting("shopify_shop_domain");
    console.log(`[Shopify] DB Domain found: ${dbDomain ? dbDomain.settingValue : "NO"}`);
    if (dbDomain && dbDomain.settingValue) {
        return dbDomain.settingValue;
    }
    // 2. Fallback to Env
    const envDomain = process.env.SHOPIFY_SHOP_DOMAIN;
    console.log(`[Shopify] Env Domain found: ${envDomain ? envDomain : "NO"}`);
    return envDomain;
}

/**
 * Normalizes phone number for Shopify
 */
function normalizePhone(phone: string): string {
    if (!phone) return "";
    // Shopify expects E.164 format or similar
    // Remove all non-digits except +
    const cleaned = phone.replace(/[^\d+]/g, "");
    let normalized = cleaned;

    if (cleaned.startsWith("+")) {
        normalized = cleaned;
    } else if (cleaned.startsWith("00")) {
        // If it starts with 00, replace with +
        normalized = "+" + cleaned.substring(2);
    } else if (cleaned.startsWith("0")) {
        // If it's a UK number starting with 0, replace with +44
        normalized = "+44" + cleaned.substring(1);
    }

    console.log(`[Shopify] Normalizing phone: "${phone}" -> "${normalized}"`);
    return normalized;
}

/**
 * Creates or finds a customer on Shopify based on email
 */
async function getOrCreateShopifyCustomer(localCustomer: Customer) {
    console.log(`[Shopify] Starting getOrCreateShopifyCustomer for ${localCustomer.email}`);
    const token = await getAccessToken();
    const shopDomain = await getShopDomain();

    console.log(`[Shopify] Credentials Check -> Domain: ${shopDomain}, Token: ${token ? "PRESENT" : "MISSING"}`);

    if (!shopDomain || !token) {
        throw new Error("Shopify credentials not configured");
    }

    // 1. Search for customer by email
    const searchUrl = `https://${shopDomain}/admin/api/2025-01/customers/search.json?query=email:${localCustomer.email}`;
    console.log(`[Shopify] Searching customer: ${searchUrl}`);

    const searchResponse = await fetch(searchUrl, {
        headers: {
            "X-Shopify-Access-Token": token,
            "Content-Type": "application/json",
        },
    });

    console.log(`[Shopify] Search Status: ${searchResponse.status}`);
    const searchData: any = await searchResponse.json();

    if (searchData.errors) {
        console.error("[Shopify] Search Error (IGNORING):", searchData.errors);
    }

    if (searchData.customers && searchData.customers.length > 0) {
        const existing = searchData.customers[0];
        const existingId = existing.id.toString();
        console.log(`[Shopify] Found existing customer: ${existingId}`);

        // Update local record with shopify ID if missing
        if (!localCustomer.shopifyCustomerId) {
            await storage.updateCustomer(localCustomer.id, { shopifyCustomerId: existingId });
        }

        // Proactively update Shopify customer with latest details from local DB
        // This ensures corrected phone numbers/addresses are synced
        const updateUrl = `https://${shopDomain}/admin/api/2025-01/customers/${existingId}.json`;
        console.log(`[Shopify] Updating existing customer: ${updateUrl}`);

        const nameParts = localCustomer.contactName.split(" ");
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "Customer";

        const updateBody = {
            customer: {
                id: existing.id,
                first_name: firstName,
                last_name: lastName,
                phone: normalizePhone(localCustomer.phone),
            }
        };

        try {
            const updateResponse = await fetch(updateUrl, {
                method: "PUT",
                headers: {
                    "X-Shopify-Access-Token": token,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updateBody),
            });
            if (!updateResponse.ok) {
                const updateError = await updateResponse.json().catch(() => ({}));
                console.error("[Shopify] Failed to update existing customer:", updateError);
                // We don't throw yet to allow draft order sync to attempt, 
                // but at least we log it properly now
            } else {
                console.log(`[Shopify] Update Status: ${updateResponse.status} (SUCCESS)`);
            }
        } catch (err) {
            console.error("[Shopify] Network error updating existing customer:", err);
        }

        return existing.id;
    }

    // 2. Create customer if not found
    console.log(`[Shopify] Customer not found, creating new one...`);
    const createUrl = `https://${shopDomain}/admin/api/2025-01/customers.json`;
    const nameParts = localCustomer.contactName.split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "Customer";

    const country = (localCustomer.invoiceCountry === "UK" || !localCustomer.invoiceCountry)
        ? "GB"
        : localCustomer.invoiceCountry;

    const createBody = {
        customer: {
            first_name: firstName,
            last_name: lastName,
            email: localCustomer.email,
            phone: normalizePhone(localCustomer.phone),
            verified_email: true,
            addresses: [
                {
                    first_name: firstName,
                    last_name: lastName,
                    address1: localCustomer.invoiceAddressLine1,
                    address2: localCustomer.invoiceAddressLine2,
                    city: localCustomer.invoiceCity,
                    zip: localCustomer.invoicePostcode,
                    country: country,
                    phone: normalizePhone(localCustomer.phone),
                    default: true,
                },
            ],
        },
    };

    console.log(`[Shopify] Creating customer payload:`, JSON.stringify(createBody, null, 2));

    const createResponse = await fetch(createUrl, {
        method: "POST",
        headers: {
            "X-Shopify-Access-Token": token,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(createBody),
    });

    console.log(`[Shopify] Create Status: ${createResponse.status}`);
    const createData: any = await createResponse.json();
    if (createData.errors || !createResponse.ok) {
        console.error("Shopify Customer Creation Error Response:", JSON.stringify(createData, null, 2));
        throw new Error(`Failed to create Shopify customer: ${JSON.stringify(createData.errors || createData)}`);
    }

    const newId = createData.customer.id.toString();
    console.log(`[Shopify] Created new customer: ${newId}`);
    await storage.updateCustomer(localCustomer.id, { shopifyCustomerId: newId });
    return createData.customer.id;
}

/**
 * Validates the Shopify connection by fetching shop details
 */
export async function testShopifyConnection() {
    const token = await getAccessToken();
    const shopDomain = await getShopDomain();

    if (!shopDomain || !token) {
        console.error("Missing Shopify Credentials in Environment or DB");
        return false;
    }

    const testUrl = `https://${shopDomain}/admin/api/2025-01/shop.json`;
    console.log(`[Shopify] Testing Connection: ${testUrl}`);
    console.log(`[Shopify] Token Prefix: ${token.substring(0, 5)}...`);

    try {
        const response = await fetch(testUrl, {
            headers: {
                "X-Shopify-Access-Token": token,
                "Content-Type": "application/json",
            },
        });

        console.log(`[Shopify] Test Connection Status: ${response.status}`);
        if (!response.ok) {
            const body = await response.text();
            console.error(`[Shopify] Test Connection Failed: ${body}`);
            return false;
        }

        const data: any = await response.json();
        console.log(`[Shopify] Connected to Shop: ${data.shop?.name} (${data.shop?.email})`);
        return true;
    } catch (error) {
        console.error(`[Shopify] Test Connection Network Error:`, error);
        return false;
    }
}

/**
 * Create a draft order in Shopify from a local order
 */
export async function createShopifyDraftOrder(orderId: number) {
    const token = await getAccessToken();
    const shopDomain = await getShopDomain();

    if (!shopDomain || !token) {
        throw new Error("Shopify credentials not configured");
    }

    // Pre-flight check
    const isConnected = await testShopifyConnection();
    if (!isConnected) {
        throw new Error("Failed to connect to Shopify. Check server logs for details (404 = Domain/Version wrong, 401 = Token wrong).");
    }

    const order = await storage.getOrder(orderId);
    if (!order) throw new Error("Order not found");

    const items = await storage.getOrderItemsByOrder(orderId);
    if (items.length === 0) throw new Error("Order has no items");

    const customer = await storage.getCustomer(order.customerId);
    if (!customer) throw new Error("Customer not found");

    console.log(`[Shopify Sync] Current Customer data for sync: ID=${customer.id}, Email=${customer.email}, Phone=${customer.phone}`);

    const shopifyCustomerId = await getOrCreateShopifyCustomer(customer);

    // Map items to Shopify line items
    const lineItems = await Promise.all(items.map(async (item) => {
        const style = await storage.getDoorStyle(item.styleId);

        // Create detailed properties for the production team
        const properties: any[] = [
            { name: "Height (mm)", value: item.heightMm.toString() },
            { name: "Width (mm)", value: item.widthMm.toString() },
            { name: "Style", value: style?.styleName || "Custom Door" },
            { name: "Panel Type", value: item.panelType },
        ];

        if (item.isAngled) {
            properties.push({ name: "Shape", value: "Angled" });
            properties.push({ name: "Short Height (mm)", value: item.angledShortHeightMm?.toString() });
        }

        if ((item.hingeQuantity || 0) > 0) {
            properties.push({ name: "Hinges", value: `${item.hingeQuantity} holes` });
        }

        return {
            title: `${style?.styleName || "Custom Door"} - ${item.heightMm}x${item.widthMm}`,
            quantity: item.quantity,
            price: item.unitPriceExcVat,
            properties,
        };
    }));

    const draftOrderBody = {
        draft_order: {
            line_items: lineItems,
            customer: {
                id: shopifyCustomerId
            },
            use_customer_default_address: true,
            note: `Custom Door Order Ref: ${order.orderReference}. Job: ${order.customerJobReference || "N/A"}. Special Requirements: ${order.specialRequirements || "None"}`,
            tags: "CustomDoorDesigner, AutomatedSync",
        },
    };

    const url = `https://${shopDomain}/admin/api/2025-01/draft_orders.json`;
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "X-Shopify-Access-Token": token,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(draftOrderBody),
    });

    const data: any = await response.json();

    if (data.errors) {
        await storage.logShopifySync({
            orderId,
            syncType: "CREATE",
            status: "FAILED",
            errorMessage: JSON.stringify(data.errors),
            shopifyResponse: data,
        });
        throw new Error(`Shopify Sync Error: ${JSON.stringify(data.errors)}`);
    }

    // Update order with Shopify IDs
    const shopifyId = data.draft_order.id.toString();
    await storage.updateOrder(orderId, {
        shopifyDraftOrderId: shopifyId,
        orderStatus: "SUBMITTED",
    });

    await storage.logShopifySync({
        orderId,
        syncType: "CREATE",
        status: "SUCCESS",
        shopifyResponse: data,
    });

    return data.draft_order;
}

/**
 * Create a quick checkout draft order directly from door configuration
 * This bypasses the need for a full customer/order flow
 */
export async function createQuickCheckout(doorConfig: {
    width: number;
    height: number;
    thickness: number;
    panelType: string;
    finish: string;
    price: number;
    quantity?: number;
    angledLeft?: boolean;
    angledRight?: boolean;
    leftAngleDegrees?: number;
    rightAngleDegrees?: number;
    midRailsEnabled?: boolean;
    midRails?: any[];
    hingeDrilling?: boolean;
    hinges?: any[];
}) {
    const token = await getAccessToken();
    const shopDomain = await getShopDomain();

    if (!shopDomain || !token) {
        throw new Error("Shopify credentials not configured");
    }

    // Pre-flight check
    const isConnected = await testShopifyConnection();
    if (!isConnected) {
        throw new Error("Failed to connect to Shopify. Check credentials.");
    }

    // Build line item properties for production details
    const properties: any[] = [
        { name: "Height (mm)", value: doorConfig.height.toString() },
        { name: "Width (mm)", value: doorConfig.width.toString() },
        { name: "Thickness (mm)", value: doorConfig.thickness.toString() },
        { name: "Panel Type", value: doorConfig.panelType },
        { name: "Finish", value: doorConfig.finish },
    ];

    if (doorConfig.angledLeft) {
        properties.push({ name: "Left Angle", value: `${doorConfig.leftAngleDegrees || 45}°` });
    }
    if (doorConfig.angledRight) {
        properties.push({ name: "Right Angle", value: `${doorConfig.rightAngleDegrees || 45}°` });
    }
    if (doorConfig.midRailsEnabled && doorConfig.midRails && doorConfig.midRails.length > 0) {
        properties.push({ name: "Mid Rails", value: `${doorConfig.midRails.length} rail(s)` });
    }
    if (doorConfig.hingeDrilling && doorConfig.hinges && doorConfig.hinges.length > 0) {
        properties.push({ name: "Hinge Holes", value: `${doorConfig.hinges.length} hole(s)` });
    }

    const doorTitle = `Custom Door - ${doorConfig.height}x${doorConfig.width}mm`;

    const draftOrderBody = {
        draft_order: {
            line_items: [
                {
                    title: doorTitle,
                    quantity: doorConfig.quantity || 1,
                    price: doorConfig.price.toFixed(2),
                    properties,
                },
            ],
            note: `Custom Door Designer Order. Dimensions: ${doorConfig.height}x${doorConfig.width}x${doorConfig.thickness}mm`,
            tags: "CustomDoorDesigner, QuickCheckout",
        },
    };

    console.log(`[Shopify] Creating quick checkout draft order...`);

    const url = `https://${shopDomain}/admin/api/2025-01/draft_orders.json`;
    const response = await fetch(url, {
        method: "POST",
        headers: {
            "X-Shopify-Access-Token": token,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(draftOrderBody),
    });

    const data: any = await response.json();

    if (data.errors || !response.ok) {
        console.error("[Shopify] Quick Checkout Error:", data.errors || data);
        throw new Error(`Shopify Error: ${JSON.stringify(data.errors || data)}`);
    }

    console.log(`[Shopify] Quick checkout created. Invoice URL: ${data.draft_order.invoice_url}`);

    return {
        draftOrderId: data.draft_order.id,
        invoiceUrl: data.draft_order.invoice_url,
        webUrl: data.draft_order.invoice_url, // Shopify checkout URL
    };
}
