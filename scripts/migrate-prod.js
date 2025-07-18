#!/usr/bin/env node

const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

async function migrate() {
  console.log("🚀 Starting database migration...");

  const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT),
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    console.log("📦 Connected to PostgreSQL database");

    // Read the schema file
    const schemaPath = path.join(__dirname, "../src/database/schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");

    console.log("📄 Reading schema file...");

    // Split and execute statements
    const statements = schema
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

    for (const statement of statements) {
      if (statement.length > 0) {
        try {
          await pool.query(statement);
          console.log("✅ Executed:", statement.substring(0, 50) + "...");
        } catch (error) {
          if (error.message.includes("already exists")) {
            console.log(
              "⏭️  Skipped (already exists):",
              statement.substring(0, 50) + "..."
            );
          } else {
            throw error;
          }
        }
      }
    }

    console.log("🎉 Database migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrate();
}

module.exports = { migrate };
