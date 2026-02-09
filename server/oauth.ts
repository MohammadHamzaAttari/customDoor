import type { Express, Request, Response } from "express";
import { shopifyApi, ApiVersion } from "@shopify/shopify-api";
import { storage } from "./storage";

const SHOP = process.env.SHOPIFY_SHOP_DOMAIN || "tradeshakerdoors.myshopify.com";
const HOST_SCHEME = process.env.HOST_SCHEME || "http";
const HOST_NAME = process.env.HOST_NAME || "custom-door.replit.app";

const shopify = shopifyApi({
    apiKey: process.env.SHOPIFY_API_KEY || "",
    apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
    scopes: ["write_customers", "read_customers", "write_draft_orders", "read_draft_orders"],
    hostName: HOST_NAME,
    hostScheme: HOST_SCHEME as "http" | "https",
    apiVersion: ApiVersion.October24,
    isEmbeddedApp: false,
});

export function registerOAuthRoutes(app: Express) {

    app.get("/api/auth", async (req: Request, res: Response) => {
        try {
            console.log(`[OAuth] Starting auth for shop: ${SHOP}`);
            await shopify.auth.begin({
                shop: shopify.utils.sanitizeShop(SHOP, true)!,
                callbackPath: "/api/auth/callback",
                isOnline: false,
                rawRequest: req,
                rawResponse: res,
            });
        } catch (e: any) {
            console.error(`[OAuth] Error beginning auth:`, e);
            res.status(500).send(`Failed to start auth: ${e.message}`);
        }
    });

    app.get("/api/auth/callback", async (req: Request, res: Response) => {
        try {
            console.log(`[OAuth] Handling callback from: ${req.url}`);
            const callback = await shopify.auth.callback({
                rawRequest: req,
                rawResponse: res,
            });

            const { session } = callback;

            console.log(`[OAuth] Success! Token Type: ${session.isOnline ? "Online" : "Offline"}`);
            // console.log(`[OAuth] Access Token: ${session.accessToken}`); // Logged in earlier, hiding for security now

            if (session.accessToken) {
                await storage.updateSetting("shopify_access_token", session.accessToken);
                await storage.updateSetting("shopify_shop_domain", session.shop);
                console.log(`[OAuth] Token saved for: ${session.shop}`);
            }

            res.send(`
                <div style="font-family: sans-serif; text-align: center; margin-top: 50px;">
                    <h1 style="color: green;">Auth Successful!</h1>
                    <p>Token has been saved for <strong>${session.shop}</strong>.</p>
                    <p>Redirecting back to app in 3 seconds...</p>
                    <script>setTimeout(() => window.location.href = "/", 3000)</script>
                </div>
            `);

        } catch (e: any) {
            console.error(`[OAuth] Auth Callback Error:`, e);
            if (e.message.includes("fetch failed")) {
                console.error(`[OAuth] Network Error detected. Check if the server can reach Shopify's API (check DNS/Firewall).`);
            }
            res.status(500).send(`Auth Request succeeded but callback failed: ${e.message}. Check server terminal for details.`);
        }
    });
}
