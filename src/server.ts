import cors from "cors";
import express, { Request, Response } from "express";
import helmet from "helmet";
import { config } from "./config/config";
import { errorHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/requestLogger";
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

// Root endpoint
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: "Crypto Checkout Simulator API",
    version: "1.0.0",
    endpoints: {
      checkout: "POST /api/checkout",
      webhook: "POST /api/webhook",
      health: "GET /api/health",
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
});

export default app;
