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
    const stats = await transactionService.getTransactionStats();

    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      transactions: stats,
    });
  } catch (error) {
    logger.error("Health check failed", { error });
    res.status(500).json({
      status: "unhealthy",
      error: "Database connection failed",
    });
  }
});

export default router;
