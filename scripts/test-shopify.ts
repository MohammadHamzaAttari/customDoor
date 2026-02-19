import dotenv from "dotenv";
dotenv.config();
import { testShopifyConnection } from "../server/shopify";

async function runTest() {
    console.log("Testing Shopify connection...");
    console.log("Domain:", process.env.SHOPIFY_SHOP_DOMAIN);
    console.log("Token Prefix:", process.env.SHOPIFY_ACCESS_TOKEN?.substring(0, 10));

    const success = await testShopifyConnection();
    if (success) {
        console.log("✅ Shopify connection successful!");
    } else {
        console.log("❌ Shopify connection failed.");
    }
}

runTest().catch(console.error);
