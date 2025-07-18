import { readFileSync } from "fs";
import { join } from "path";
import { config } from "../config/config";
import { logger } from "../utils/logger";

async function migrate() {
  let dbConnection: any = null;

  try {
    logger.info(`Starting migration for environment: ${config.nodeEnv}`);

    if (config.nodeEnv === "production") {
      // Use PostgreSQL for production
      const { Pool } = await import("pg");
      dbConnection = new Pool({
        host: config.database.host,
        user: config.database.user,
        password: config.database.password,
        database: config.database.name,
        port: config.database.port,
      });

      logger.info("Connected to PostgreSQL database");

      // Use PostgreSQL schema
      const schemaPath = join(__dirname, "schema.sql");
      const schema = readFileSync(schemaPath, "utf8");

      const statements = schema
        .split(";")
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

      for (const statement of statements) {
        if (statement.length > 0) {
          try {
            await dbConnection.query(statement);
            logger.info("Executed:", statement.substring(0, 50) + "...");
          } catch (error) {
            if (
              error instanceof Error &&
              error.message.includes("already exists")
            ) {
              logger.info(
                "Skipped (already exists):",
                statement.substring(0, 50) + "..."
              );
            } else {
              throw error;
            }
          }
        }
      }
    } else {
      // Use MySQL for development
      const mysql = await import("mysql2/promise");

      // First connect without database to create it
      const connection = await mysql.createConnection({
        host: config.database.host,
        user: config.database.user,
        password: config.database.password,
        port: config.database.port,
        multipleStatements: true,
      });

      logger.info("Connected to MySQL server");

      await connection.execute("CREATE DATABASE IF NOT EXISTS crypto_checkout");
      logger.info("Database created/verified");

      await connection.end();

      // Connect to the specific database
      dbConnection = await mysql.createConnection({
        host: config.database.host,
        user: config.database.user,
        password: config.database.password,
        database: config.database.name,
        port: config.database.port,
        multipleStatements: true,
      });

      logger.info("Connected to crypto_checkout database");

      // Use MySQL schema
      const schemaPath = join(__dirname, "schema.mysql.sql");
      const schema = readFileSync(schemaPath, "utf8");

      const schemaWithoutDbStatements = schema
        .replace(/CREATE DATABASE IF NOT EXISTS crypto_checkout;\s*/i, "")
        .replace(/USE crypto_checkout;\s*/i, "");

      const statements = schemaWithoutDbStatements
        .split(";")
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0);

      for (const statement of statements) {
        if (statement.length > 0) {
          await dbConnection.execute(statement);
        }
      }
    }

    logger.info("Database schema created successfully");
    logger.info("Migration completed");
  } catch (error) {
    logger.error("Migration failed:", error);
    process.exit(1);
  } finally {
    if (dbConnection) {
      if (dbConnection.end) {
        await dbConnection.end();
      } else if (dbConnection.pool) {
        await dbConnection.pool.end();
      }
    }
  }
}

if (require.main === module) {
  migrate();
}

export { migrate };
