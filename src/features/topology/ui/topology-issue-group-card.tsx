import { Tooltip } from "@/shared/ui/tooltip";
import { AlertTriangle, Braces, Layers3, Pencil } from "lucide-react";

import type { TopologyIssueGroup } from "../model/types";

interface TopologyIssueGroupCardProps {
  group: TopologyIssueGroup;
  isSelected: boolean;
  onReviewGroup?: (group: TopologyIssueGroup) => void;
  reviewDisabled?: boolean;
  onSelect: (group: TopologyIssueGroup) => void;
}

export function TopologyIssueGroupCard({
  group,
  isSelected,
  onSelect,
  onReviewGroup,
  reviewDisabled,
}: TopologyIssueGroupCardProps) {
  return (
    <div className="relative">
      <Tooltip
        overlap
        content={
          <>
            <span className="block text-left font-bold [direction:ltr!important]">
              {group.code}
            </span>
            <span className="mt-1 block text-left text-muted-foreground [direction:ltr!important]">
              {group.check}
            </span>
          </>
        }
      >
        <button
          type="button"
          aria-pressed={isSelected}
          onClick={() => onSelect(group)}
          className={`w-full rounded-xl border p-3 text-right transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 ${
            isSelected
              ? "border-red-400 bg-red-500/12 shadow-[0_12px_28px_-18px_rgba(248,113,113,0.9)]"
              : "border-border bg-card/65 hover:border-red-500/50 hover:bg-card"
          }`}
        >
          <div className="flex items-start gap-3">
            <span
              className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg ${
                isSelected
                  ? "bg-red-500 text-white"
                  : "bg-red-500/12 text-red-700 dark:text-red-400"
              }`}
            >
              <Layers3 className="size-4" />
            </span>

            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-bold text-foreground" dir="ltr">
                {group.code}
              </span>
              <span className="mt-1 block truncate text-[10px] text-muted-foreground" dir="ltr">
                {group.check}
              </span>
            </span>

            <span className="flex shrink-0 flex-col items-end gap-1">
              <span className="rounded-full bg-red-500/12 px-2 py-1 text-[10px] font-bold text-red-700 dark:text-red-300">
                {group.issueCount.toLocaleString("fa-IR")} خطا
              </span>
              <span
                className={`text-[9px] font-medium text-amber-700 dark:text-amber-400 ${onReviewGroup ? "ml-6" : ""}`}
                dir="ltr"
              >
                {group.disposition}
              </span>
            </span>
          </div>

          <span className="mt-3 grid grid-cols-2 gap-2">
            <span className="flex items-center gap-1.5 rounded-lg bg-background/70 px-2 py-1.5 text-[10px] text-muted-foreground">
              <Braces className="size-3 text-muted-foreground" />
              {group.geometryTypes.join("، ")}
            </span>
            <span className="flex items-center gap-1.5 rounded-lg bg-background/70 px-2 py-1.5 text-[10px] text-muted-foreground">
              <AlertTriangle className="size-3 text-amber-700 dark:text-amber-400" />
              {group.affectedFeatureCount.toLocaleString("fa-IR")} عارضه
            </span>
          </span>

          {group.affectedFeatureIds.length > 0 && (
            <span className="mt-2 flex flex-wrap gap-1.5" dir="ltr">
              {group.affectedFeatureIds.map((featureId) => (
                <span
                  key={featureId}
                  className="max-w-full truncate rounded-md border border-border bg-muted/70 px-1.5 py-1 text-[9px] font-medium text-foreground"
                >
                  {featureId}
                </span>
              ))}
            </span>
          )}
        </button>
      </Tooltip>
      {onReviewGroup && (
        <button
          type="button"
          aria-label="اصلاح دستی همهٔ عارضه‌های کارت"
          title="اصلاح دستی همهٔ عارضه‌های کارت"
          disabled={reviewDisabled}
          onClick={() => onReviewGroup(group)}
          className="absolute left-2 top-8 flex size-6 items-center justify-center rounded-md text-amber-700 hover:bg-amber-500/15 focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-50 dark:text-amber-300"
        >
          <Pencil className="size-3.5" />
        </button>
      )}
    </div>
  );
}
