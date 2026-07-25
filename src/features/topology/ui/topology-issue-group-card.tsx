import { AlertTriangle, Braces, Layers3 } from "lucide-react";

import type { TopologyIssueGroup } from "../model/types";

interface TopologyIssueGroupCardProps {
  group: TopologyIssueGroup;
  isSelected: boolean;
  onSelect: (group: TopologyIssueGroup) => void;
}

export function TopologyIssueGroupCard({
  group,
  isSelected,
  onSelect,
}: TopologyIssueGroupCardProps) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={() => onSelect(group)}
      className={`w-full rounded-xl border p-3 text-right transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 ${
        isSelected
          ? "border-red-400 bg-red-500/12 shadow-[0_12px_28px_-18px_rgba(248,113,113,0.9)]"
          : "border-slate-800 bg-slate-900/65 hover:border-red-500/50 hover:bg-slate-900"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg ${
            isSelected ? "bg-red-500 text-white" : "bg-red-500/12 text-red-400"
          }`}
        >
          <Layers3 className="size-4" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-bold text-slate-100" dir="ltr">
            {group.code}
          </span>
          <span className="mt-1 block truncate text-[10px] text-slate-500" dir="ltr">
            {group.check}
          </span>
        </span>

        <span className="flex shrink-0 flex-col items-end gap-1">
          <span className="rounded-full bg-red-500/12 px-2 py-1 text-[10px] font-bold text-red-300">
            {group.issueCount.toLocaleString("fa-IR")} خطا
          </span>
          <span className="text-[9px] font-medium text-amber-400" dir="ltr">
            {group.disposition}
          </span>
        </span>
      </div>

      <span className="mt-3 grid grid-cols-2 gap-2">
        <span className="flex items-center gap-1.5 rounded-lg bg-slate-950/70 px-2 py-1.5 text-[10px] text-slate-400">
          <Braces className="size-3 text-slate-500" />
          {group.geometryTypes.join("، ")}
        </span>
        <span className="flex items-center gap-1.5 rounded-lg bg-slate-950/70 px-2 py-1.5 text-[10px] text-slate-400">
          <AlertTriangle className="size-3 text-amber-400" />
          {group.affectedFeatureCount.toLocaleString("fa-IR")} عارضه
        </span>
      </span>

      {group.affectedFeatureIds.length > 0 && (
        <span className="mt-2 flex flex-wrap gap-1.5" dir="ltr">
          {group.affectedFeatureIds.map((featureId) => (
            <span
              key={featureId}
              className="max-w-full truncate rounded-md border border-slate-700 bg-slate-800/70 px-1.5 py-1 text-[9px] font-medium text-slate-300"
            >
              {featureId}
            </span>
          ))}
        </span>
      )}
    </button>
  );
}
