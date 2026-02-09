
import "dotenv/config";

const requiredKeys = [
    "SHOPIFY_API_KEY",
    "SHOPIFY_API_SECRET",
    "SHOPIFY_SHOP_DOMAIN",
    "DATABASE_URL"
];

console.log("--- Environment Variable Verification ---");
let missing = false;

for (const key of requiredKeys) {
    const value = process.env[key];
    if (!value) {
        console.error(`[MISSING] ${key} is not set.`);
        missing = true;
    } else {
        // Show first few chars to confirm it's not empty/whitespace, but mask the rest
        const masked = value.length > 4 ? value.substring(0, 4) + "..." : "****";
        console.log(`[OK] ${key} is present (${masked})`);
    }
}

if (missing) {
    console.error("\nVerification FAILED: Some environment variables are missing.");
    process.exit(1);
} else {
    console.log("\nVerification SUCCESS: All required environment variables are present.");
    process.exit(0);
}
