import { Modal } from "./Modal";

export function ConfirmDialog(props: {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal open={props.open} title={props.title} onClose={props.onCancel}>
      {props.description ? (
        <div className="text-sm text-slate-600 mb-4">{props.description}</div>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={props.onCancel}
          disabled={props.busy}
          className="rounded-lg px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 disabled:opacity-60"
        >
          {props.cancelText ?? "Cancel"}
        </button>
        <button
          type="button"
          onClick={props.onConfirm}
          disabled={props.busy}
          className={[
            "rounded-lg px-3 py-2 text-white disabled:opacity-60",
            props.danger ? "bg-rose-600 hover:bg-rose-500" : "bg-indigo-600 hover:bg-indigo-500"
          ].join(" ")}
        >
          {props.busy ? "Working..." : props.confirmText ?? "Confirm"}
        </button>
      </div>
    </Modal>
  );
}
