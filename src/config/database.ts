import mysql from "mysql2/promise";
import { logger } from "../utils/logger";
import { config } from "./config";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const createConnection = async (
  maxRetries = 10,
  initialDelay = 1000
) => {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(
        `Attempting database connection (${attempt}/${maxRetries})...`
      );

      const connection = await mysql.createConnection({
        host: config.database.host,
        user: config.database.user,
        password: config.database.password,
        database: config.database.name,
        port: config.database.port,
        connectTimeout: 10000,
      });

      logger.info("Database connected successfully");
      return connection;
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
