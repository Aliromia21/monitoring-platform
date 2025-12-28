import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.status).json({
      error: { code: err.code, message: err.message, details: err.details ?? undefined }
    });
  }

  return res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Unexpected server error" }
  });
}
