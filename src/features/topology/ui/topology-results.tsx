import { useState } from "react";

import { Tooltip } from "@/components/ui/tooltip";
import type { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FilePlus2,
  FileSearch,
  LoaderCircle,
  OctagonX,
  WandSparkles,
} from "lucide-react";

import type { TopologyIssueGroup, TopologyUploadData } from "../model/types";
import { useTopologyHealing } from "../model/use-topology-healing";
import { IssueDetails } from "./issue-details";
import { TopologyIssueGroupCard } from "./topology-issue-group-card";

interface TopologyResultsProps {
  data: TopologyUploadData;
  onHealingComplete: (
    output: FeatureCollection<Geometry, GeoJsonProperties>,
  ) => Promise<void> | void;
  onReset: () => void;
  onSelectFeatures: (featureIndexes: number[]) => void;
}

const PROGRESS_STAGE_LABELS = {
  parsing: "خواندن و تبدیل فایل",
  "error-detection": "شناسایی خطاها",
  healing: "ترمیم عوارض",
  "report-generation": "ساخت خروجی و گزارش",
} as const;

const ISSUE_COUNT_LABELS = {
  gap: "شکاف",
  sliver: "پلیگون باریک",
  kink: "شکستگی",
  spike: "نوک تیز",
} as const;

