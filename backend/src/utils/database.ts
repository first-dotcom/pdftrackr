import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { config } from "../config";
import { logger } from "./logger";

// Create the connection
const client = postgres(config.database.url, {
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
});

// Create the database instance
export const db = drizzle(client);

// Function to run migrations automatically
export async function runMigrations() {
  try {
    logger.info("Running database migrations...");
    await migrate(db, { migrationsFolder: "./drizzle" });
    logger.info("Database migrations completed successfully");
  } catch (error) {
    logger.error("Migration failed:", error);
    throw error;
  }
}

// Function to initialize database (run migrations and test connection)
export async function initializeDatabase() {
  try {
    // Test connection first
    await client`SELECT 1`;
    logger.info("Database connection established");
    
    // Run migrations
    await runMigrations();
    
    logger.info("Database initialization completed");
  } catch (error) {
    logger.error("Database initialization failed:", error);
    throw error;
  }
}
