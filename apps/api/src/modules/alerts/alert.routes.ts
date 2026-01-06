import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { list, markRead, markAllRead, unreadCount } from "./alert.controller";

export const alertsRouter = Router();
alertsRouter.use(requireAuth);

// List alerts
alertsRouter.get("/", list);

// Unread count
alertsRouter.get("/unread-count", unreadCount);

// Mark all as read
alertsRouter.post("/read-all", markAllRead);

// Mark single alert as read
alertsRouter.patch("/:id/read", markRead);
