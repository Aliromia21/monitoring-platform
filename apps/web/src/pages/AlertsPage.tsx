import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { listAlerts, markAlertRead, markAllAlertsRead } from "../api/alerts";
import type { Monitor } from "../api/monitors";

import { Card, CardBody, CardHeader } from "../ui/components/Card";
import { Segmented } from "../ui/components/Segmented";
import { StatusBadge } from "../ui/components/StatusBadge";
import { formatDateTime } from "../lib/format";

type Filter = "ALL" | "DOWN" | "RECOVERY" | "UNREAD";

type AlertsResponse = {
  items: Array<{
    id: string;
    type: "DOWN" | "RECOVERY";
    message: string;
    monitorId: string;
    timestamp: string;
    readAt?: string | null;
  }>;
  pages: number;
};

export function AlertsPage() {
  const [filter, setFilter] = useState<Filter>("ALL");
  const [page, setPage] = useState(1);

  const qc = useQueryClient();

  const typeParam = filter === "ALL" || filter === "UNREAD" ? undefined : filter;

  /* =========================
     Alerts query
  ========================= */
  const q = useQuery<AlertsResponse>({
    queryKey: ["alerts", { filter, page }],
    queryFn: () => listAlerts({ type: typeParam as any, page, limit: 20 }),
    refetchInterval: 15000,
    refetchIntervalInBackground: true
  });

  /* =========================
     Monitor name lookup
  ========================= */
  const monitorsData = qc.getQueryData<{ items: Monitor[] }>(["monitors"]);

  const monitorNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of monitorsData?.items ?? []) {
      map.set(m.id, m.name);
    }
    return map;
  }, [monitorsData]);

  /* =========================
     Client-side filter fallback
  ========================= */
  const items = useMemo(() => {
    const data = q.data?.items ?? [];
    if (filter === "ALL") return data;
    if (filter === "UNREAD") return data.filter((a) => (a.readAt ?? null) === null);
    return data.filter((a) => a.type === filter);
  }, [q.data?.items, filter]);

  const unreadCountOnPage = useMemo(() => {
    return (q.data?.items ?? []).filter((a) => (a.readAt ?? null) === null).length;
  }, [q.data?.items]);

  const totalPages = q.data?.pages ?? 1;

  /* =========================
     Actions: Mark read / Mark all read
  ========================= */
  async function onMarkRead(alertId: string) {
    // Optimistic UI (optional): set readAt immediately
    const nowIso = new Date().toISOString();

    const key = ["alerts", { filter, page }] as const;
    const prev = qc.getQueryData<AlertsResponse>(key);

    qc.setQueryData<AlertsResponse>(key, (old) => {
      if (!old) return old as any;
      return {
        ...old,
        items: old.items.map((a) => (a.id === alertId ? { ...a, readAt: nowIso } : a))
      };
    });

    try {
      const updated = await markAlertRead(alertId);

      // If backend returns the updated alert, reconcile
      qc.setQueryData<AlertsResponse>(key, (old) => {
        if (!old) return old as any;
        return {
          ...old,
          items: old.items.map((a) =>
            a.id === alertId ? { ...a, ...(updated as any) } : a
          )
        };
      });
    } catch (e) {
      // Revert on failure
      qc.setQueryData(key, prev);
      throw e;
    }
  }

  async function onMarkAllRead() {
    const key = ["alerts", { filter, page }] as const;
    const prev = qc.getQueryData<AlertsResponse>(key);

    // Optimistic
    const nowIso = new Date().toISOString();
    qc.setQueryData<AlertsResponse>(key, (old) => {
      if (!old) return old as any;
      return {
        ...old,
        items: old.items.map((a) => ((a.readAt ?? null) === null ? { ...a, readAt: nowIso } : a))
      };
    });

    try {
      const res = await markAllAlertsRead();
      const readAt = (res as any)?.readAt ?? nowIso;

      // Normalize based on server timestamp
      qc.setQueryData<AlertsResponse>(key, (old) => {
        if (!old) return old as any;
        return {
          ...old,
          items: old.items.map((a) => ((a.readAt ?? null) === null ? { ...a, readAt } : a))
        };
      });
    } catch (e) {
      qc.setQueryData(key, prev);
      throw e;
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Alerts</h1>
          <p className="text-slate-600 text-sm">
            DOWN and recovery events across your monitors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Segmented
            value={filter}
            options={[
              { value: "ALL", label: "All" },
              { value: "UNREAD", label: "Unread" },
              { value: "DOWN", label: "Down" },
              { value: "RECOVERY", label: "Recovery" }
            ]}
            onChange={(v) => {
              setFilter(v);
              setPage(1);
            }}
          />

          <button
            onClick={() => void q.refetch()}
            className="rounded-lg px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Alerts list */}
      <Card>
        <CardHeader
          title="Recent alerts"
          subtitle={q.isFetching ? "Updating..." : "Latest events"}
          right={
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span
                  className={[
                    "h-2 w-2 rounded-full",
                    q.isFetching ? "bg-indigo-500 animate-pulse" : "bg-slate-300"
                  ].join(" ")}
                />
                <span>{q.isFetching ? "Live" : "Idle"}</span>
              </div>

              <button
                onClick={() => void onMarkAllRead()}
                disabled={q.isLoading || q.isError || unreadCountOnPage === 0}
                className="rounded-lg px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-50"
                title={unreadCountOnPage === 0 ? "No unread alerts on this page" : "Mark all alerts on this page as read"}
              >
                Mark all read
              </button>
            </div>
          }
        />

        <CardBody>
          {q.isLoading ? (
            <div className="text-slate-600">Loading alerts...</div>
          ) : q.isError ? (
            <div className="text-rose-600 text-sm">
              Failed to load alerts: {(q.error as any)?.message ?? "Unknown error"}
            </div>
          ) : items.length === 0 ? (
            <div className="text-slate-600">No alerts yet.</div>
          ) : (
            <div className="space-y-3">
              {items.map((a) => {
                const isUnread = (a.readAt ?? null) === null;

                return (
                  <div
                    key={a.id}
                    className="border border-slate-200 rounded-xl p-4 flex items-start justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-3">
                        <StatusBadge status={a.type === "DOWN" ? "DOWN" : "UP"} />

                        <div className="font-medium truncate">{a.message}</div>

                        {isUnread && (
                          <span className="text-xs px-2 py-0.5 rounded-full border border-slate-300 text-slate-700 bg-white">
                            Unread
                          </span>
                        )}
                      </div>

                      <div className="text-sm text-slate-600 mt-1">
                        Monitor:{" "}
                        <span className="text-slate-900 font-medium">
                          {monitorNameById.get(a.monitorId) ?? a.monitorId}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right text-sm text-slate-600 whitespace-nowrap">
                        {formatDateTime(a.timestamp)}
                      </div>

                      <button
                        onClick={() => void onMarkRead(a.id)}
                        disabled={!isUnread}
                        className="rounded-lg px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-50"
                        title={!isUnread ? "Already read" : "Mark this alert as read"}
                      >
                        Mark read
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          <div className="mt-5 flex items-center justify-between">
            <div className="text-sm text-slate-600">
              Page {page} of {totalPages}
            </div>

            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-50"
              >
                Prev
              </button>

              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
