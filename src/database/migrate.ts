import { readFileSync } from "fs";
import { join } from "path";
import { Pool } from "pg";
import { config } from "../config/config";

async function migrate() {
  let pool: Pool | null = null;

  try {
    pool = new Pool({
      host: config.database.host,
      user: config.database.user,
      password: config.database.password,
      database: config.database.name,
      port: config.database.port,
    });

    console.log("Connected to PostgreSQL database");

    const schemaPath = join(__dirname, "schema.sql");
    const schema = readFileSync(schemaPath, "utf8");

    const statements = schema
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

    for (const statement of statements) {
      if (statement.length > 0) {
        try {
          await pool.query(statement);
          console.log("Executed:", statement.substring(0, 50) + "...");
        } catch (error) {
          if (
            error instanceof Error &&
            error.message.includes("already exists")
          ) {
            console.log(
              "Skipped (already exists):",
              statement.substring(0, 50) + "..."
            );
          } else {
            throw error;
          }
        }
      }
    }

    console.log("Database schema created successfully");
    console.log("Migration completed");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}

if (require.main === module) {
  migrate();
}

export { migrate };
