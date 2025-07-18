import dotenv from "dotenv";
import fs from "fs";
import path from "path";

const nodeEnv = process.env.NODE_ENV || "development";
const envFile = `.env.${nodeEnv}`;
const envPath = path.resolve(process.cwd(), envFile);

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

export const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  database: {
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    name: process.env.DB_NAME || "crypto_checkout",
    port: parseInt(process.env.DB_PORT || "3306"),
  },
  coinbase: {
    apiKey: process.env.COINBASE_API_KEY || "fake-api-key",
    webhookSecret: process.env.COINBASE_WEBHOOK_SECRET || "fake-webhook-secret",
  },
  app: {
    baseUrl: process.env.BASE_URL || "http://localhost:3000",
  },
};
