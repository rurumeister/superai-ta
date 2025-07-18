import { logger } from "../utils/logger";
import { config } from "./config";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Database interface
interface DatabaseConnection {
  query(sql: string, params?: any[]): Promise<any>;
  end?(): Promise<void>;
}

// MySQL implementation for local development
class MySQLConnection implements DatabaseConnection {
  private connection: any;

  constructor(connection: any) {
    this.connection = connection;
  }

  async query(sql: string, params?: any[]): Promise<any> {
    const [rows] = await this.connection.execute(sql, params);
    return { rows };
  }

  async end(): Promise<void> {
    await this.connection.end();
  }
}

// PostgreSQL implementation for production
class PostgreSQLConnection implements DatabaseConnection {
  private pool: any;

  constructor(pool: any) {
    this.pool = pool;
  }

  async query(sql: string, params?: any[]): Promise<any> {
    return await this.pool.query(sql, params);
  }

  async end(): Promise<void> {
    await this.pool.end();
  }
}

export const createConnection = async (
  maxRetries = 5,
  initialDelay = 1000
): Promise<DatabaseConnection> => {
  let lastError: any;

  // Log the connection details (without password)
  logger.info("Database connection details:", {
    host: config.database.host,
    user: config.database.user,
    database: config.database.name,
    port: config.database.port,
    hasPassword: !!config.database.password,
    environment: config.nodeEnv,
  });

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(
        `Attempting database connection (${attempt}/${maxRetries})...`
      );

      if (config.nodeEnv === "production") {
        // Use PostgreSQL for production
        const { Pool } = await import("pg");
        const pool = new Pool({
          host: config.database.host,
          user: config.database.user,
          password: config.database.password,
          database: config.database.name,
          port: config.database.port,
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000,
        });

        // Test the connection
        const client = await pool.connect();
        client.release();

        logger.info("PostgreSQL database connected successfully");
        return new PostgreSQLConnection(pool);
      } else {
        // Use MySQL for development
        const mysql = await import("mysql2/promise");
        const connection = await mysql.createConnection({
          host: config.database.host,
          user: config.database.user,
          password: config.database.password,
          database: config.database.name,
          port: config.database.port,
          connectTimeout: 10000,
        });

        logger.info("MySQL database connected successfully");
        return new MySQLConnection(connection);
      }
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
