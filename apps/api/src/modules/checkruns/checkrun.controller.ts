import { Response, NextFunction } from "express";
import mongoose from "mongoose";
import { AuthedRequest } from "../../middleware/auth.middleware";
import { AppError } from "../../utils/errors";
import { listCheckRunsQuerySchema } from "./checkrun.schemas";
import * as checkRunService from "./checkrun.service";
import { MonitorModel } from "../monitors/monitor.model";

export async function listForMonitor(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError(401, "UNAUTHORIZED", "Not authenticated");

    const monitorId = req.params.id;
    if (!mongoose.isValidObjectId(monitorId)) {
      throw new AppError(404, "NOT_FOUND", "Monitor not found");
    }

    // Ownership enforcement: monitor must belong to user
    const monitor = await MonitorModel.findOne({
      _id: new mongoose.Types.ObjectId(monitorId),
      userId: new mongoose.Types.ObjectId(req.user.id)
    }).lean();

    if (!monitor) throw new AppError(404, "NOT_FOUND", "Monitor not found");

    const parsed = listCheckRunsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError(400, "VALIDATION_ERROR", "Invalid query params", parsed.error.flatten());
    }

    const result = await checkRunService.listCheckRuns({
      userId: req.user.id,
      monitorId,
      page: parsed.data.page,
      limit: parsed.data.limit
    });

    return res.json(result);
  } catch (e) {
    return next(e);
  }
}
