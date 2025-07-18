import mysql from "mysql2/promise";
import { config } from "./config";

export const createConnection = async () => {
  try {
    const connection = await mysql.createConnection({
      host: config.database.host,
      user: config.database.user,
      password: config.database.password,
      database: config.database.name,
      port: config.database.port,
    });

    console.log("✅ Database connected successfully");
    return connection;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    throw error;
  }
};
