import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { create, list, getById, update, remove } from "./monitor.controller";
import { listForMonitor } from "../checkruns/checkrun.controller";
import { summaryForMonitor } from "../checkruns/summary.controller";



export const monitorsRouter = Router();

monitorsRouter.use(requireAuth);

monitorsRouter.post("/", create);
monitorsRouter.get("/", list);
monitorsRouter.get("/:id/checks", listForMonitor);
monitorsRouter.get("/:id", getById);
monitorsRouter.put("/:id", update);
monitorsRouter.delete("/:id", remove);
monitorsRouter.get("/:id/summary", summaryForMonitor);

