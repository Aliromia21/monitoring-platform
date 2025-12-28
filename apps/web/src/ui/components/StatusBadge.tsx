export function StatusBadge({ status }: { status?: "UP" | "DOWN" | null }) {
const s = status ?? "PENDING";

  const cls =
    s === "UP"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : s === "DOWN"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : "bg-slate-50 text-slate-600 border-slate-200";

  return (
    <span className={`inline-flex items-center gap-2 text-xs font-medium px-2.5 py-1 rounded-full border ${cls}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {s}
    </span>
  );
}
