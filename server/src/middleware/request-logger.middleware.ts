import { Request, Response, NextFunction } from "express";
import { createLogger } from "../utils/logger.utils";

const logger = createLogger("Request");

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info(
      `${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`
    );
  });

  next();
}
