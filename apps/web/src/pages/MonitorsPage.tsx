import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useState } from "react";

import {
  listMonitors,
  createMonitor,
  updateMonitor,
  deleteMonitor
} from "../api/monitors";
import { StatusBadge } from "../ui/components/StatusBadge";
import { Metric } from "../ui/components/Metric";
import { Modal } from "../ui/components/Modal";
import { ConfirmDialog } from "../ui/components/ConfirmDialog";
import { formatDateTime, formatMs } from "../lib/format";

export function MonitorsPage() {
  const qc = useQueryClient();

  /* =========================
     Queries
  ========================= */
  const q = useQuery({
    queryKey: ["monitors"],
    queryFn: listMonitors
  });

  /* =========================
     Create Monitor Modal state
  ========================= */
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [interval, setInterval] = useState(60);

  const createM = useMutation({
    mutationFn: () =>
      createMonitor({
        name: name.trim(),
        url: url.trim(),
        interval
      }),
    onSuccess: async () => {
      setOpen(false);
      setName("");
      setUrl("");
      setInterval(60);
      await qc.invalidateQueries({ queryKey: ["monitors"] });
    }
  });

  /* =========================
     Toggle + Delete actions
  ========================= */
  const toggleM = useMutation({
    mutationFn: (p: { id: string; enabled: boolean }) =>
      updateMonitor(p.id, { enabled: p.enabled }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["monitors"] });
    }
  });

  const [deleteId, setDeleteId] = useState<string | null>(null);

  const deleteM = useMutation({
    mutationFn: (id: string) => deleteMonitor(id),
    onSuccess: async () => {
      setDeleteId(null);
      await qc.invalidateQueries({ queryKey: ["monitors"] });
    }
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">Monitors</h1>
          <p className="text-slate-600 text-sm">
            Track uptime and response time for your services.
          </p>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="rounded-lg px-3 py-2 text-white bg-indigo-600 hover:bg-indigo-500"
        >
          Create monitor
        </button>
      </div>

      {/* Content */}
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
            Create your first monitor to start collecting uptime and latency
            data.
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

                <div className="flex items-start gap-2">
                  <div className="text-right text-xs text-slate-500">
                    <div>Interval</div>
                    <div className="text-slate-900 font-medium">
                      {m.interval}s
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleM.mutate({ id: m.id, enabled: !m.enabled });
                      }}
                      className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                      title={m.enabled ? "Disable monitor" : "Enable monitor"}
                    >
                      {m.enabled ? "Disable" : "Enable"}
                    </button>

                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setDeleteId(m.id);
                      }}
                      className="text-xs px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700"
                      title="Delete monitor"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
                <Metric
                  label="Last response time"
                  value={formatMs(m.lastResponseTime ?? null)}
                />
                <Metric
                  label="Last checked"
                  value={formatDateTime(m.lastCheckedAt ?? null)}
                />
                <Metric
                  label="Expected status"
                  value={<span className="font-medium">{m.expectedStatus}</span>}
                />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* =========================
          Create Monitor Modal
         ========================= */}
      <Modal
        open={open}
        title="Create monitor"
        onClose={() => !createM.isPending && setOpen(false)}
      >
        {createM.isError ? (
          <div className="mb-3 text-sm text-rose-600">
            {(createM.error as any)?.message ?? "Failed to create monitor"}
          </div>
        ) : null}

        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            createM.mutate();
          }}
        >
          <div>
            <label className="text-sm text-slate-600">Name</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Google Health"
              required
              maxLength={120}
            />
          </div>

          <div>
            <label className="text-sm text-slate-600">URL</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/health"
              required
            />
            <div className="text-xs text-slate-500 mt-1">
              Must be a valid HTTP/HTTPS URL.
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-600">Interval (seconds)</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
              value={interval}
              onChange={(e) => setInterval(Number(e.target.value))}
              type="number"
              min={10}
              max={3600}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={createM.isPending}
              className="rounded-lg px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createM.isPending}
              className="rounded-lg px-3 py-2 text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60"
            >
              {createM.isPending ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </Modal>

      {/* =========================
          Delete Confirm Dialog
         ========================= */}
      <ConfirmDialog
        open={!!deleteId}
        title="Delete monitor?"
        description="This will remove the monitor and its configuration. Check history may remain in the database depending on retention policy."
        confirmText="Delete"
        danger
        busy={deleteM.isPending}
        onCancel={() => !deleteM.isPending && setDeleteId(null)}
        onConfirm={() => {
          if (!deleteId) return;
          deleteM.mutate(deleteId);
        }}
      />
    </div>
  );
}
