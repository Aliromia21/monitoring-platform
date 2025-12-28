import dotenv from "dotenv";
dotenv.config();

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

const nodeEnv = process.env.NODE_ENV ?? "development";
const isTest = nodeEnv === "test";

export const env = {
  nodeEnv,
  port: Number(process.env.PORT ?? "4000"),

  // في التست لا نحتاج Mongo URI لأننا نستخدم MongoMemoryServer
  mongodbUri: isTest ? (process.env.MONGODB_URI ?? "") : requireEnv("MONGODB_URI"),

  jwtSecret: process.env.JWT_SECRET ?? (isTest ? "test_secret" : requireEnv("JWT_SECRET")),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",

  bcryptCost: Number(process.env.BCRYPT_COST ?? "12"),

  corsOrigin: process.env.CORS_ORIGIN ?? "*"
};
