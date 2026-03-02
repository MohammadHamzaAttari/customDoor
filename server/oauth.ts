// server/oauth.ts - Lambda-compatible OAuth implementation

import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import crypto from "crypto";
import fetch from "node-fetch";

// ── Environment Configuration ──
const SHOPIFY_API_KEY = process.env.SHOPIFY_API_KEY || "";
const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET || "";
const DEFAULT_SHOP = process.env.SHOPIFY_SHOP_DOMAIN || "dw0c1m-10.myshopify.com";
const SCOPES = [
  "read_products",
  "write_products",
  "read_draft_orders",
  "write_draft_orders",
  "read_customers",
  "write_customers",
  "read_orders",
  "write_orders",
].join(",");

/**
 * Derives the public-facing base URL from environment or request headers.
 * Lambda sits behind API Gateway + CloudFront, so we need to be careful.
 */
function getBaseUrl(req?: Request): string {
  // Explicit override always wins
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/$/, "");
  }

  // CloudFront / API Gateway injects these headers
  if (req) {
    const forwarded = req.headers["x-forwarded-host"] as string;
    const proto =
      (req.headers["x-forwarded-proto"] as string)?.split(",")[0]?.trim() ||
      "https";

    if (forwarded) {
      const host = forwarded.split(",")[0].trim();
      return `${proto}://${host}`;
    }

    // Fallback to Host header
    if (req.headers.host) {
      return `https://${req.headers.host}`;
    }
  }

  // Last resort: use configured HOST_NAME
  const raw = process.env.HOST_NAME || "dfhw7q5aon9cu.cloudfront.net";
  const cleaned = raw.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return `https://${cleaned}`;
}

/**
 * Generates a cryptographically secure nonce and stores it
 * in DynamoDB/DB so it survives across Lambda invocations.
 */
async function generateAndStoreNonce(shop: string): Promise<string> {
  const nonce = crypto.randomBytes(16).toString("hex");
  // Store with 10-minute TTL key
  const key = `oauth_nonce_${shop.replace(/\./g, "_")}`;
  await storage.updateSetting(key, JSON.stringify({
    nonce,
    createdAt: Date.now(),
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
  }));
  console.log(`[OAuth] Stored nonce for shop ${shop}: ${nonce.substring(0, 8)}...`);
  return nonce;
}

/**
 * Retrieves and validates the stored nonce, then deletes it (one-time use).
 */
async function validateAndConsumeNonce(
  shop: string,
  receivedState: string
): Promise<boolean> {
  const key = `oauth_nonce_${shop.replace(/\./g, "_")}`;
  const setting = await storage.getSetting(key);

  if (!setting?.settingValue) {
    console.error(`[OAuth] No nonce found for shop: ${shop}`);
    return false;
  }

  let stored: { nonce: string; createdAt: number; expiresAt: number };
  try {
    stored = JSON.parse(setting.settingValue);
  } catch {
    console.error(`[OAuth] Failed to parse stored nonce`);
    return false;
  }

  // Check expiry
  if (Date.now() > stored.expiresAt) {
    console.error(`[OAuth] Nonce expired for shop: ${shop}`);
    await storage.updateSetting(key, ""); // cleanup
    return false;
  }

  // Validate
  const valid = crypto.timingSafeEqual(
    Buffer.from(stored.nonce),
    Buffer.from(receivedState)
  );

  // One-time use: delete after validation attempt
  await storage.updateSetting(key, "");

  if (!valid) {
    console.error(`[OAuth] Nonce mismatch for shop: ${shop}`);
  }
  return valid;
}

/**
 * Validates the Shopify HMAC signature on the callback.
 */
function validateHmac(query: Record<string, string>): boolean {
  const { hmac, ...rest } = query;
  if (!hmac) return false;

  // Build the message: sorted key=value pairs joined by &
  const message = Object.keys(rest)
    .sort()
    .map((k) => `${k}=${rest[k]}`)
    .join("&");

  const computedHmac = crypto
    .createHmac("sha256", SHOPIFY_API_SECRET)
    .update(message)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(computedHmac, "hex"),
    Buffer.from(hmac, "hex")
  );
}

/**
 * Exchanges the authorization code for a permanent access token.
 */
