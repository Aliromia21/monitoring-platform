import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { listMonitors } from "../api/monitors";
import { StatusBadge } from "../ui/components/StatusBadge";
import { Metric } from "../ui/components/Metric";
import { formatDateTime, formatMs } from "../lib/format";

export function MonitorsPage() {
  const q = useQuery({
    queryKey: ["monitors"],
    queryFn: listMonitors
  });

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Monitors</h1>
          <p className="text-slate-600 text-sm">
            Track uptime and response time for your services.
          </p>
        </div>

        <button className="rounded-lg px-3 py-2 text-white bg-indigo-600 hover:bg-indigo-500">
          Create monitor
        </button>
      </div>

      {q.isLoading ? (
        <div className="text-slate-600">Loading monitors...</div>
      ) : q.isError ? (
        <div className="text-rose-600 text-sm">
          Failed to load monitors: {(q.error as any)?.message ?? "Unknown error"}
        </div>
      ) : q.data.items.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-soft">
          <div className="font-medium mb-1">No monitors yet</div>
          <div className="text-sm text-slate-600">
            Create your first monitor to start collecting uptime and latency data.
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {q.data.items.map((m) => (
            <Link
              key={m.id}
              to={`/monitors/${m.id}`}
              className="block bg-white border border-slate-200 rounded-xl p-5 shadow-soft hover:border-slate-300 transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="font-semibold truncate">{m.name}</div>
                    <StatusBadge status={m.lastStatus ?? null} />
                    {!m.enabled ? (
                      <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                        Disabled
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 text-sm text-slate-600 truncate">
                    {m.method} · {m.url}
                  </div>
                </div>

                <div className="text-right text-xs text-slate-500">
                  <div>Interval</div>
                  <div className="text-slate-900 font-medium">{m.interval}s</div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                <Metric label="Last response time" value={formatMs(m.lastResponseTime ?? null)} />
                <Metric label="Last checked" value={formatDateTime(m.lastCheckedAt ?? null)} />
                <Metric
                  label="Expected status"
                  value={<span className="font-medium">{m.expectedStatus}</span>}
                />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
