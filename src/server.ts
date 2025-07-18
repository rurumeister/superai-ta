import cors from "cors";
import express, { Request, Response } from "express";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { config } from "./config/config";
import { swaggerSpec } from "./config/swagger";
import { errorHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/requestLogger";
import checkoutRoutes from "./routes/checkout";
import healthRoutes from "./routes/health";
import webhookRoutes from "./routes/webhook";
import { logger } from "./utils/logger";

const app = express();

// Middleware
app.use(helmet());
app.use(cors());

// Request parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(requestLogger);

// Swagger Documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Crypto Checkout API Documentation",
  })
);

// Routes
app.use("/api", healthRoutes);
app.use("/api", checkoutRoutes);
app.use("/api", webhookRoutes);

/**
 * @swagger
 * /:
 *   get:
 *     summary: API Information
 *     description: Returns basic API information and available endpoints
 *     tags: [Info]
 *     responses:
 *       200:
 *         description: API information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Crypto Checkout Simulator API"
 *                 version:
 *                   type: string
 *                   example: "1.0.0"
 *                 endpoints:
 *                   type: object
 *                   properties:
 *                     checkout:
 *                       type: string
 *                       example: "POST /api/checkout"
 *                     webhook:
 *                       type: string
 *                       example: "POST /api/webhook"
 *                     health:
 *                       type: string
 *                       example: "GET /api/health"
 *                     docs:
 *                       type: string
 *                       example: "GET /api-docs"
 */

app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Crypto Checkout Simulator API",
    version: "1.0.0",
    endpoints: {
      checkout: "POST /api/checkout",
      webhook: "POST /api/webhook",
      health: "GET /api/health",
      docs: "GET /api-docs",
    },
  });
});

//Error Handler
app.use(errorHandler);

// 404 handler
app.use("*", (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not Found",
  });
});

// Start the server
const PORT = config.port;
app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📱 Environment: ${config.nodeEnv}`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/api/health`);
  logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
});

export default app;
