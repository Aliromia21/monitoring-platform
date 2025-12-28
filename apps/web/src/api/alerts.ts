import { api } from "./client";

export type AlertItem = {
  id: string;
  monitorId: string;
  userId: string;
  type: "DOWN" | "RECOVERY";
  message: string;
  timestamp: string;
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

export function listAlerts(params?: { type?: "DOWN" | "RECOVERY"; page?: number; limit?: number }) {
  const type = params?.type;
  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;

  const qs = new URLSearchParams();
  qs.set("page", String(page));
  qs.set("limit", String(limit));
  if (type) qs.set("type", type);

  return api<AlertsResponse>(`/alerts?${qs.toString()}`);
}
