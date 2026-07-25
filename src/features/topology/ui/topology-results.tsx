import { useState } from "react";

import {
  AlertCircle,
  CheckCircle2,
  FilePlus2,
  FileSearch,
  LoaderCircle,
  WandSparkles,
} from "lucide-react";

import { useHealTopologyMutation } from "../api/topology-api";
import { buildFeatureReports } from "../model/topology-report";
import type { TopologyUploadData } from "../model/types";
import { TopologyFeatureReportCard } from "./topology-feature-report-card";

interface TopologyResultsProps {
  data: TopologyUploadData;
  onReset: () => void;
  onSelectFeature: (featureIndex: number) => void;
  selectedFeatureIndex: number | null;
}

export function TopologyResults({
  data,
  onReset,
  onSelectFeature,
  selectedFeatureIndex,
}: TopologyResultsProps) {
  const [healTopology, { isError, isLoading, isSuccess }] = useHealTopologyMutation();
  const [healMessage, setHealMessage] = useState("");
  const featureReports = buildFeatureReports(data);
  const { summary } = data.report;

  const requestAutoRepair = async () => {
    setHealMessage("");

    try {
      const response = await healTopology(data.heal.path).unwrap();
      setHealMessage(response.message);
    } catch {
      // The mutation state renders the actionable failure message.
    }
  };

  return (
    <section aria-labelledby="topology-results-title">
      <header className="mb-4 border-b border-slate-800 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="mb-1 text-[10px] font-bold tracking-[0.18em] text-red-400">
              DRY RUN COMPLETE
            </p>
            <h1 id="topology-results-title" className="text-base font-bold text-slate-100">
              نتایج بررسی
            </h1>
            <p className="mt-1 truncate text-[10px] text-slate-500" dir="ltr" title={data.jobId}>
              Job ID: {data.jobId}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              aria-label="بررسی فایل جدید"
              onClick={onReset}
              className="group relative flex size-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-300 transition-colors hover:border-slate-600 hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
            >
              <FilePlus2 className="size-5" />
              <span
                role="tooltip"
                className="pointer-events-none absolute top-[calc(100%+0.5rem)] left-1/2 z-30 w-max -translate-x-1/2 -translate-y-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[10px] font-medium whitespace-nowrap text-slate-100 opacity-0 shadow-xl transition-all group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
              >
                بررسی فایل جدید
              </span>
            </button>

            <button
              type="button"
              aria-label="ترمیم خودکار"
              onClick={() => void requestAutoRepair()}
              disabled={isLoading}
              className="group relative flex size-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-[0_8px_22px_-10px_rgba(16,185,129,0.9)] transition-colors hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:cursor-wait disabled:opacity-70"
            >
              {isLoading ? (
                <LoaderCircle className="size-5 animate-spin" />
              ) : (
                <WandSparkles className="size-5" />
              )}
              <span
                role="tooltip"
                className="pointer-events-none absolute top-[calc(100%+0.5rem)] left-1/2 z-30 w-max -translate-x-1/2 -translate-y-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-[10px] font-medium whitespace-nowrap text-slate-100 opacity-0 shadow-xl transition-all group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
              >
                ترمیم خودکار
              </span>
            </button>
          </div>
        </div>
      </header>

      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
        <div className="flex items-center gap-2">
          <FileSearch className="size-4 text-slate-400" />
          <p className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-200" dir="ltr">
            {data.originalName}
          </p>
          <span
            className={`rounded-full px-2 py-1 text-[9px] font-bold ${
              data.report.valid
                ? "bg-emerald-500/12 text-emerald-300"
                : "bg-red-500/12 text-red-300"
            }`}
          >
            {data.report.valid ? "معتبر" : "نیازمند بررسی"}
          </span>
        </div>

        <dl className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-slate-950/70 px-2 py-2">
            <dt className="text-[9px] text-slate-500">عارضه</dt>
            <dd className="mt-1 text-sm font-bold text-slate-100">
              {summary.featuresScanned.toLocaleString("fa-IR")}
            </dd>
          </div>
          <div className="rounded-lg bg-slate-950/70 px-2 py-2">
            <dt className="text-[9px] text-slate-500">خطا</dt>
            <dd className="mt-1 text-sm font-bold text-red-400">
              {summary.issuesFound.toLocaleString("fa-IR")}
            </dd>
          </div>
          <div className="rounded-lg bg-slate-950/70 px-2 py-2">
            <dt className="text-[9px] text-slate-500">تلورانس</dt>
            <dd className="mt-1 text-sm font-bold text-slate-100" dir="ltr">
              {data.appliedTolerance} mm
            </dd>
          </div>
        </dl>
      </div>

      {isSuccess && (
        <div
          role="status"
          className="mt-3 flex items-start gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-[11px] leading-5 text-emerald-300"
        >
          <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
          {healMessage || "درخواست ترمیم خودکار با موفقیت ثبت شد."}
        </div>
      )}

      {isError && (
        <div
          role="alert"
          className="mt-3 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-[11px] leading-5 text-red-300"
        >
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
          ثبت درخواست ترمیم خودکار انجام نشد. دوباره تلاش کنید.
        </div>
      )}

      <div className="mt-5 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xs font-bold text-slate-200">عارضه‌های درگیر</h2>
          <p className="mt-1 text-[10px] text-slate-500">
            برای تمرکز روی نقشه، یک کارت را انتخاب کنید.
          </p>
        </div>
        <span className="rounded-full bg-red-500/12 px-2 py-1 text-[10px] font-bold text-red-300">
          {summary.affectedFeatures.toLocaleString("fa-IR")}
        </span>
      </div>

      <div className="mt-3 space-y-2.5">
        {featureReports.map((report) => (
          <TopologyFeatureReportCard
            key={report.featureIndex}
            report={report}
            isSelected={selectedFeatureIndex === report.featureIndex}
            onSelect={onSelectFeature}
          />
        ))}
      </div>
    </section>
  );
}
