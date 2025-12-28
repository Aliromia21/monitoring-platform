export function Segmented<T extends string>(props: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
      {props.options.map((o) => {
        const active = o.value === props.value;
        return (
          <button
            key={o.value}
            onClick={() => props.onChange(o.value)}
            className={[
              "px-3 py-1.5 text-sm rounded-md transition",
              active ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:text-slate-900"
            ].join(" ")}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
