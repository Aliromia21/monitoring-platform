import { Response, NextFunction } from "express";
import { AuthedRequest } from "../../middleware/auth.middleware";
import { AppError } from "../../utils/errors";
import {
  createMonitorSchema,
  updateMonitorSchema,
  listMonitorsQuerySchema
} from "./monitor.schemas";
import * as monitorService from "./monitor.service";

export async function create(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError(401, "UNAUTHORIZED", "Not authenticated");

    const parsed = createMonitorSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, "VALIDATION_ERROR", "Invalid request body", parsed.error.flatten());
    }

    const created = await monitorService.createMonitor(req.user.id, parsed.data);
    return res.status(201).json({ monitor: created });
  } catch (e) {
    return next(e);
  }
}

export async function list(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError(401, "UNAUTHORIZED", "Not authenticated");

    const parsed = listMonitorsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new AppError(400, "VALIDATION_ERROR", "Invalid query params", parsed.error.flatten());
    }

    const result = await monitorService.listMonitors(req.user.id, parsed.data);
    return res.json(result);
  } catch (e) {
    return next(e);
  }
}

export async function getById(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError(401, "UNAUTHORIZED", "Not authenticated");

    const id = req.params.id;
    const monitor = await monitorService.getMonitorById(req.user.id, id);

    // 404 حتى لا نسرّب وجود resource لمستخدم آخر
    if (!monitor) throw new AppError(404, "NOT_FOUND", "Monitor not found");

    return res.json({ monitor });
  } catch (e) {
    return next(e);
  }
}

export async function update(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError(401, "UNAUTHORIZED", "Not authenticated");

    const parsed = updateMonitorSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new AppError(400, "VALIDATION_ERROR", "Invalid request body", parsed.error.flatten());
    }

    const id = req.params.id;
    const updated = await monitorService.updateMonitor(req.user.id, id, parsed.data);

    if (!updated) throw new AppError(404, "NOT_FOUND", "Monitor not found");

    return res.json({ monitor: updated });
  } catch (e) {
    return next(e);
  }
}

export async function remove(req: AuthedRequest, res: Response, next: NextFunction) {
  try {
    if (!req.user) throw new AppError(401, "UNAUTHORIZED", "Not authenticated");

    const id = req.params.id;
    const ok = await monitorService.deleteMonitor(req.user.id, id);

    if (!ok) throw new AppError(404, "NOT_FOUND", "Monitor not found");

    return res.status(204).send();
  } catch (e) {
    return next(e);
  }
}
