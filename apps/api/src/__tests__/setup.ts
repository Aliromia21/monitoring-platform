import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { monitorQueue } from "../queue/index";
import { deadLetterQueue } from "../worker/monitorWorker";
import { cacheClient } from "../config/cache";

let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
});

afterEach(async () => {
  const db = mongoose.connection.db;
  if (!db) return;

  const collections = await db.collections();
  for (const c of collections) {
    await c.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
  await monitorQueue.close();
  await deadLetterQueue.close();
  await cacheClient.quit();
});