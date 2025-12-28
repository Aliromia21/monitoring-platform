import { createApp } from "./app";
import { connectDb } from "./config/db";
import { startMonitoringEngine } from "./engine/monitoringEngine";
import { env } from "./config/env";

async function main() {
  await connectDb();

  const app = createApp();

  const shouldRunEngine = env.nodeEnv === "development" || env.nodeEnv === "production";
  if (shouldRunEngine) {
    startMonitoringEngine({ tickMs: 2000, maxConcurrency: 10 });
  }

  app.listen(env.port, () => {
    console.log(`API listening on http://localhost:${env.port}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
