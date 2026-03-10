import nodemailer from "nodemailer";
import { env } from "../config/env";

// ── Transporter 
//fake transporter that never sends real emails for testing 
function createTransporter() {
  if (env.nodeEnv === "test") {
    return nodemailer.createTransport({ jsonTransport: true });
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });
}

export const transporter = createTransporter();

// ── Email Templates
export type NotificationPayload = {
  to: string;
  monitorName: string;
  url: string;
  type: "DOWN" | "RECOVERY" | "SYSTEM_ERROR";
  message: string;
  timestamp: Date;
};

function buildSubject(payload: NotificationPayload): string {
  switch (payload.type) {
    case "DOWN":        return `🔴 DOWN: ${payload.monitorName} is unreachable`;
    case "RECOVERY":    return `🟢 RECOVERY: ${payload.monitorName} is back online`;
    case "SYSTEM_ERROR": return `⚠️ ERROR: ${payload.monitorName} check failed`;
  }
}

function buildText(payload: NotificationPayload): string {
  const time = payload.timestamp.toUTCString();

  switch (payload.type) {
    case "DOWN":
      return [
        `Your monitor "${payload.monitorName}" is DOWN.`,
        `URL: ${payload.url}`,
        `Reason: ${payload.message}`,
        `Time: ${time}`,
      ].join("\n");

    case "RECOVERY":
      return [
        `Your monitor "${payload.monitorName}" has recovered.`,
        `URL: ${payload.url}`,
        `Time: ${time}`,
      ].join("\n");

    case "SYSTEM_ERROR":
      return [
        `Monitor check failed for "${payload.monitorName}".`,
        `URL: ${payload.url}`,
        `Error: ${payload.message}`,
        `Time: ${time}`,
      ].join("\n");
  }
}

// ── Main Function 
export async function sendAlertNotification(
  payload: NotificationPayload
): Promise<void> {
  const mailOptions = {
    from:    env.smtpFrom,
    to:      payload.to,
    subject: buildSubject(payload),
    text:    buildText(payload),
  };

  await transporter.sendMail(mailOptions);

  console.log(`[Notifications] Sent ${payload.type} email to ${payload.to} for ${payload.monitorName}`);
}