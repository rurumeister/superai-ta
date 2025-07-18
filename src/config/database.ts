import { Pool } from "pg";
import { logger } from "../utils/logger";
import { config } from "./config";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Create a connection pool
const pool = new Pool({
  host: config.database.host,
  user: config.database.user,
  password: config.database.password,
  database: config.database.name,
  port: config.database.port,
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
});

export const createConnection = async (maxRetries = 5, initialDelay = 1000) => {
  let lastError: any;

  // Log the connection details (without password)
  logger.info("Database connection details:", {
    host: config.database.host,
    user: config.database.user,
    database: config.database.name,
    port: config.database.port,
    hasPassword: !!config.database.password,
  });

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(
        `Attempting database connection (${attempt}/${maxRetries})...`
      );

      // Test the connection by getting a client from the pool
      const client = await pool.connect();
      client.release(); // Release the client back to the pool

      logger.info("Database connected successfully");
      return pool;
    } catch (error: any) {
      lastError = error;
      logger.warn(
        `Database connection attempt ${attempt} failed: ${error.message}`
      );

      if (attempt === maxRetries) {
        logger.error("All database connection attempts failed");
        throw error;
      }

      const delayMs = initialDelay * Math.pow(2, attempt - 1);
      logger.info(`Retrying database connection in ${delayMs}ms...`);
      await delay(delayMs);
    }
  }

  throw lastError;
};

// Export the pool for direct use
export { pool };
