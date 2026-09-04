import { useState } from "react";

import { Check, FilePenLine, LoaderCircle, X } from "lucide-react";

import type { ManualReviewAction, ManualReviewDecision, TopologyIssue } from "../model/types";

const DECISION_LABELS: Record<ManualReviewAction, string> = {
  approved: "تأییدشده",
  rejected: "ردشده",
  "manual-edit": "ویرایش دستی",
};

export function MapReviewPanel({
  coordinate,
  decision,
  issue,
  onAction,
  onClose,
}: {
  coordinate: number[] | null;
  decision?: ManualReviewDecision;
  issue: TopologyIssue;
  onAction: (action: ManualReviewAction) => Promise<void>;
  onClose: () => void;
}) {
  const [pendingAction, setPendingAction] = useState<ManualReviewAction | null>(null);
  const apply = async (action: ManualReviewAction) => {
    setPendingAction(action);
    try {
      await onAction(action);
    } finally {
      setPendingAction(null);
    }
  };
  const reason =
    (typeof issue.details.reason === "string" && issue.details.reason) ||
    (typeof issue.details.message === "string" && issue.details.message) ||
    issue.code;

  return (
    <aside className="absolute right-5 bottom-5 z-40 w-[min(25rem,calc(100vw-2.5rem))] rounded-2xl border border-slate-700 bg-slate-950/95 p-4 text-slate-100 shadow-2xl backdrop-blur">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <span className="rounded-full bg-amber-500/15 px-2 py-1 text-[10px] font-bold text-amber-300">
            نیازمند بررسی دستی
          </span>
          <h2 className="mt-3 truncate text-sm font-bold" dir="ltr">
            {issue.code}
          </h2>
        </div>
        <button
          type="button"
          aria-label="بستن جزئیات بررسی"
          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          onClick={onClose}
        >
          <X className="size-4" />
        </button>
      </div>
      <dl className="mt-4 space-y-2 rounded-xl bg-slate-900/80 p-3 text-xs">
        <div>
          <dt className="text-slate-500">دلیل</dt>
          <dd className="mt-1 text-slate-200">{reason}</dd>
        </div>
        <div>
          <dt className="text-slate-500">مختصات</dt>
          <dd className="mt-1 font-mono text-slate-200" dir="ltr">
            {coordinate ? `${coordinate[0]?.toFixed(6)}, ${coordinate[1]?.toFixed(6)}` : "—"}
          </dd>
        </div>
        {decision && (
          <div>
            <dt className="text-slate-500">تصمیم ثبت‌شده</dt>
            <dd className="mt-1 font-bold text-emerald-300">{DECISION_LABELS[decision.action]}</dd>
          </div>
        )}
      </dl>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {(
          [
            ["approved", "تأیید", Check],
            ["rejected", "رد", X],
            ["manual-edit", "ویرایش دستی", FilePenLine],
          ] as const
        ).map(([action, label, Icon]) => (
          <button
            key={action}
            type="button"
            disabled={pendingAction !== null}
            className="flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-2 text-[11px] font-bold hover:border-slate-500 hover:bg-slate-800 disabled:opacity-60"
            onClick={() => void apply(action)}
          >
            {pendingAction === action ? (
              <LoaderCircle className="size-3.5 animate-spin" />
            ) : (
              <Icon className="size-3.5" />
            )}
            {label}
          </button>
        ))}
      </div>
    </aside>
  );
}
