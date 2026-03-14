import { Router } from "express";
import { authRouter } from "./modules/auth/auth.routes";
import { monitorsRouter } from "./modules/monitors/monitor.routes";
import { alertsRouter } from "./modules/alerts/alert.routes";
import { requireAuth } from "./middleware/auth.middleware";
import { dashboardSummary } from "./modules/dashboard/dashboard.controller";

export function createRoutes() {
  const router = Router();

  router.use("/auth", authRouter);
  router.use("/monitors", monitorsRouter);
  router.use("/alerts", alertsRouter);

  // Dashboard
  router.get("/dashboard/summary", requireAuth, dashboardSummary);

  return router;
}