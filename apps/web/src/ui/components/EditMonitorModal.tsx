import { useEffect, useState } from "react";
import type { Monitor } from "../../api/monitors";
import { Modal } from "./Modal";

export function EditMonitorModal(props: {
  open: boolean;
  monitor: Monitor;
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (input: {
    name: string;
    url: string;
    method: Monitor["method"];
    interval: number;
    timeout: number;
    expectedStatus: number;
    enabled: boolean;
  }) => void;
}) {
  const [name, setName] = useState(props.monitor.name);
  const [url, setUrl] = useState(props.monitor.url);
  const [method, setMethod] = useState<Monitor["method"]>(props.monitor.method);
  const [interval, setInterval] = useState(props.monitor.interval);
  const [timeout, setTimeout] = useState(props.monitor.timeout);
  const [expectedStatus, setExpectedStatus] = useState(props.monitor.expectedStatus);
  const [enabled, setEnabled] = useState(props.monitor.enabled);

  useEffect(() => {
    if (!props.open) return;
    setName(props.monitor.name);
    setUrl(props.monitor.url);
    setMethod(props.monitor.method);
    setInterval(props.monitor.interval);
    setTimeout(props.monitor.timeout);
    setExpectedStatus(props.monitor.expectedStatus);
    setEnabled(props.monitor.enabled);
  }, [props.open, props.monitor]);

  return (
    <Modal open={props.open} title="Edit monitor" onClose={props.onClose}>
      {props.error ? (
        <div className="mb-3 text-sm text-rose-600">{props.error}</div>
      ) : null}

      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          props.onSubmit({
            name: name.trim(),
            url: url.trim(),
            method,
            interval,
            timeout,
            expectedStatus,
            enabled
          });
        }}
      >
        <div>
          <label className="text-sm text-slate-600">Name</label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={120}
            required
          />
        </div>

        <div>
          <label className="text-sm text-slate-600">URL</label>
          <input
            className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-slate-600">Method</label>
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-indigo-200"
              value={method}
              onChange={(e) => setMethod(e.target.value as any)}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="HEAD">HEAD</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-slate-600">Expected status</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
              type="number"
              min={100}
              max={599}
              value={expectedStatus}
              onChange={(e) => setExpectedStatus(Number(e.target.value))}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-slate-600">Interval (sec)</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
              type="number"
              min={10}
              max={3600}
              value={interval}
              onChange={(e) => setInterval(Number(e.target.value))}
              required
            />
          </div>

          <div>
            <label className="text-sm text-slate-600">Timeout (ms)</label>
            <input
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-200"
              type="number"
              min={100}
              max={30000}
              value={timeout}
              onChange={(e) => setTimeout(Number(e.target.value))}
              required
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            id="enabled"
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          <label htmlFor="enabled" className="text-sm text-slate-700">
            Enabled
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={props.onClose}
            disabled={props.busy}
            className="rounded-lg px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={props.busy}
            className="rounded-lg px-3 py-2 text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60"
          >
            {props.busy ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
