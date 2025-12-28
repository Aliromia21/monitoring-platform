import request from "supertest";
import { createApp } from "../app";
import mongoose from "mongoose";
import { CheckRunModel } from "../modules/checkruns/checkrun.model";


async function register(app: any, email: string) {
  const res = await request(app)
    .post("/auth/register")
    .send({ email, password: "StrongPass123", name: "User" })
    .expect(201);

  return res.body.token as string;
}

async function createMonitor(app: any, token: string, body: any) {
  const res = await request(app)
    .post("/monitors")
    .set("Authorization", `Bearer ${token}`)
    .send(body)
    .expect(201);

  return res.body.monitor;
}


describe("Monitors CRUD", () => {
  const app = createApp();
  
  it("creates and lists monitors for the authenticated user", async () => {
    const token = await register(app, "a@example.com");

    const created = await request(app)
      .post("/monitors")
      .set("Authorization", `Bearer ${token}`)
      .send({
        name: "My API",
        url: "https://example.com/health",
        method: "GET",
        interval: 60,
        timeout: 5000,
        expectedStatus: 200,
        enabled: true
      })
      .expect(201);

    expect(created.body.monitor.id).toBeTruthy();
    expect(created.body.monitor.name).toBe("My API");

    const list = await request(app)
      .get("/monitors?limit=20&page=1")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(list.body.total).toBe(1);
    expect(list.body.items[0].name).toBe("My API");
  });

  it("enforces ownership: other user cannot access monitor (404)", async () => {
    const tokenA = await register(app, "b1@example.com");
    const tokenB = await register(app, "b2@example.com");

    const created = await request(app)
      .post("/monitors")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ name: "Private", url: "https://example.com/health" })
      .expect(201);

    const id = created.body.monitor.id;

    await request(app)
      .get(`/monitors/${id}`)
      .set("Authorization", `Bearer ${tokenB}`)
      .expect(404);

    await request(app)
      .put(`/monitors/${id}`)
      .set("Authorization", `Bearer ${tokenB}`)
      .send({ name: "Hacked" })
      .expect(404);

    await request(app)
      .delete(`/monitors/${id}`)
      .set("Authorization", `Bearer ${tokenB}`)
      .expect(404);
  });

  it("updates and deletes a monitor", async () => {
    const token = await register(app, "c@example.com");

    const created = await request(app)
      .post("/monitors")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "ToUpdate", url: "https://example.com/health" })
      .expect(201);

    const id = created.body.monitor.id;

    const updated = await request(app)
      .put(`/monitors/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ enabled: false, interval: 120 })
      .expect(200);

    expect(updated.body.monitor.enabled).toBe(false);
    expect(updated.body.monitor.interval).toBe(120);

    await request(app)
      .delete(`/monitors/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(204);

    await request(app)
      .get(`/monitors/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(404);
  });

  it("validates update payload (must include at least one field)", async () => {
    const token = await register(app, "d@example.com");

    const created = await request(app)
      .post("/monitors")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "X", url: "https://example.com/health" })
      .expect(201);

    const id = created.body.monitor.id;

    const res = await request(app)
      .put(`/monitors/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({})
      .expect(400);

    expect(res.body.error.code).toBe("VALIDATION_ERROR");
  });

  it("lists check history for a monitor (ownership enforced)", async () => {
  const tokenA = await register(app, "hist-a@example.com");
  const tokenB = await register(app, "hist-b@example.com");

  const created = await request(app)
    .post("/monitors")
    .set("Authorization", `Bearer ${tokenA}`)
    .send({ name: "Hist", url: "https://example.com/health", interval: 60 })
    .expect(201);

  const monitorId = created.body.monitor.id;

  // Insert 3 checkruns for user A
  const userA = (await request(app)
    .get("/auth/me")
    .set("Authorization", `Bearer ${tokenA}`)
    .expect(200)).body.user;

  const now = Date.now();

  await CheckRunModel.create([
    {
      monitorId: new mongoose.Types.ObjectId(monitorId),
      userId: new mongoose.Types.ObjectId(userA.id),
      timestamp: new Date(now - 3000),
      status: "UP",
      statusCode: 200,
      responseTime: 120,
      error: null
    },
    {
      monitorId: new mongoose.Types.ObjectId(monitorId),
      userId: new mongoose.Types.ObjectId(userA.id),
      timestamp: new Date(now - 2000),
      status: "DOWN",
      statusCode: null,
      responseTime: 5000,
      error: "timeout"
    },
    {
      monitorId: new mongoose.Types.ObjectId(monitorId),
      userId: new mongoose.Types.ObjectId(userA.id),
      timestamp: new Date(now - 1000),
      status: "UP",
      statusCode: 200,
      responseTime: 90,
      error: null
    }
  ]);

  // User A can fetch
  const resA = await request(app)
    .get(`/monitors/${monitorId}/checks?limit=50&page=1`)
    .set("Authorization", `Bearer ${tokenA}`)
    .expect(200);

  expect(resA.body.total).toBe(3);
  expect(resA.body.items[0].timestamp).toBeTruthy();
  // Sorted desc by timestamp: last inserted (now-1000) first
  expect(resA.body.items[0].status).toBe("UP");

  // User B cannot fetch (404)
  await request(app)
    .get(`/monitors/${monitorId}/checks`)
    .set("Authorization", `Bearer ${tokenB}`)
    .expect(404);
});

});

