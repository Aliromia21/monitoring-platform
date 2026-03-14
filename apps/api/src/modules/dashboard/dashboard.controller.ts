import { Response, NextFunction } from "express";
import { AuthedRequest } from "../../middleware/auth.middleware";
import { AppError } from "../../utils/errors";
import { getDashboardSummary } from "./dashboard.service";

export async function dashboardSummary(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError(401, "UNAUTHORIZED", "Not authenticated");

    const summary = await getDashboardSummary(req.user.id);
    res.json({ summary });
  } catch (e) {
    next(e);
  }
}