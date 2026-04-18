import { drizzle } from "drizzle-orm/neon-serverless";
import { migrate } from "drizzle-orm/neon-serverless/migrator";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import path from "path";
import logger from "./logger";

neonConfig.webSocketConstructor = ws;

export async function runMigrations(): Promise<void> {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set before running migrations");
  }

  logger.info("Running database migrations…");

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle({ client: pool });

  try {
    await migrate(db, {
      migrationsFolder: path.resolve(process.cwd(), "migrations"),
    });
    logger.info("Database migrations completed successfully");
  } finally {
    await pool.end();
  }
}
