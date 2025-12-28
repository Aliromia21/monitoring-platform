export function Metric(props: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-slate-500">{props.label}</div>
      <div className="text-sm text-slate-900">{props.value}</div>
    </div>
  );
}
