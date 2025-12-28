import { useEffect } from "react";

export function Modal(props: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") props.onClose();
    }
    if (props.open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [props.open, props.onClose]);

  if (!props.open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-slate-900/30"
        onClick={props.onClose}
      />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-xl border border-slate-200 shadow-soft">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between gap-4">
            <div className="font-semibold">{props.title}</div>
            <button
              onClick={props.onClose}
              className="text-slate-500 hover:text-slate-900"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <div className="p-5">{props.children}</div>
        </div>
      </div>
    </div>
  );
}
