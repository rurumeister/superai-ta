import { Request, Response, Router } from "express";
import { TransactionService } from "../services/transactionService";
import { logger } from "../utils/logger";

const router = Router();
const transactionService = new TransactionService();

router.get("/health", async (req: Request, res: Response) => {
  try {
    // Basic health check - always respond quickly
    const basicHealth = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || "development",
      version: "1.0.0",
    };

    // Try to get database stats, but don't fail if it doesn't work
    try {
      const stats = await transactionService.getTransactionStats();
      res.json({
        ...basicHealth,
        transactions: stats,
        database: "connected",
      });
    } catch (dbError) {
      logger.warn("Database health check failed, but service is healthy", {
        dbError,
      });
      res.json({
        ...basicHealth,
        transactions: {
          total: 0,
          pending: 0,
          completed: 0,
          failed: 0,
        },
        database: "disconnected",
      });
    }
  } catch (error) {
    logger.error("Health check failed", { error });
    res.status(500).json({
      status: "unhealthy",
      error: "Service error",
      timestamp: new Date().toISOString(),
    });
  }
});

router.get("/ping", (req: Request, res: Response) => {
  res.json({
    message: "pong",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

router.get("/db-status", async (req: Request, res: Response) => {
  try {
    const { config } = await import("../config/config");

    res.json({
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      database: {
        host: config.database.host,
        user: config.database.user,
        database: config.database.name,
        port: config.database.port,
        hasPassword: !!config.database.password,
      },
      env_vars: {
        DB_HOST: process.env.DB_HOST,
        DB_USER: process.env.DB_USER,
        DB_NAME: process.env.DB_NAME,
        DB_PORT: process.env.DB_PORT,
        NODE_ENV: process.env.NODE_ENV,
        BASE_URL: process.env.BASE_URL,
      },
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to get database status",
      details: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

router.get("/db-test", async (req: Request, res: Response) => {
  try {
    logger.info("Testing database connection...");

    const { createConnection } = await import("../config/database");
    const db = await createConnection();

    const result = await db.query(
      "SELECT NOW() as current_time, version() as db_version"
    );

    res.json({
      success: true,
      message: "Database connection successful",
      timestamp: new Date().toISOString(),
      database: {
        current_time: result.rows[0]?.current_time,
        version: result.rows[0]?.db_version,
      },
    });
  } catch (error) {
    logger.error("Database test failed:", error);
    res.status(500).json({
      success: false,
      error: "Database connection failed",
      details: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
