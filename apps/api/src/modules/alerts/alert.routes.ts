import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { list } from "./alert.controller";

export const alertsRouter = Router();
alertsRouter.use(requireAuth);

alertsRouter.get("/", list);
