import mongoose from "mongoose";
import { MonitorModel } from "../modules/monitors/monitor.model";
import { CheckRunModel } from "../modules/checkruns/checkrun.model";
import { AlertModel } from "../modules/alerts/alert.model";
import { processJob } from "../worker/monitorWorker";
import * as httpCheck from "../engine/httpCheck";
import { MonitorCheckJobData } from "../queue/index";

jest.mock("../engine/httpCheck");
const mockRunHttpCheck = httpCheck.runHttpCheck as jest.MockedFunction<
  typeof httpCheck.runHttpCheck
>;

function makeJob(data: MonitorCheckJobData) {
  return { id: "test-job-1", data } as any;
}

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

describe("Worker — processJob", () => {

  it("saves a CheckRun with status UP when HTTP check succeeds", async () => {
    mockRunHttpCheck.mockResolvedValueOnce({
      status: "UP",
      statusCode: 200,
      responseTime: 123,
      error: null,
    });

    const data = makeJobData();
    await processJob(makeJob(data));

    const checkRun = await CheckRunModel.findOne({ monitorId: data.monitorId });
    expect(checkRun).not.toBeNull();
    expect(checkRun?.status).toBe("UP");
    expect(checkRun?.statusCode).toBe(200);
    expect(checkRun?.responseTime).toBe(123);
  });

  it("saves a CheckRun with status DOWN when HTTP check fails", async () => {
    mockRunHttpCheck.mockResolvedValueOnce({
      status: "DOWN",
      statusCode: null,
      responseTime: 5000,
      error: "timeout after 5000ms",
    });

    const data = makeJobData();
    await processJob(makeJob(data));

    const checkRun = await CheckRunModel.findOne({ monitorId: data.monitorId });
    expect(checkRun?.status).toBe("DOWN");
    expect(checkRun?.error).toBe("timeout after 5000ms");
  });

  it("updates monitor nextCheckAt and lastStatus after successful check", async () => {
    mockRunHttpCheck.mockResolvedValueOnce({
      status: "UP",
      statusCode: 200,
      responseTime: 100,
      error: null,
    });

    const monitor = await MonitorModel.create({
      userId:         new mongoose.Types.ObjectId(),
      name:           "Test Monitor",
      url:            "https://example.com",
      method:         "GET",
      interval:       30,
      timeout:        5000,
      expectedStatus: 200,
      enabled:        true,
    });

    const data = makeJobData({ monitorId: monitor._id.toString() });
    await processJob(makeJob(data));

    const updated = await MonitorModel.findById(monitor._id);
    expect(updated?.lastStatus).toBe("UP");
    expect(updated?.nextCheckAt).not.toBeNull();
    expect(updated?.consecutiveFailures).toBe(0);
  });

  it("creates a DOWN alert after threshold consecutive failures", async () => {
    mockRunHttpCheck.mockResolvedValueOnce({
      status: "DOWN",
      statusCode: 500,
      responseTime: 200,
      error: "Unexpected status code: 500 (expected 200)",
    });

    const data = makeJobData({
      consecutiveFailures: 2, 
      lastStatus: "DOWN",
    });

    await processJob(makeJob(data));

    const alert = await AlertModel.findOne({ monitorId: data.monitorId });
    expect(alert).not.toBeNull();
    expect(alert?.type).toBe("DOWN");
  });

  it("creates a RECOVERY alert when monitor comes back UP after being DOWN", async () => {
    mockRunHttpCheck.mockResolvedValueOnce({
      status: "UP",
      statusCode: 200,
      responseTime: 150,
      error: null,
    });

    const data = makeJobData({
      consecutiveFailures: 3,
      lastStatus: "DOWN",
    });

    await processJob(makeJob(data));

    const alert = await AlertModel.findOne({ monitorId: data.monitorId });
    expect(alert).not.toBeNull();
    expect(alert?.type).toBe("RECOVERY");
  });

  it("does not create an alert on first failure", async () => {
    mockRunHttpCheck.mockResolvedValueOnce({
      status: "DOWN",
      statusCode: 500,
      responseTime: 200,
      error: "Unexpected status code: 500",
    });

    const data = makeJobData({
      consecutiveFailures: 0,
      lastStatus: "UP",
    });

    await processJob(makeJob(data));

    const alert = await AlertModel.findOne({ monitorId: data.monitorId });
    expect(alert).toBeNull();
  });

});