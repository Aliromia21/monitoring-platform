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

export async function markRead(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError(401, "UNAUTHORIZED", "Not authenticated");

    const alertId = req.params?.id;
    if (!alertId) throw new AppError(400, "VALIDATION_ERROR", "Missing alert id");

    const updated = await alertService.markAlertRead(req.user.id, alertId);
    if (!updated) throw new AppError(404, "NOT_FOUND", "Alert not found");
      return res.json(updated);

  } catch (e) {
    return next(e);
  }
}

export async function markAllRead(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError(401, "UNAUTHORIZED", "Not authenticated");

    const result = await alertService.markAllAlertsRead(req.user.id);
    // result could be: { updated: number, readAt: string }
    return res.json(result);
  } catch (e) {
    return next(e);
  }
}

export async function unreadCount(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError(401, "UNAUTHORIZED", "Not authenticated");

    const unread = await alertService.getUnreadAlertsCount(req.user.id);
    return res.json({ unread });
  } catch (e) {
    return next(e);
  }
}
