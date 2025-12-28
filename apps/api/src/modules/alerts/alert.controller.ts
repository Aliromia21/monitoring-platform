import { Response, NextFunction } from "express";
import { AuthedRequest } from "../../middleware/auth.middleware";
import { AppError } from "../../utils/errors";
import { listAlertsQuerySchema } from "./alert.schemas";
import * as alertService from "./alert.service";

export async function list(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError(401, "UNAUTHORIZED", "Not authenticated");

    const parsed = listAlertsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError(400, "VALIDATION_ERROR", "Invalid query params", parsed.error.flatten());
    }

    const result = await alertService.listAlerts(req.user.id, parsed.data);
    return res.json(result);
  } catch (e) {
    return next(e);
  }
}
