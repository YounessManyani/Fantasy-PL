import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { ApiError } from "../types";

export function validateRequest(schema: ZodSchema) {
  return (req: Request, res: Response<ApiError>, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        error: "Validation failed",
        message: "Invalid request body",
        details: result.error.flatten(),
      });
      return;
    }

    req.body = result.data;
    next();
  };
}
