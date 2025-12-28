import mongoose from "mongoose";

export type HttpMethod = "GET" | "POST" | "PUT" | "HEAD";
export type MonitorStatus = "UP" | "DOWN";

export interface MonitorDoc extends mongoose.Document {
  userId: mongoose.Types.ObjectId;

  name: string;
  type: "HTTP";

  url: string;
  method: HttpMethod;

  interval: number;        // seconds
  timeout: number;         // ms
  expectedStatus: number;  // e.g. 200
  enabled: boolean;

  // Engine fields (Phase 3)
  lastCheckedAt: Date | null;
  nextCheckAt: Date | null;

  lastStatus: MonitorStatus | null;
  lastStatusCode: number | null;
  lastResponseTime: number | null;

  consecutiveFailures: number;

  createdAt: Date;
  updatedAt: Date;
}

const monitorSchema = new mongoose.Schema<MonitorDoc>(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    name: { type: String, required: true, trim: true, maxlength: 120 },
    type: { type: String, required: true, enum: ["HTTP"], default: "HTTP" },

    url: { type: String, required: true, trim: true, maxlength: 2048 },
    method: { type: String, required: true, enum: ["GET", "POST", "PUT", "HEAD"], default: "GET" },

    interval: { type: Number, required: true, min: 10, max: 3600, default: 60 },
    timeout: { type: Number, required: true, min: 100, max: 30000, default: 5000 },

    expectedStatus: { type: Number, required: true, min: 100, max: 599, default: 200 },
    enabled: { type: Boolean, required: true, default: true },

    // Engine fields
    lastCheckedAt: { type: Date, required: false, default: null },
    nextCheckAt: { type: Date, required: false, default: null },

    lastStatus: { type: String, required: false, enum: ["UP", "DOWN"], default: null },
    lastStatusCode: { type: Number, required: false, default: null },
    lastResponseTime: { type: Number, required: false, default: null },

    consecutiveFailures: { type: Number, required: true, min: 0, default: 0 }
  },
  { timestamps: true }
);

// Listing per-user
monitorSchema.index({ userId: 1, createdAt: -1 });

// Scheduler scan optimization
monitorSchema.index({ enabled: 1, nextCheckAt: 1 });

export const MonitorModel = mongoose.model<MonitorDoc>("Monitor", monitorSchema);
