import { db } from "./db";
import { sql } from "drizzle-orm";

export async function runMigrations() {
    console.log("🚀 Running manual migrations...");
    try {
        // Check if the value exists first to avoid error if it's already there
        // In Postgres, we can't easily do IF NOT EXISTS for ADD VALUE in one statement before PG 12
        // But we can check the pg_enum table.

        const checkEnum = await db.execute(sql`
      SELECT 1 FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid 
      WHERE t.typname = 'panel_type' AND e.enumlabel = 'STANDARD_9MM'
    `);

        if (checkEnum.rowCount === 0) {
            console.log("Adding 'STANDARD_9MM' to panel_type enum...");
            // ALTER TYPE cannot be run inside a transaction block in some PG versions
            await db.execute(sql`ALTER TYPE panel_type ADD VALUE 'STANDARD_9MM'`);
            console.log("✅ Successfully added 'STANDARD_9MM' to panel_type enum.");
        } else {
            console.log("ℹ️ 'STANDARD_9MM' already exists in panel_type enum.");
        }
    } catch (error) {
        console.error("❌ Migration failed:", error);
        // don't throw, we want the app to start anyway if it's already fixed
    }
}
