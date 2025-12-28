import { Router } from "express";
import { authRouter } from "./modules/auth/auth.routes";
import { monitorsRouter } from "./modules/monitors/monitor.routes";
import { alertsRouter } from "./modules/alerts/alert.routes";


export function createRoutes() {
  const router = Router();

  router.use("/auth", authRouter);
  router.use("/monitors", monitorsRouter);
  router.use("/alerts", alertsRouter);


  return router;
}