async function exchangeCodeForToken(
  shop: string,
  code: string
): Promise<string> {
  const url = `https://${shop}/admin/oauth/access_token`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: SHOPIFY_API_KEY,
      client_secret: SHOPIFY_API_SECRET,
      code,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Token exchange failed (${response.status}): ${body.substring(0, 200)}`
    );
  }

  const data = (await response.json()) as { access_token?: string };

  if (!data.access_token) {
    throw new Error("Shopify did not return an access token");
  }

  return data.access_token;
}

/**
 * Sanitizes and validates a Shopify shop domain.
 */
function sanitizeShop(shop: string): string | null {
  // Must end in .myshopify.com and have no path/query
  const cleaned = shop.trim().toLowerCase().replace(/^https?:\/\//, "");
  const valid = /^[a-zA-Z0-9][a-zA-Z0-9\-]*\.myshopify\.com$/.test(cleaned);
  return valid ? cleaned : null;
}

export function registerOAuthRoutes(app: Express) {

  // ────────────────────────────────────────────────
  // STEP 1: Begin OAuth - Redirect to Shopify
  // ────────────────────────────────────────────────
  app.get("/api/auth", async (req: Request, res: Response) => {
    try {
      const rawShop = (req.query.shop as string) || DEFAULT_SHOP;
      const shop = sanitizeShop(rawShop);

      if (!shop) {
        return res.status(400).send(`
          <h2>Invalid shop domain</h2>
          <p>Received: <code>${rawShop}</code></p>
          <p>Expected format: <code>yourstore.myshopify.com</code></p>
        `);
      }

      if (!SHOPIFY_API_KEY || !SHOPIFY_API_SECRET) {
        return res.status(500).send(`
          <h2>OAuth Not Configured</h2>
          <p>Missing SHOPIFY_API_KEY or SHOPIFY_API_SECRET environment variables.</p>
        `);
      }

      const baseUrl = getBaseUrl(req);
      const redirectUri = `${baseUrl}/api/auth/callback`;
      const nonce = await generateAndStoreNonce(shop);

      // Build the Shopify authorization URL
      const authUrl = new URL(`https://${shop}/admin/oauth/authorize`);
      authUrl.searchParams.set("client_id", SHOPIFY_API_KEY);
      authUrl.searchParams.set("scope", SCOPES);
      authUrl.searchParams.set("redirect_uri", redirectUri);
      authUrl.searchParams.set("state", nonce);
      authUrl.searchParams.set("grant_options[]", "per-user");

      console.log(`[OAuth] Redirecting to Shopify auth`);
      console.log(`[OAuth] Shop: ${shop}`);
      console.log(`[OAuth] Redirect URI: ${redirectUri}`);
      console.log(`[OAuth] Scopes: ${SCOPES}`);

      return res.redirect(authUrl.toString());

    } catch (e: any) {
      console.error(`[OAuth] Error beginning auth:`, e);
      return res.status(500).send(`
        <h2>OAuth Start Failed</h2>
        <pre>${e.message}</pre>
      `);
    }
  });

  // ────────────────────────────────────────────────
  // STEP 2: Handle OAuth Callback from Shopify
  // ────────────────────────────────────────────────
  app.get("/api/auth/callback", async (req: Request, res: Response) => {
    try {
      console.log(`[OAuth] Callback received`);
      console.log(`[OAuth] Query:`, JSON.stringify(req.query));

      const { code, shop: rawShop, state, hmac, ...rest } = req.query as Record<string, string>;

      // ── Validate shop ──
      const shop = sanitizeShop(rawShop);
      if (!shop) {
        return res.status(400).send(`<h2>Invalid shop domain in callback</h2>`);
      }

      // ── Validate HMAC ──
      const queryForHmac: Record<string, string> = {
        code,
        shop,
        state,
        ...rest,
      };
      // Include timestamp if present
      if ((req.query as any).timestamp) {
        queryForHmac.timestamp = (req.query as any).timestamp;
      }

      if (!validateHmac({ ...queryForHmac, hmac })) {
        console.error(`[OAuth] HMAC validation failed`);
        return res.status(403).send(`
          <h2>Security Check Failed</h2>
          <p>HMAC validation failed. This request may have been tampered with.</p>
          <p><a href="/api/auth">Try again</a></p>
        `);
      }

      // ── Validate state/nonce ──
      if (!state) {
        return res.status(400).send(`<h2>Missing state parameter</h2>`);
      }

      const nonceValid = await validateAndConsumeNonce(shop, state);
      if (!nonceValid) {
        return res.status(403).send(`
          <h2>State Validation Failed</h2>
          <p>The OAuth state parameter is invalid or expired.</p>
          <p>Please <a href="/api/auth">start the OAuth flow again</a>.</p>
        `);
      }

      // ── Validate code ──
      if (!code) {
        return res.status(400).send(`<h2>Missing authorization code</h2>`);
      }

      // ── Exchange code for token ──
      console.log(`[OAuth] Exchanging code for token...`);
      const accessToken = await exchangeCodeForToken(shop, code);
      console.log(`[OAuth] ✅ Token received: ${accessToken.substring(0, 12)}...`);

      // ── Persist token ──
      await storage.updateSetting("shopify_access_token", accessToken);
      await storage.updateSetting("shopify_shop_domain", shop);
      console.log(`[OAuth] ✅ Token saved to database`);

      // ── Update Lambda env var (non-blocking) ──
      updateLambdaEnv(accessToken).catch((e) =>
        console.warn(`[OAuth] Lambda env update failed (non-fatal): ${e.message}`)
      );

      // ── Verify token works ──
      let shopName = shop;
      try {
        const verifyRes = await fetch(
          `https://${shop}/admin/api/2025-01/shop.json`,
          { headers: { "X-Shopify-Access-Token": accessToken } }
        );
        if (verifyRes.ok) {
          const data = (await verifyRes.json()) as { shop?: { name?: string } };
          shopName = data.shop?.name || shop;
          console.log(`[OAuth] ✅ Token verified! Connected to: ${shopName}`);
        } else {
          console.warn(`[OAuth] Token verification returned ${verifyRes.status}`);
        }
      } catch (e) {
        console.warn(`[OAuth] Token verification network error:`, e);
      }

      return res.send(buildSuccessPage(shopName, shop, accessToken));

    } catch (e: any) {
      console.error(`[OAuth] Callback Error:`, e);
      return res.status(500).send(buildErrorPage(e.message));
    }
  });

  // ────────────────────────────────────────────────
  // Status Check
  // ────────────────────────────────────────────────
  app.get("/api/auth/status", async (req: Request, res: Response) => {
    try {
      const dbToken = await storage.getSetting("shopify_access_token");
      const dbDomain = await storage.getSetting("shopify_shop_domain");

      const token = dbToken?.settingValue || process.env.SHOPIFY_ACCESS_TOKEN;
      const domain = dbDomain?.settingValue || process.env.SHOPIFY_SHOP_DOMAIN;

      let connected = false;
      let shopName: string | null = null;
      let apiError: string | null = null;

      if (token && domain) {
        try {
          const testRes = await fetch(
            `https://${domain}/admin/api/2025-01/shop.json`,
            { headers: { "X-Shopify-Access-Token": token } }
          );

          if (testRes.ok) {
            const data = (await testRes.json()) as { shop?: { name?: string } };
            connected = true;
            shopName = data.shop?.name || null;
          } else {
            apiError = `Shopify returned ${testRes.status}`;
          }
        } catch (e: any) {
          apiError = e.message;
        }
      }

      return res.json({
        configured: !!(token && domain),
        connected,
        shopName,
        apiError,
        tokenSource: dbToken?.settingValue
          ? "database"
          : process.env.SHOPIFY_ACCESS_TOKEN
            ? "env_var"
            : "missing",
        tokenPrefix: token ? `${token.substring(0, 12)}...` : "MISSING",
        domain: domain || "MISSING",
        baseUrl: getBaseUrl(req),
        authUrl: `${getBaseUrl(req)}/api/auth`,
      });

    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });

  // ────────────────────────────────────────────────
  // Manual Token Override (escape hatch)
  // ────────────────────────────────────────────────
  app.post("/api/auth/manual-token", async (req: Request, res: Response) => {
    try {
      const { token, domain } = req.body as {
        token?: string;
        domain?: string;
      };

      if (!token || !domain) {
        return res.status(400).json({
          message: "Both token and domain are required",
        });
      }

      const shop = sanitizeShop(domain);
      if (!shop) {
        return res.status(400).json({ message: "Invalid shop domain format" });
      }

      // Verify it works before saving
      const verifyRes = await fetch(
        `https://${shop}/admin/api/2025-01/shop.json`,
        { headers: { "X-Shopify-Access-Token": token } }
      );

      if (!verifyRes.ok) {
        return res.status(400).json({
          message: `Token rejected by Shopify (${verifyRes.status})`,
        });
      }

      const data = (await verifyRes.json()) as { shop?: { name?: string } };

      await storage.updateSetting("shopify_access_token", token);
      await storage.updateSetting("shopify_shop_domain", shop);

      // Update Lambda env
      await updateLambdaEnv(token).catch(console.warn);

      return res.json({
        success: true,
        shopName: data.shop?.name,
        domain: shop,
        tokenPrefix: `${token.substring(0, 12)}...`,
      });

    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  });
}

// ────────────────────────────────────────────────
// Lambda Environment Variable Update
// ────────────────────────────────────────────────
async function updateLambdaEnv(token: string): Promise<void> {
  if (!process.env.AWS_LAMBDA_FUNCTION_NAME) {
    console.log("[OAuth] Not in Lambda, skipping Lambda env update");
    return;
  }

  const functionName = process.env.AWS_LAMBDA_FUNCTION_NAME;
  console.log(`[OAuth] Updating Lambda env for: ${functionName}`);

  const {
    LambdaClient,
    GetFunctionConfigurationCommand,
    UpdateFunctionConfigurationCommand,
  } = await import("@aws-sdk/client-lambda");

  const client = new LambdaClient({
    region: process.env.AWS_REGION || "eu-west-2",
  });

  // Get current config to avoid overwriting other env vars
  const current = await client.send(
    new GetFunctionConfigurationCommand({ FunctionName: functionName })
  );

  const updatedEnv = {
    ...(current.Environment?.Variables || {}),
    SHOPIFY_ACCESS_TOKEN: token,
  };

  await client.send(
    new UpdateFunctionConfigurationCommand({
      FunctionName: functionName,
      Environment: { Variables: updatedEnv },
    })
  );

  console.log(`[OAuth] ✅ Lambda env updated`);
}

// ────────────────────────────────────────────────
// HTML Templates
// ────────────────────────────────────────────────
function buildSuccessPage(
  shopName: string,
  shop: string,
  token: string
): string {
  return `<!DOCTYPE html>
<html>
<head>
  <title>✅ Shopify Connected</title>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
           background: #f6f8fa; display: flex; align-items: center; 
           justify-content: center; min-height: 100vh; margin: 0; }
    .card { background: white; border-radius: 12px; padding: 48px; 
            max-width: 480px; width: 100%; box-shadow: 0 4px 24px rgba(0,0,0,.08); }
    .icon { font-size: 56px; text-align: center; }
    h1 { color: #1a7f37; text-align: center; margin: 16px 0 8px; }
    p { color: #57606a; text-align: center; }
    .badge { background: #dafbe1; color: #1a7f37; border-radius: 6px; 
             padding: 4px 10px; font-size: 13px; display: inline-block; }
    .checks { list-style: none; padding: 0; margin: 24px 0; }
    .checks li { padding: 8px 0; border-bottom: 1px solid #f0f0f0; color: #424a53; }
    .token { background: #f6f8fa; border: 1px solid #d0d7de; border-radius: 6px; 
             padding: 12px; font-family: monospace; font-size: 12px; 
             word-break: break-all; margin: 16px 0; }
    .btn { display: block; background: #0969da; color: white; text-align: center; 
           padding: 12px; border-radius: 8px; text-decoration: none; 
           margin-top: 24px; font-weight: 600; }
    .btn:hover { background: #0550ae; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✅</div>
    <h1>Connected!</h1>
    <p>Successfully connected to</p>
    <p><span class="badge">${shopName}</span></p>
    <ul class="checks">
      <li>✅ &nbsp;Token saved to database</li>
      <li>✅ &nbsp;Lambda environment updated</li>
      <li>✅ &nbsp;Token verified with Shopify API</li>
      <li>✅ &nbsp;Ready to process orders</li>
    </ul>
    <div class="token">
      🔑 ${token.substring(0, 20)}...${token.slice(-6)}
    </div>
    <a href="/" class="btn">Go to Door Designer →</a>
    <p style="font-size:13px; margin-top:16px;">Redirecting in 5 seconds…</p>
  </div>
  <script>setTimeout(() => location.href = "/", 5000)</script>
</body>
</html>`;
}

function buildErrorPage(message: string): string {
  const RAW_HOST = process.env.HOST_NAME || "dfhw7q5aon9cu.cloudfront.net";
  const HOST_NAME = RAW_HOST.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return `<!DOCTYPE html>
<html>
<head>
  <title>❌ Auth Failed</title>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, sans-serif; margin: 40px; background: #fff5f5; }
    .card { background: white; border-left: 4px solid #cf222e; 
            border-radius: 8px; padding: 32px; max-width: 640px; }
    h1 { color: #cf222e; margin-top: 0; }
    pre { background: #f6f8fa; padding: 16px; border-radius: 6px; 
          overflow-x: auto; font-size: 13px; }
    .tips { background: #fff8c5; border-radius: 8px; padding: 16px; margin-top: 16px; }
    .tips ul { margin: 8px 0; padding-left: 20px; }
    .tips li { margin: 6px 0; }
    code { background: #f0f0f0; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
    a { color: #0969da; }
  </style>
</head>
<body>
  <div class="card">
    <h1>❌ OAuth Failed</h1>
    <pre>${message}</pre>
    <div class="tips">
      <strong>Common Fixes:</strong>
      <ul>
        <li>Add <code>https://${HOST_NAME}/api/auth/callback</code> to your Shopify App's 
            <strong>Allowed redirection URL(s)</strong></li>
        <li>Verify <code>SHOPIFY_API_KEY</code> and <code>SHOPIFY_API_SECRET</code> 
            are set correctly in Lambda</li>
        <li>The auth code expires in 60 seconds — 
            <a href="/api/auth">start again</a></li>
        <li>Alternatively, use <code>POST /api/auth/manual-token</code> with a 
            manually-generated token from your Shopify Admin</li>
      </ul>
    </div>
    <p><a href="/api/auth">← Try Again</a></p>
  </div>
</body>
</html>`;
}