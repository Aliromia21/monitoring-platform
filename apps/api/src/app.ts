import express from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import { env } from "./config/env";
import { errorHandler } from "./middleware/error.middleware";
import { createRoutes } from "./routes";
import { getQueueStats } from "./queue/index";
import { globalRateLimit, authRateLimit } from "./middleware/rateLimit.middleware";

export function createApp() {
  const app = express();

  app.use(pinoHttp());
  app.use(helmet());
  app.use(cors({ origin: env.corsOrigin === "*" ? true : env.corsOrigin, credentials: false }));
  app.use(express.json());

  // ── Rate Limiting ──────────────────────────────────────────────────
  app.use(globalRateLimit);
  app.use("/auth", authRateLimit);

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.get("/__whoami", (_req, res) =>
    res.json({ from: "apps/api/src/app.ts", apiPrefix: true, port: env.port })
  );

  app.get("/queue/stats", async (_req, res, next) => {
    try {
      const stats = await getQueueStats();
      res.json(stats);
    } catch (e) {
      next(e);
    }
  });

  app.use(createRoutes());
  app.use(errorHandler);

  return app;
}