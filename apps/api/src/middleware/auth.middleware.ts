import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/errors";
import { verifyToken } from "../utils/jwt";

export interface AuthedRequest extends Request {
  user?: { id: string; email: string };
}

export function requireAuth(req: AuthedRequest, _res: Response, next: NextFunction) {
  const header = req.header("Authorization");
  if (!header?.startsWith("Bearer ")) {
    return next(new AppError(401, "UNAUTHORIZED", "Missing or invalid Authorization header"));
  }
  const token = header.slice("Bearer ".length).trim();
  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, email: payload.email };
    return next();
  } catch {
    return next(new AppError(401, "UNAUTHORIZED", "Invalid or expired token"));
  }
}
