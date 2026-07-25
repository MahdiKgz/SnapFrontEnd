import { AlertTriangle, Braces, MapPinned } from "lucide-react";

import type { TopologyFeatureReport } from "../model/topology-report";

interface TopologyFeatureReportCardProps {
  isSelected: boolean;
  onSelect: (featureIndex: number) => void;
  report: TopologyFeatureReport;
}

export function TopologyFeatureReportCard({
  isSelected,
  onSelect,
  report,
}: TopologyFeatureReportCardProps) {
  const issueCodes = [...new Set(report.issues.map((issue) => issue.code))];
  const manualReviewCount = report.issues.filter(
    (issue) => issue.disposition === "ManualReview",
  ).length;

  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={() => onSelect(report.featureIndex)}
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
          <MapPinned className="size-4" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs font-bold text-slate-100">{report.name}</span>
          <span className="mt-1 block truncate text-[10px] text-slate-500" dir="ltr">
            ID: {report.featureId}
          </span>
        </span>

        <span className="rounded-full bg-red-500/12 px-2 py-1 text-[10px] font-bold text-red-300">
          {report.issues.length.toLocaleString("fa-IR")} خطا
        </span>
      </div>

      <span className="mt-3 grid grid-cols-2 gap-2">
        <span className="flex items-center gap-1.5 rounded-lg bg-slate-950/70 px-2 py-1.5 text-[10px] text-slate-400">
          <Braces className="size-3 text-slate-500" />
          {report.geometryType}
        </span>
        <span className="flex items-center gap-1.5 rounded-lg bg-slate-950/70 px-2 py-1.5 text-[10px] text-slate-400">
          <AlertTriangle className="size-3 text-amber-400" />
          {manualReviewCount.toLocaleString("fa-IR")} بررسی دستی
        </span>
      </span>

      {issueCodes.length > 0 && (
        <span className="mt-2 flex flex-wrap gap-1.5" dir="ltr">
          {issueCodes.map((code) => (
            <span
              key={code}
              className="max-w-full truncate rounded-md border border-slate-700 bg-slate-800/70 px-1.5 py-1 text-[9px] font-medium text-slate-300"
            >
              {code}
            </span>
          ))}
        </span>
      )}
    </button>
  );
}
