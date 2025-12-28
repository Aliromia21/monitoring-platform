import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Card, CardBody, CardHeader } from "../ui/components/Card";
import { StatusBadge } from "../ui/components/StatusBadge";
import { Metric } from "../ui/components/Metric";
import { EditMonitorModal } from "../ui/components/EditMonitorModal";

import { formatDateTime, formatMs } from "../lib/format";
import { getMonitorChecks, getMonitorSummary } from "../api/monitorDetails";
import { getMonitorById, updateMonitor } from "../api/monitors";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

export function MonitorDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const monitorId = id ?? "";

  const qc = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);

  const monitorQ = useQuery({
    queryKey: ["monitor", monitorId],
    queryFn: () => getMonitorById(monitorId),
    enabled: !!monitorId
  });

  const summaryQ = useQuery({
    queryKey: ["monitor-summary", monitorId],
    queryFn: () => getMonitorSummary(monitorId, 24),
    enabled: !!monitorId
  });

  const checksQ = useQuery({
    queryKey: ["monitor-checks", monitorId],
    queryFn: () => getMonitorChecks(monitorId, 50, 1),
    enabled: !!monitorId
  });

  const editM = useMutation({
    mutationFn: (input: any) => updateMonitor(monitorId, input),
    onSuccess: async () => {
      setEditOpen(false);
      await qc.invalidateQueries({ queryKey: ["monitor", monitorId] });
      await qc.invalidateQueries({ queryKey: ["monitors"] });
      await qc.invalidateQueries({ queryKey: ["monitor-summary", monitorId] });
      await qc.invalidateQueries({ queryKey: ["monitor-checks", monitorId] });
    }
  });

  const chartData = useMemo(() => {
    const items = checksQ.data?.items ?? [];
    return [...items]
      .slice()
      .reverse()
      .map((r) => ({
        t: new Date(r.timestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit"
        }),
        responseTime: r.responseTime,
        upValue: r.status === "UP" ? 1 : 0
      }));
  }, [checksQ.data?.items]);

  const monitor = monitorQ.data?.monitor;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm text-slate-600">
            <Link className="hover:underline" to="/">
              Monitors
            </Link>{" "}
            <span className="text-slate-400">/</span>{" "}
            <span className="text-slate-900">Details</span>
          </div>

          <h1 className="text-xl font-semibold mt-1">
            {monitor?.name ?? "Monitor"}
          </h1>

          <p className="text-sm text-slate-600 mt-1 truncate">
            {monitor ? (
              <>
                <span className="font-medium text-slate-700">
                  {monitor.method}
                </span>{" "}
                <span className="text-slate-400">·</span> {monitor.url}
                <span className="text-slate-400"> · </span>
                Interval {monitor.interval}s
                {!monitor.enabled ? (
                  <>
                    <span className="text-slate-400"> · </span>
                    <span className="text-slate-700 font-medium">Disabled</span>
                  </>
                ) : null}
              </>
            ) : monitorQ.isLoading ? (
              "Loading monitor..."
            ) : monitorQ.isError ? (
              "Failed to load monitor"
            ) : (
              ""
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditOpen(true)}
            disabled={!monitor}
            className="rounded-lg px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-60"
          >
            Edit
          </button>

          <button
            onClick={() => {
              monitorQ.refetch();
              summaryQ.refetch();
              checksQ.refetch();
            }}
            className="rounded-lg px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Summary */}
      <Card>
        <CardHeader
          title="Summary (last 24h)"
          subtitle={
            summaryQ.data?.summary?.since
              ? `Since ${formatDateTime(summaryQ.data.summary.since)}`
              : undefined
          }
          right={<StatusBadge status={summaryQ.data?.summary?.lastStatus ?? null} />}
        />
        <CardBody>
          {summaryQ.isLoading ? (
            <div className="text-slate-600">Loading summary...</div>
          ) : summaryQ.isError ? (
            <div className="text-rose-600 text-sm">
              Failed to load summary: {(summaryQ.error as any)?.message}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Metric
                label="Uptime"
                value={
                  summaryQ.data!.summary.uptimePct == null
                    ? "—"
                    : `${summaryQ.data!.summary.uptimePct}%`
                }
              />
              <Metric label="Checks" value={summaryQ.data!.summary.totalChecks} />
              <Metric
                label="Avg latency"
                value={formatMs(summaryQ.data!.summary.avgResponseTimeMs)}
              />
              <Metric
                label="P95 latency"
                value={formatMs(summaryQ.data!.summary.p95ResponseTimeMs)}
              />

              <Metric
                label="Last checked"
                value={formatDateTime(summaryQ.data!.summary.lastCheckedAt)}
              />
              <Metric
                label="Last status code"
                value={summaryQ.data!.summary.lastStatusCode ?? "—"}
              />
              <Metric
                label="Last latency"
                value={formatMs(summaryQ.data!.summary.lastResponseTimeMs)}
              />
              <Metric
                label="Up / Down"
                value={`${summaryQ.data!.summary.up} / ${summaryQ.data!.summary.down}`}
              />
            </div>
          )}
        </CardBody>
      </Card>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Response time (ms)" subtitle="Last 50 checks" />
          <CardBody className="h-64">
            {checksQ.isLoading ? (
              <div className="text-slate-600">Loading chart...</div>
            ) : checksQ.isError ? (
              <div className="text-rose-600 text-sm">Failed to load checks</div>
            ) : chartData.length === 0 ? (
              <div className="text-slate-600">No data yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="t" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="responseTime"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Availability" subtitle="UP=1, DOWN=0" />
          <CardBody className="h-64">
            {checksQ.isLoading ? (
              <div className="text-slate-600">Loading chart...</div>
            ) : checksQ.isError ? (
              <div className="text-rose-600 text-sm">Failed to load checks</div>
            ) : chartData.length === 0 ? (
              <div className="text-slate-600">No data yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="t" />
                  <YAxis domain={[0, 1]} ticks={[0, 1]} />
                  <Tooltip />
                  <Line
                    type="stepAfter"
                    dataKey="upValue"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardBody>
        </Card>
      </div>

      {/* History Table */}
      <Card>
        <CardHeader title="History" subtitle="Last 50 checks" />
        <CardBody>
          {checksQ.isLoading ? (
            <div className="text-slate-600">Loading history...</div>
          ) : checksQ.isError ? (
            <div className="text-rose-600 text-sm">
              Failed to load history: {(checksQ.error as any)?.message}
            </div>
          ) : (checksQ.data?.items?.length ?? 0) === 0 ? (
            <div className="text-slate-600">No checks yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-slate-600">
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 pr-4 font-medium">Time</th>
                    <th className="text-left py-2 pr-4 font-medium">Status</th>
                    <th className="text-left py-2 pr-4 font-medium">Code</th>
                    <th className="text-left py-2 pr-4 font-medium">Latency</th>
                    <th className="text-left py-2 pr-4 font-medium">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {checksQ.data!.items.map((r) => (
                    <tr key={r.id} className="border-b border-slate-100">
                      <td className="py-2 pr-4">{formatDateTime(r.timestamp)}</td>
                      <td className="py-2 pr-4">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="py-2 pr-4">{r.statusCode ?? "—"}</td>
                      <td className="py-2 pr-4">{formatMs(r.responseTime)}</td>
                      <td className="py-2 pr-4 text-slate-600">
                        {r.error ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Edit Modal */}
      {monitor ? (
        <EditMonitorModal
          open={editOpen}
          monitor={monitor}
          busy={editM.isPending}
          error={editM.isError ? (editM.error as any)?.message : null}
          onClose={() => !editM.isPending && setEditOpen(false)}
          onSubmit={(input) => editM.mutate(input)}
        />
      ) : null}
    </div>
  );
}
