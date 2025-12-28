import { api } from "./client";

export type MonitorSummary = {
  windowHours: number;
  since: string;

  totalChecks: number;
  up: number;
  down: number;
  uptimePct: number | null;

  avgResponseTimeMs: number | null;
  p95ResponseTimeMs: number | null;

  lastStatus: "UP" | "DOWN" | null;
  lastStatusCode: number | null;
  lastResponseTimeMs: number | null;
  lastCheckedAt: string | null;
};

export type CheckRun = {
  id: string;
  monitorId: string;
  userId: string;
  timestamp: string;
  status: "UP" | "DOWN";
  statusCode: number | null;
  responseTime: number;
  error: string | null;
};

export function getMonitorSummary(id: string, windowHours = 24) {
  return api<{ summary: MonitorSummary }>(`/monitors/${id}/summary?windowHours=${windowHours}`);
}

export function getMonitorChecks(id: string, limit = 50, page = 1) {
  return api<{
    items: CheckRun[];
    page: number;
    limit: number;
    total: number;
    pages: number;
  }>(`/monitors/${id}/checks?limit=${limit}&page=${page}`);
}
