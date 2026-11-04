import { useState } from "react";

import type { SystemReports } from "@features/business";
import { count } from "@features/business";

import { reportBuckets, reportDate } from "../model/report-model";

const metrics = [
  { key: "uploads", label: "آپلودها" },
  { key: "healedIssues", label: "اصلاحات" },
  { key: "failed", label: "ناموفق‌ها" },
] as const;

export function ReportTrend({ daily }: { daily: SystemReports["daily"] }) {
  const [metric, setMetric] = useState<(typeof metrics)[number]["key"]>("uploads");
  const buckets = reportBuckets(daily);
  const max = Math.max(1, ...buckets.map((bucket) => bucket[metric]));
  const metricLabel = metrics.find((item) => item.key === metric)!.label;
  const step = 920 / Math.max(1, buckets.length);
  return (
    <section className="min-w-0 rounded-2xl border border-border bg-card p-5 lg:col-span-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-bold">روند فعالیت</h2>
          <p className="mt-1 text-xs leading-6 text-muted-foreground">
            بر پایهٔ تاریخ آپلود فایل؛ وضعیت فعلی ترمیم در گزارش لحاظ شده است.
          </p>
        </div>
        <div className="flex rounded-xl bg-muted p-1" role="group" aria-label="شاخص نمودار">
          {metrics.map((item) => (
            <button
              key={item.key}
              type="button"
              aria-pressed={metric === item.key}
              onClick={() => setMetric(item.key)}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${metric === item.key ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <figure className="mt-5">
        <div className="mb-2 flex justify-between text-[11px] text-muted-foreground">
          <span>{metricLabel}</span>
          <span>{count(max)}</span>
        </div>
        <svg
          viewBox="0 0 960 210"
          direction="ltr"
          className={`h-56 w-full ${metric === "failed" ? "text-destructive" : "text-primary"}`}
          role="img"
          aria-label={`نمودار ${metricLabel} در بازه انتخاب‌شده`}
        >
          {[20, 110, 200].map((y) => (
            <line
              key={y}
              x1="10"
              x2="950"
              y1={y}
              y2={y}
              stroke="currentColor"
              strokeOpacity="0.12"
              strokeDasharray="4 5"
            />
          ))}
          {buckets.map((bucket, index) => {
            const height = (bucket[metric] / max) * 180;
            const label = `${reportDate(bucket.from)}${bucket.from !== bucket.to ? ` تا ${reportDate(bucket.to)}` : ""}: ${count(bucket[metric])}`;
            return (
              <rect
                key={bucket.from}
                x={20 + index * step + step * 0.15}
                y={200 - height}
                width={step * 0.7}
                height={height}
                rx={Math.min(4, step * 0.1)}
                fill="currentColor"
                opacity="0.8"
                tabIndex={0}
                aria-label={label}
                className="outline-offset-2 hover:opacity-100 focus:opacity-100"
              >
                <title>{label}</title>
              </rect>
            );
          })}
        </svg>
        <div dir="ltr" className="mb-3 flex justify-between gap-3 text-xs text-muted-foreground">
          <span dir="rtl">{buckets.length ? reportDate(buckets[0].from) : ""}</span>
          <span dir="rtl">{buckets.length ? reportDate(buckets[buckets.length - 1].to) : ""}</span>
        </div>
        <figcaption className="text-xs leading-6 text-muted-foreground">
          {daily.length > 40
            ? `برای خوانایی، هر ستون مجموع حداکثر ${count(Math.ceil(daily.length / 40))} روز است.`
            : "هر ستون یک روز است؛ برای دیدن مقدار، روی آن بروید یا با صفحه‌کلید انتخابش کنید."}
        </figcaption>
      </figure>
    </section>
  );
}
