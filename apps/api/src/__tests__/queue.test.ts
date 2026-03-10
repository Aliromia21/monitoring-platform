import { monitorQueue, enqueueMonitorCheck, getQueueStats, MonitorCheckJobData } from "../queue/index";
import mongoose from "mongoose";

//Helper: building default job data
function makeJobData(overrides: Partial<MonitorCheckJobData> = {}): MonitorCheckJobData {
  return {
    monitorId:           new mongoose.Types.ObjectId().toString(),
    userId:              new mongoose.Types.ObjectId().toString(),
    url:                 "https://example.com",
    method:              "GET",
    timeoutMs:           5000,
    expectedStatus:      200,
    intervalSeconds:     30,
    consecutiveFailures: 0,
    lastStatus:          null,
    ...overrides,
  };
}

afterEach(async () => {
  // Clean up all jobs after each test
  await monitorQueue.obliterate({ force: true });
});

describe("Queue — enqueueMonitorCheck", () => {

  it("adds a job to the queue", async () => {
    const data = makeJobData();
    await enqueueMonitorCheck(data);

    const waiting = await monitorQueue.getWaiting();
    expect(waiting.length).toBe(1);
  });

  it("job contains the correct data", async () => {
    const data = makeJobData({ url: "https://mysite.com", method: "POST" });
    await enqueueMonitorCheck(data);

    const waiting = await monitorQueue.getWaiting();
    expect(waiting[0].data.url).toBe("https://mysite.com");
    expect(waiting[0].data.method).toBe("POST");
  });

  it("job id follows the monitor:id:timestamp format", async () => {
    const data = makeJobData();
    await enqueueMonitorCheck(data);

    const waiting = await monitorQueue.getWaiting();
    expect(waiting[0].id).toMatch(/^monitor:[a-f0-9]+:\d+$/);
  });

  it("enqueues multiple jobs independently", async () => {
    await enqueueMonitorCheck(makeJobData());
    await enqueueMonitorCheck(makeJobData());
    await enqueueMonitorCheck(makeJobData());

    const waiting = await monitorQueue.getWaiting();
    expect(waiting.length).toBe(3);
  });

});

describe("Queue — getQueueStats", () => {

  it("returns correct shape", async () => {
    const stats = await getQueueStats();
    expect(stats).toHaveProperty("waiting");
    expect(stats).toHaveProperty("active");
    expect(stats).toHaveProperty("completed");
    expect(stats).toHaveProperty("failed");
  });

  it("waiting count increases after enqueue", async () => {
    const before = await getQueueStats();
    await enqueueMonitorCheck(makeJobData());
    const after = await getQueueStats();

    expect(after.waiting).toBe(before.waiting + 1);
  });

});