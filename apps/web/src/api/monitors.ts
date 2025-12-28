import { api } from "./client";

export type Monitor = {
  id: string;
  name: string;
  type: "HTTP";
  url: string;
  method: "GET" | "POST" | "PUT" | "HEAD";
  interval: number;
  timeout: number;
  expectedStatus: number;
  enabled: boolean;

  // optional summary fields 
  lastStatus?: "UP" | "DOWN" | null;
  lastStatusCode?: number | null;
  lastResponseTime?: number | null;
  lastCheckedAt?: string | null;

  createdAt: string;
  updatedAt: string;
};

export function listMonitors() {
  return api<{ items: Monitor[] }>("/monitors");
}

export type CreateMonitorInput = {
  name: string;
  url: string;
  method?: "GET" | "POST" | "PUT" | "HEAD";
  interval?: number;
  timeout?: number;
  expectedStatus?: number;
  enabled?: boolean;
};

export function createMonitor(input: CreateMonitorInput) {
  return api<{ monitor: Monitor }>("/monitors", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      url: input.url,
      method: input.method ?? "GET",
      interval: input.interval ?? 60,
      timeout: input.timeout ?? 5000,
      expectedStatus: input.expectedStatus ?? 200,
      enabled: input.enabled ?? true
    })
  });
}

export type UpdateMonitorInput = Partial<{
  name: string;
  url: string;
  method: "GET" | "POST" | "PUT" | "HEAD";
  interval: number;
  timeout: number;
  expectedStatus: number;
  enabled: boolean;
}>;

export function updateMonitor(id: string, input: UpdateMonitorInput) {
  return api<{ monitor: Monitor }>(`/monitors/${id}`, {
    method: "PUT",
    body: JSON.stringify(input)
  });
}

export function deleteMonitor(id: string) {
  return api<{ ok: true }>(`/monitors/${id}`, { method: "DELETE" });
}

