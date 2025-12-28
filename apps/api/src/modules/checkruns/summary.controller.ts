import mongoose from "mongoose";
import { Response, NextFunction } from "express";
import { AuthedRequest } from "../../middleware/auth.middleware";
import { AppError } from "../../utils/errors";
import { monitorSummaryQuerySchema } from "./summary.schemas";
import { MonitorModel } from "../monitors/monitor.model";
import { getMonitorSummary } from "./summary.service";

export async function summaryForMonitor(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError(401, "UNAUTHORIZED", "Not authenticated");

    const monitorId = req.params.id;
    if (!mongoose.isValidObjectId(monitorId)) {
      throw new AppError(404, "NOT_FOUND", "Monitor not found");
    }

    const exists = await MonitorModel.exists({
      _id: new mongoose.Types.ObjectId(monitorId),
      userId: new mongoose.Types.ObjectId(req.user.id)
    });

    if (!exists) throw new AppError(404, "NOT_FOUND", "Monitor not found");

    const parsed = monitorSummaryQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError(400, "VALIDATION_ERROR", "Invalid query params", parsed.error.flatten());
    }

    const summary = await getMonitorSummary({
      userId: req.user.id,
      monitorId,
      windowHours: parsed.data.windowHours
    });

    res.json({ summary });
  } catch (e) {
    next(e);
  }
}
