import { MonitorModel } from "../modules/monitors/monitor.model";
import { enqueueMonitorCheck } from "../queue/index";

type EngineOptions = {
  tickMs?: number;
  maxConcurrency?: number;
};

export function startMonitoringEngine(opts: EngineOptions = {}) {
  const tickMs = opts.tickMs ?? 2000;

  let running = false;

  async function tick() {
    if (running) return;
    running = true;

    try {
      const now = new Date();

      const due = await MonitorModel.find({
  enabled: true,
  $or: [
    { nextCheckAt: null },
    { nextCheckAt: { $exists: false } },  
    { nextCheckAt: { $lte: now } }
  ]
})
        .sort({ nextCheckAt: 1 })
        .limit(200)
        .lean();

      console.log(`[Engine] tick — found ${due.length} due monitors`); 

     for (const m of due) {
    await enqueueMonitorCheck({
      monitorId:           m._id.toString(),
      userId:              m.userId.toString(),
      url:                 m.url,
      method:              m.method,
      timeoutMs:           m.timeout,
      expectedStatus:      m.expectedStatus,
      intervalSeconds:     m.interval,
      consecutiveFailures: m.consecutiveFailures ?? 0,
      lastStatus:          (m.lastStatus ?? null) as "UP" | "DOWN" | null,
    });
  }
    } finally {
      running = false;
    }
  }

  const interval = setInterval(() => void tick(), tickMs);
  void tick();

  return {
    stop: () => clearInterval(interval)
  };
}