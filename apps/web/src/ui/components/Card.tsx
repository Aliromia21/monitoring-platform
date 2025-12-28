export function Card(props: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-xl shadow-soft ${props.className ?? ""}`}>
      {props.children}
    </div>
  );
}

export function CardHeader(props: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div className="p-5 border-b border-slate-200 flex items-start justify-between gap-4">
      <div>
        <div className="font-semibold">{props.title}</div>
        {props.subtitle ? <div className="text-sm text-slate-600 mt-0.5">{props.subtitle}</div> : null}
      </div>
      {props.right}
    </div>
  );
}

export function CardBody(props: { children: React.ReactNode; className?: string }) {
  return <div className={`p-5 ${props.className ?? ""}`}>{props.children}</div>;
}
