import { readFileSync } from "fs";
import mysql from "mysql2/promise";
import { join } from "path";
import { config } from "../config/config";

async function migrate() {
  try {
    const connection = await mysql.createConnection({
      host: config.database.host,
      user: config.database.user,
      password: config.database.password,
      port: config.database.port,
      multipleStatements: true,
    });

    console.log("Connected to MySQL server");

    await connection.execute("CREATE DATABASE IF NOT EXISTS crypto_checkout");
    console.log("Database created/verified");

    await connection.end();

    const dbConnection = await mysql.createConnection({
      host: config.database.host,
      user: config.database.user,
      password: config.database.password,
      database: config.database.name,
      port: config.database.port,
      multipleStatements: true,
    });

    console.log("Connected to crypto_checkout database");

    const schemaPath = join(__dirname, "schema.sql");
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

    console.log("Database schema created successfully");

    await dbConnection.end();
    console.log("Migration completed");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  migrate();
}

export { migrate };
