import mongoose from "mongoose";

export type CheckStatus = "UP" | "DOWN";

export interface CheckRunDoc extends mongoose.Document {
  monitorId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;

  timestamp: Date;

  status: CheckStatus;
  statusCode?: number | null;

  responseTime: number; // ms
  error?: string | null;

  createdAt: Date;
  updatedAt: Date;
}

const checkRunSchema = new mongoose.Schema<CheckRunDoc>(
  {
    monitorId: { type: mongoose.Schema.Types.ObjectId, ref: "Monitor", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    timestamp: { type: Date, required: true, index: true },

    status: { type: String, required: true, enum: ["UP", "DOWN"] },
    statusCode: { type: Number, required: false, default: null },

    responseTime: { type: Number, required: true, min: 0 },
    error: { type: String, required: false, default: null }
  },
  { timestamps: true }
);

// Query patterns:
// - Monitor history: monitorId + timestamp desc
checkRunSchema.index({ monitorId: 1, timestamp: -1 });
// - User history: userId + timestamp desc
checkRunSchema.index({ userId: 1, timestamp: -1 });

export const CheckRunModel = mongoose.model<CheckRunDoc>("CheckRun", checkRunSchema);
