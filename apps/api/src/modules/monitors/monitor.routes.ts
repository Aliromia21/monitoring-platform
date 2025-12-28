import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { create, list, getById, update, remove } from "./monitor.controller";
import { listForMonitor } from "../checkruns/checkrun.controller";


export const monitorsRouter = Router();

monitorsRouter.use(requireAuth);

monitorsRouter.post("/", create);
monitorsRouter.get("/", list);
monitorsRouter.get("/:id/checks", listForMonitor);
monitorsRouter.get("/:id", getById);
monitorsRouter.put("/:id", update);
monitorsRouter.delete("/:id", remove);
