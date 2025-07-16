import { NextFunction, Request, Response } from "express";
import { logger } from "../utils/logger";

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error("Unhandled error", {
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.url,
    body: req.body,
  });

  res.status(500).json({
    success: false,
    error: "Internal server error",
  });
};