export function TopologyResults({
  data,
  onHealingComplete,
  onReset,
  onSelectFeatures,
}: TopologyResultsProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const { summary } = data.report;
  const {
    cancelHealing,
    downloadUrl,
    isCancelling,
    isLoadingOutput,
    isOutputReady,
    isStreaming,
    isRequesting,
    lifecycle,
    outputError,
    requestError,
    requestHealing,
    statusError,
  } = useTopologyHealing({ data, onHealingComplete });
  const hasOnlyManualReviewIssues =
    summary.autoRepairableIssues === 0 && summary.manualReviewIssues > 0;
  const isHealing =
    isRequesting ||
    isStreaming ||
    lifecycle?.status === "queued" ||
    lifecycle?.status === "processing";
  const isCompleted = lifecycle?.status === "completed";
  const isHealingDisabled = isHealing || isCompleted || hasOnlyManualReviewIssues;

  const selectIssueGroup = (group: TopologyIssueGroup) => {
    setSelectedGroupId(group.groupId);
    onSelectFeatures(group.affectedFeatureIndexes);
  };

  return (
    <section aria-labelledby="topology-results-title">
      <header className="mb-4 border-b border-border pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="mb-1 text-[10px] font-bold tracking-[0.18em] text-red-700 dark:text-red-400">
              DRY RUN COMPLETE
            </p>
            <h1 id="topology-results-title" className="text-base font-bold text-foreground">
              نتایج بررسی
            </h1>
            <p
              className="mt-1 truncate text-[10px] text-muted-foreground"
              dir="ltr"
              title={data.jobId}
            >
              Job ID: {data.jobId}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Tooltip content="بررسی فایل جدید">
              <button
                type="button"
                aria-label="بررسی فایل جدید"
                onClick={onReset}
                className="flex size-10 items-center justify-center rounded-xl border border-border bg-card text-foreground transition-colors hover:border-input hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <FilePlus2 className="size-5" />
              </button>
            </Tooltip>

            <Tooltip
              content={
                hasOnlyManualReviewIssues ? "هیچ ترمیم خودکاری در دسترس نیست" : "ترمیم خودکار"
              }
            >
              <span
                className="inline-flex rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
                tabIndex={isHealingDisabled ? 0 : -1}
              >
                <button
                  type="button"
                  aria-label="ترمیم خودکار"
                  onClick={() => void requestHealing()}
                  disabled={isHealingDisabled}
                  className="flex size-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-[0_8px_22px_-10px_rgba(16,185,129,0.9)] transition-colors hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:pointer-events-none disabled:opacity-70"
                >
                  {isHealing ? (
                    <LoaderCircle className="size-5 animate-spin" />
                  ) : (
                    <WandSparkles className="size-5" />
                  )}
                </button>
              </span>
            </Tooltip>
          </div>
        </div>
      </header>

      <div className="rounded-xl border border-border bg-card/70 p-3">
        <div className="flex items-center gap-2">
          <FileSearch className="size-4 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-foreground">{data.name}</p>
            <p className="mt-0.5 truncate text-[10px] text-muted-foreground" dir="ltr">
              {data.originalName}
            </p>
          </div>
          <span
            className={`rounded-full px-2 py-1 text-[9px] font-bold ${
              data.report.valid
                ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
                : "bg-red-500/12 text-red-700 dark:text-red-300"
            }`}
          >
            {data.report.valid ? "معتبر" : "نیازمند بررسی"}
          </span>
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-2 text-center">
          <div className="rounded-lg bg-background/70 px-2 py-2">
            <dt className="text-[9px] text-muted-foreground">عارضه</dt>
            <dd className="mt-1 text-sm font-bold text-foreground">
              {summary.featuresScanned.toLocaleString("fa-IR")}
            </dd>
          </div>
          <div className="rounded-lg bg-background/70 px-2 py-2">
            <dt className="text-[9px] text-muted-foreground">خطا</dt>
            <dd className="mt-1 text-sm font-bold text-red-700 dark:text-red-400">
              {summary.issuesFound.toLocaleString("fa-IR")}
            </dd>
          </div>
          <div className="rounded-lg bg-background/70 px-2 py-2">
            <dt className="text-[9px] text-muted-foreground">گروه خطا</dt>
            <dd className="mt-1 text-sm font-bold text-amber-700 dark:text-amber-400">
              {summary.issueGroups.toLocaleString("fa-IR")}
            </dd>
          </div>
          <div className="rounded-lg bg-background/70 px-2 py-2">
            <dt className="text-[9px] text-muted-foreground">تلورانس</dt>
            <dd className="mt-1 text-sm font-bold text-foreground" dir="ltr">
              {data.appliedTolerance} mm
            </dd>
          </div>
        </dl>
      </div>

      {hasOnlyManualReviewIssues && (
        <div
          role="status"
          className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2.5 text-[11px] leading-5 text-amber-700 dark:text-amber-300"
        >
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
          <span>
            هیچ ترمیم خودکاری در دسترس نیست؛ همه خطاهای شناسایی‌شده نیازمند بررسی دستی هستند.
          </span>
        </div>
      )}

      {isHealing && (
        <div
          role="status"
          className="mt-3 rounded-xl border border-sky-500/20 bg-sky-500/10 px-3 py-2.5 text-[11px] leading-5 text-sky-700 dark:text-sky-300"
        >
          <div className="flex items-center gap-2">
            <LoaderCircle className="size-3.5 shrink-0 animate-spin" />
            <span>
              {lifecycle?.progressDetail
                ? PROGRESS_STAGE_LABELS[lifecycle.progressDetail.stage]
                : lifecycle?.status === "processing"
                  ? "موتور در حال ترمیم فایل است..."
                  : "درخواست ترمیم در صف پردازش قرار گرفت."}
            </span>
            <span className="mr-auto font-bold" dir="ltr">
              {Math.round(lifecycle?.progress ?? 0)}%
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-sky-100 dark:bg-sky-950/70">
            <div
              className="h-full rounded-full bg-sky-400 transition-[width] duration-300"
              style={{ width: `${Math.max(2, lifecycle?.progress ?? 0)}%` }}
            />
          </div>
          {lifecycle?.progressDetail && (
            <dl className="mt-2 grid grid-cols-4 gap-1.5">
              {Object.entries(lifecycle.progressDetail.issueCounts).map(([key, count]) => (
                <div
                  key={key}
                  className="rounded-md bg-sky-100/70 dark:bg-sky-950/45 px-1.5 py-1 text-center"
                >
                  <dt className="truncate text-[8px] text-sky-700/70 dark:text-sky-300/70">
                    {ISSUE_COUNT_LABELS[key as keyof typeof ISSUE_COUNT_LABELS]}
                  </dt>
                  <dd className="mt-0.5 font-bold text-sky-700 dark:text-sky-200">
                    {count.toLocaleString("fa-IR")}
                  </dd>
                </div>
              ))}
            </dl>
          )}
          <button
            type="button"
            className="mt-3 flex h-8 w-full items-center justify-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 font-bold text-red-700 dark:text-red-300 transition-colors hover:bg-red-500/20 disabled:opacity-60"
            disabled={isCancelling}
            onClick={() => void cancelHealing()}
          >
            {isCancelling ? (
              <LoaderCircle className="size-3.5 animate-spin" />
            ) : (
              <OctagonX className="size-3.5" />
            )}
            {isCancelling ? "در حال لغو..." : "لغو ترمیم"}
          </button>
        </div>
      )}

      {lifecycle?.status === "cancelled" && (
        <div
          role="status"
          className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2.5 text-[11px] text-amber-700 dark:text-amber-300"
        >
          عملیات ترمیم لغو شد. می‌توانید دوباره آن را آغاز کنید.
        </div>
      )}

      {isCompleted && (
        <div
          role="status"
          className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-3 text-[11px] leading-5 text-emerald-700 dark:text-emerald-300"
        >
          <div className="flex items-start gap-2">
            {isLoadingOutput ? (
              <LoaderCircle className="mt-0.5 size-3.5 shrink-0 animate-spin" />
            ) : (
              <CheckCircle2 className="mt-0.5 size-3.5 shrink-0" />
            )}
            <div>
              <p className="font-bold">ترمیم فایل با موفقیت کامل شد.</p>
              <p className="text-emerald-700/80 dark:text-emerald-300/80">
                {isOutputReady
                  ? "نتیجه ترمیم‌شده روی نقشه نمایش داده شد."
                  : outputError
                    ? "فایل آماده است اما نمایش آن روی نقشه انجام نشد."
                    : "در حال بارگذاری نتیجه ترمیم‌شده روی نقشه..."}
              </p>
              {lifecycle.result && (
                <p className="mt-1 text-emerald-700 dark:text-emerald-200">
                  {lifecycle.result.repairsApplied.toLocaleString("fa-IR")} عملیات اصلاح ثبت شد.
                </p>
              )}
            </div>
          </div>
          {downloadUrl && (
            <a
              href={downloadUrl}
              download={lifecycle.result?.output?.fileName}
              className="mt-3 flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 font-bold text-white transition-colors hover:bg-emerald-400"
            >
              <Download className="size-4" />
              دانلود فایل ترمیم‌شده
            </a>
          )}
        </div>
      )}

      {(requestError || statusError || outputError || lifecycle?.status === "failed") && (
        <div
          role="alert"
          className="mt-3 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-[11px] leading-5 text-red-700 dark:text-red-300"
        >
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
          {lifecycle?.error ||
            (outputError
              ? "فایل ترمیم‌شده آماده است اما نمایش آن روی نقشه انجام نشد."
              : "پیگیری درخواست ترمیم انجام نشد. دوباره تلاش کنید.")}
        </div>
      )}

      <div className="mt-5 flex items-end justify-between gap-3">
        <div>
          <h2 className="text-xs font-bold text-foreground">گروه‌های خطا</h2>
          <p className="mt-1 text-[10px] text-muted-foreground">
            برای نمایش عارضه‌های هر گروه روی نقشه، کارت را انتخاب کنید.
          </p>
        </div>
        <span className="rounded-full bg-red-500/12 px-2 py-1 text-[10px] font-bold text-red-700 dark:text-red-300">
          {summary.issueGroups.toLocaleString("fa-IR")}
        </span>
      </div>

      <div className="mt-3 space-y-2.5">
        {data.report.issueGroups.map((group) => (
          <TopologyIssueGroupCard
            key={group.groupId}
            group={group}
            isSelected={selectedGroupId === group.groupId}
            onSelect={selectIssueGroup}
          />
        ))}
      </div>
      {data.report.issueDetails?.paginated && (
        <IssueDetails
          key={`${data.jobId}:${selectedGroupId}`}
          jobId={data.jobId}
          code={data.report.issueGroups.find((group) => group.groupId === selectedGroupId)?.code}
        />
      )}
    </section>
  );
}
