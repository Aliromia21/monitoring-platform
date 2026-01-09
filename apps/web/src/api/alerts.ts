import { api } from "./client";

export type AlertItem = {
  id: string;
  monitorId: string;
  userId: string;
  type: "DOWN" | "RECOVERY";
  message: string;
  timestamp: string;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AlertsResponse = {
  items: AlertItem[];
  page: number;
  limit: number;
  total: number;
  pages: number;
};

export function listAlerts(params?: {
  type?: "DOWN" | "RECOVERY";
  page?: number;
  limit?: number;
  monitorId?: string;
}) {
  const type = params?.type;
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const monitorId = params?.monitorId;

  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("limit", String(limit));
  if (type) qs.set("type", type);
  if (monitorId) qs.set("monitorId", monitorId);  
  return api<AlertsResponse>(`/alerts?${qs.toString()}`);
}


export function markAlertRead(alertId: string) {
  return api<AlertItem>(`/alerts/${alertId}/read`, { method: "PATCH" });
}

export function markAllAlertsRead() {
  return api<{ updated: number; readAt: string }>(`/alerts/read-all`, { method: "POST" });
}

export function getUnreadAlertsCount() {
  return api<{ unread: number }>(`/alerts/unread-count`);
}
