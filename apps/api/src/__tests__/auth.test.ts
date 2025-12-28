import request from "supertest";
import { createApp } from "../app";

describe("Auth", () => {
  const app = createApp();

  it("registers a user", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({ email: "user@example.com", password: "StrongPass123", name: "Omar" })
      .expect(201);

    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe("user@example.com");
  });

  it("prevents duplicate email", async () => {
    await request(app)
      .post("/auth/register")
      .send({ email: "user@example.com", password: "StrongPass123", name: "Omar" })
      .expect(201);

    const res = await request(app)
      .post("/auth/register")
      .send({ email: "user@example.com", password: "StrongPass123", name: "Omar" })
      .expect(409);

    expect(res.body.error.code).toBe("EMAIL_ALREADY_EXISTS");
  });

  it("logs in a user", async () => {
    await request(app)
      .post("/auth/register")
      .send({ email: "user@example.com", password: "StrongPass123", name: "Omar" })
      .expect(201);

    const res = await request(app)
      .post("/auth/login")
      .send({ email: "user@example.com", password: "StrongPass123" })
      .expect(200);

    expect(res.body.token).toBeTruthy();
  });

  it("GET /auth/me requires token", async () => {
    await request(app).get("/auth/me").expect(401);
  });

  it("GET /auth/me returns user", async () => {
    const reg = await request(app)
      .post("/auth/register")
      .send({ email: "user@example.com", password: "StrongPass123", name: "Omar" })
      .expect(201);

    const token = reg.body.token;

    const res = await request(app)
      .get("/auth/me")
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    expect(res.body.user.email).toBe("user@example.com");
  });
});
