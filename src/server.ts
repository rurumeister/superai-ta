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
import transactionRoutes from "./routes/transactions";
import webhookRoutes from "./routes/webhook";
import { logger } from "./utils/logger";

const app = express();

app.use(helmet());
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(requestLogger);

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Crypto Checkout API Documentation",
  })
);

app.get("/api-docs/swagger.json", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.json(swaggerSpec);
});

app.use("/api", healthRoutes);
app.use("/api", checkoutRoutes);
app.use("/api", webhookRoutes);
app.use("/api", transactionRoutes);

app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Crypto Checkout Simulator API",
    version: "1.0.0",
    endpoints: {
      checkout: "POST /api/checkout",
      webhook: "POST /api/webhook",
      health: "GET /api/health",
      transactions: "GET /api/transactions",
      docs: "GET /api-docs",
    },
  });
});

app.use(errorHandler);

app.use("*", (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not Found",
  });
});

const PORT = config.port;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${config.nodeEnv}`);
  logger.info(`Base URL: ${config.app.baseUrl}`);
  logger.info(`Health check: ${config.app.baseUrl}/api/health`);
  logger.info(`API Documentation: ${config.app.baseUrl}/api-docs`);

  logger.info("Environment Variables Debug:", {
    NODE_ENV: process.env.NODE_ENV,
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    DB_NAME: process.env.DB_NAME,
    DB_USER: process.env.DB_USER,
    BASE_URL: process.env.BASE_URL,
    APP_URL: process.env.APP_URL,
  });
});

export default app;
