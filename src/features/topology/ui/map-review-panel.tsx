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
    <aside className="absolute right-5 bottom-5 z-40 w-[min(25rem,calc(100vw-2.5rem))] rounded-2xl border border-border bg-background/95 p-4 text-foreground shadow-2xl backdrop-blur">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <span className="rounded-full bg-amber-500/15 px-2 py-1 text-[10px] font-bold text-amber-700 dark:text-amber-300">
            نیازمند بررسی دستی
          </span>
          <h2 className="mt-3 truncate text-sm font-bold" dir="ltr">
            {issue.code}
          </h2>
        </div>
        <button
          type="button"
          aria-label="بستن جزئیات بررسی"
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          onClick={onClose}
        >
          <X className="size-4" />
        </button>
      </div>
      <dl className="mt-4 space-y-2 rounded-xl bg-card/80 p-3 text-xs">
        <div>
          <dt className="text-muted-foreground">دلیل</dt>
          <dd className="mt-1 text-foreground">{reason}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">مختصات</dt>
          <dd className="mt-1 font-mono text-foreground" dir="ltr">
            {coordinate ? `${coordinate[0]?.toFixed(6)}, ${coordinate[1]?.toFixed(6)}` : "—"}
          </dd>
        </div>
        {decision && (
          <div>
            <dt className="text-muted-foreground">تصمیم ثبت‌شده</dt>
            <dd className="mt-1 font-bold text-emerald-700 dark:text-emerald-300">
              {DECISION_LABELS[decision.action]}
            </dd>
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
            className="flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-2 text-[11px] font-bold hover:border-input hover:bg-muted disabled:opacity-60"
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
