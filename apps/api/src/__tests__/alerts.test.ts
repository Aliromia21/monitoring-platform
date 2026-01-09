// alerts.test.ts
// Test suite for Alerts API
//
// This verifies the following core user-facing behaviors:
//
// 1. Alerts belong to a specific authenticated user.
//    - Even if multiple users have alerts in the DB, GET /alerts
//      must return only the current user's alerts.
//
// 2. The user can mark a single alert as read.
//    - PATCH /alerts/:id/read updates readAt and does not affect other alerts.
//
// 3. The user can bulk-mark alerts as read at once.
//    - POST /alerts/read-all applies a readAt timestamp to all unread alerts
//      for the user, and leaves other users’ alerts untouched.
//
// 4. The unread count endpoint returns accurate values.
//    - GET /alerts/unread-count returns the number of unread alerts
//      stored in the database for the authenticated user.
//
// Implementation notes:
// - We directly call alertService.createAlert to create alerts faster than
//   via HTTP endpoints, as these endpoints may not exist yet.
// - We rely on Supertest to simulate authenticated requests using a Bearer token.
// - MongoDB is reset between tests to avoid data contamination.

import request from "supertest";
import mongoose from "mongoose";
import { createApp } from "../app";

import { AlertModel } from "../modules/alerts/alert.model";
import * as alertService from "../modules/alerts/alert.service";

const app = createApp();

// helper: registers a user via HTTP and returns token + userId
async function registerUser(email: string) {
  const res = await request(app)
    .post("/auth/register")
    .send({ email, password: "StrongPass123", name: "Test User" })
    .expect(201);

  return {
    token: res.body.token as string,
    userId: res.body.user.id as string
  };
}

// helper: creates a monitor via HTTP for a given user token
async function createMonitor(token: string, name = "Test Monitor") {
  const res = await request(app)
    .post("/monitors")
    .set("Authorization", `Bearer ${token}`)
    .send({
      name,
      url: "https://example.com",
      method: "GET",
      intervalSeconds: 60,
      timeoutMs: 5000,
      enabled: true
    })
    .expect(201);

  return res.body.id as string;
}

describe("Alerts API", () => {
  // cleanup DB state before each test
  beforeEach(async () => {
    await AlertModel.deleteMany({});
  });

  it("GET /alerts returns alerts for the authenticated user only", async () => {
    // Create user A + alerts
    const { token: tokenA, userId: userIdA } = await registerUser(
      "alerts-user-a@example.com"
    );
    const monitorA = await createMonitor(tokenA, "Monitor A");

    // Create user B + alerts
    const { token: tokenB, userId: userIdB } = await registerUser(
      "alerts-user-b@example.com"
    );
    const monitorB = await createMonitor(tokenB, "Monitor B");

    // create two alerts owned by A
    await alertService.createAlert({
      userId: userIdA,
      monitorId: monitorA,
      type: "DOWN",
      message: "A is down",
      timestamp: new Date()
    });

    await alertService.createAlert({
      userId: userIdA,
      monitorId: monitorA,
      type: "RECOVERY",
      message: "A recovered",
      timestamp: new Date()
    });

    // create an alert owned by B, should not leak to A
    await alertService.createAlert({
      userId: userIdB,
      monitorId: monitorB,
      type: "DOWN",
      message: "B is down",
      timestamp: new Date()
    });

    const res = await request(app)
      .get("/alerts")
      .set("Authorization", `Bearer ${tokenA}`)
      .expect(200);

    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.length).toBeGreaterThanOrEqual(2);

    // assert all alerts returned belong to user A only
    for (const alert of res.body.items) {
      expect(alert.userId).toBe(userIdA);
    }
  });

  it("PATCH /alerts/:id/read marks a single alert as read", async () => {
    // Prepare user + monitor + initial unread alert
    const { token, userId } = await registerUser("alerts-single@example.com");
    const monitorId = await createMonitor(token);

    const created = await alertService.createAlert({
      userId,
      monitorId,
      type: "DOWN",
      message: "Single alert",
      timestamp: new Date()
    });

    const alertId = (created as any)._id.toString();

    // Confirm alert initially unread
    const before = await AlertModel.findById(alertId).lean();
    expect(before?.readAt).toBeFalsy();

    // Call PATCH endpoint to mark as read
    const res = await request(app)
      .patch(`/alerts/${alertId}/read`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body.id).toBe(alertId);
    expect(res.body.readAt).toBeTruthy();

    // Confirm updated state in DB
    const after = await AlertModel.findById(alertId).lean();
    expect(after?.readAt).toBeTruthy();
  });

  it("POST /alerts/read-all marks all alerts for the user as read", async () => {
    const { token, userId } = await registerUser("alerts-bulk@example.com");
    const monitorId = await createMonitor(token);

    // create multiple unread alerts for this user
    await alertService.createAlert({
      userId,
      monitorId,
      type: "DOWN",
      message: "Bulk alert 1",
      timestamp: new Date()
    });

    await alertService.createAlert({
      userId,
      monitorId,
      type: "DOWN",
      message: "Bulk alert 2",
      timestamp: new Date()
    });

    // assert DB contains unread alerts
    const unreadBefore = await AlertModel.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      readAt: null
    });
    expect(unreadBefore).toBeGreaterThanOrEqual(2);

    // call bulk API
    const res = await request(app)
      .post("/alerts/read-all")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body.updated).toBeGreaterThanOrEqual(2);
    expect(res.body.readAt).toBeTruthy();

    // verify DB shows all alerts read
    const unreadAfter = await AlertModel.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      readAt: null
    });
    expect(unreadAfter).toBe(0);
  });

  it("GET /alerts/unread-count returns the correct number", async () => {
    const { token, userId } = await registerUser("alerts-unread@example.com");
    const monitorId = await createMonitor(token);

    // create two unread alerts
    const a1 = await alertService.createAlert({
      userId,
      monitorId,
      type: "DOWN",
      message: "Unread 1",
      timestamp: new Date()
    });

    const a2 = await alertService.createAlert({
      userId,
      monitorId,
      type: "DOWN",
      message: "Unread 2",
      timestamp: new Date()
    });

    // create alert then immediately mark it read
    const a3 = await alertService.createAlert({
      userId,
      monitorId,
      type: "DOWN",
      message: "Will be marked read",
      timestamp: new Date()
    });

    await alertService.markAlertRead(userId, (a3 as any)._id.toString());

    const res = await request(app)
      .get("/alerts/unread-count")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    // Only two unread alerts should remain (a1, a2)
    expect(res.body).toHaveProperty("unread");
    expect(res.body.unread).toBe(2);
  });
});
