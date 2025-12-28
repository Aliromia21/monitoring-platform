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
