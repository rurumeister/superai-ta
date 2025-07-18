import { Request, Response, Router } from "express";
import { TransactionService } from "../services/transactionService";
import { logger } from "../utils/logger";

const router = Router();
const transactionService = new TransactionService();

/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns API health status, uptime, memory usage, and transaction statistics
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthResponse'
 *             examples:
 *               healthy:
 *                 summary: Healthy service
 *                 value:
 *                   status: "healthy"
 *                   timestamp: "2024-01-01T12:00:00.000Z"
 *                   uptime: 3600.5
 *                   memory:
 *                     rss: 45678592
 *                     heapTotal: 16777216
 *                     heapUsed: 12345678
 *                     external: 1234567
 *                   transactions:
 *                     total: 150
 *                     pending: 5
 *                     completed: 140
 *                     failed: 5
 *       500:
 *         description: Service is unhealthy (database connection failed)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "unhealthy"
 *                 error:
 *                   type: string
 *                   example: "Database connection failed"
 *             examples:
 *               unhealthy:
 *                 summary: Unhealthy service
 *                 value:
 *                   status: "unhealthy"
 *                   error: "Database connection failed"
 */

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

export default router;
