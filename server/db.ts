import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
    throw new Error(
        "DATABASE_URL must be set. Did you forget to create a .env file?"
    );
}

// Create the connection pool with SSL support for cloud databases
export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false,
    },
});

// Create the Drizzle ORM instance with schema
export const db = drizzle(pool, { schema });

export type DbClient = typeof db;
