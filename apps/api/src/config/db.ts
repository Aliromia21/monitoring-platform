import mongoose from "mongoose";
import { env } from "./env";

export async function connectDb(): Promise<void> {
  await mongoose.connect(env.mongodbUri);
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
