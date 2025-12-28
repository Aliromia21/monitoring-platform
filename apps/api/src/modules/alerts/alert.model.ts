import mongoose from "mongoose";

export type AlertType = "DOWN" | "RECOVERY";

export interface AlertDoc extends mongoose.Document {
  monitorId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;

  type: AlertType;
  message: string;

  timestamp: Date;

  createdAt: Date;
  updatedAt: Date;
}

const alertSchema = new mongoose.Schema<AlertDoc>(
  {
    monitorId: { type: mongoose.Schema.Types.ObjectId, ref: "Monitor", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    type: { type: String, required: true, enum: ["DOWN", "RECOVERY"] },
    message: { type: String, required: true, maxlength: 500 },

    timestamp: { type: Date, required: true, index: true }
  },
  { timestamps: true }
);

alertSchema.index({ monitorId: 1, timestamp: -1 });
alertSchema.index({ userId: 1, timestamp: -1 });

export const AlertModel = mongoose.model<AlertDoc>("Alert", alertSchema);
