import { connectDb } from "../config/db";
import { startWorker } from "./monitorWorker";

async function main() {
  console.log("[Worker Process] Starting...");

  // Workers need MongoDB to save CheckRuns and Alerts
  await connectDb();

  const { worker, dlqWorker } = startWorker();

  // Graceful shutdown — finish current jobs before exiting
  async function shutdown() {
    console.log("[Worker Process] Shutting down gracefully...");
    await worker.close();
    await dlqWorker.close();
    process.exit(0);
  }

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  console.log("[Worker Process] Ready — waiting for jobs");
}

main().catch((e) => {
  console.error("[Worker Process] Fatal error:", e);
  process.exit(1);
});