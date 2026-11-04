import { useState } from "react";
import type { FormEvent, ReactNode } from "react";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  Download,
  Files,
  LoaderCircle,
  RefreshCw,
  Users,
  WandSparkles,
} from "lucide-react";
import { Link } from "react-router-dom";

import {
  BusinessMessage,
  businessError,
  count,
  useGetSystemReportsQuery,
} from "@features/business";

import {
  reportBytes,
  reportDate,
  reportRange,
  reportsCsv,
  statusLabel,
  validReportRange,
} from "../model/report-model";
import { ReportTrend } from "./report-trend";

function Metric({
  title,
  value,
  description,
  icon,
  tone = "text-primary",
}: {
  title: string;
  value: number;
  description: string;
  icon: ReactNode;
  tone?: string;
}) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        <span className={`rounded-xl bg-muted p-2.5 ${tone}`}>{icon}</span>
      </div>
      <strong className={`mt-3 block text-3xl font-black ${tone}`}>{count(value)}</strong>
      <p className="mt-3 text-xs leading-6 text-muted-foreground">{description}</p>
    </article>
  );
}

export default function AdminReportsPage() {
  const [range, setRange] = useState(() => reportRange());
  const [draft, setDraft] = useState(range);
  const [validation, setValidation] = useState("");
  const request = useGetSystemReportsQuery(range, { refetchOnMountOrArgChange: true });
  const data = request.currentData?.data;
  const apply = (event: FormEvent) => {
    event.preventDefault();
    if (!validReportRange(draft)) {
      setValidation("بازهٔ تاریخ باید معتبر، به‌ترتیب و حداکثر ۳۶۶ روز باشد.");
      return;
    }
    setValidation("");
    setRange({ ...draft });
  };
  const exportDaily = () => {
    if (!data) return;
    const url = URL.createObjectURL(
      new Blob(["\uFEFF", reportsCsv(data)], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `snapgis-report-${data.range.from}-${data.range.to}.csv`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  };
  return (
    <div dir="rtl" className="h-full overflow-y-auto p-5 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-primary">مدیریت سامانه</p>
            <h1 className="mt-1 text-2xl font-black">گزارش‌های سامانه</h1>
            <p className="mt-2 text-sm leading-7 text-muted-foreground">
              نمای کلی کاربران، فعالیت فایل‌ها و نتیجهٔ پردازش‌های سامانه.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              disabled={!data || request.isFetching || request.isError}
              onClick={exportDaily}
            >
              <Download className="size-4" />
              خروجی CSV روند روزانه
            </Button>
            <Button
              aria-label="به‌روزرسانی گزارش‌ها"
              variant="outline"
              size="icon"
              disabled={request.isFetching}
              onClick={() => void request.refetch()}
            >
              <RefreshCw className={`size-4 ${request.isFetching ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </header>
        <section className="rounded-2xl border border-border bg-card p-4">
          <form onSubmit={apply} className="flex flex-wrap items-end gap-3">
            <label className="space-y-2 text-xs font-medium">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-3.5 text-primary" />
                از تاریخ
              </span>
              <Input
                aria-label="از تاریخ"
                type="date"
                value={draft.from}
                max={draft.to || undefined}
                onChange={(event) => setDraft({ ...draft, from: event.target.value })}
                className="w-44"
                dir="ltr"
              />
            </label>
            <label className="space-y-2 text-xs font-medium">
              <span className="block">تا تاریخ</span>
              <Input
                aria-label="تا تاریخ"
                type="date"
                value={draft.to}
                min={draft.from || undefined}
                onChange={(event) => setDraft({ ...draft, to: event.target.value })}
                className="w-44"
                dir="ltr"
              />
            </label>
            <Button type="submit" disabled={request.isFetching}>
              اعمال بازه
            </Button>
            <div className="flex flex-wrap gap-1 sm:mr-auto">
              {[7, 30, 90].map((days) => (
                <Button
                  key={days}
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => {
                    const next = reportRange(days);
                    setDraft(next);
                    setRange(next);
                    setValidation("");
                  }}
                >
                  {count(days)} روز اخیر
                </Button>
              ))}
            </div>
          </form>
          <p className="mt-3 text-[11px] leading-6 text-muted-foreground">
            تاریخ‌ها بر مبنای UTC هستند. آمار فایل‌ها با تاریخ آپلود فیلتر می‌شود و سابقهٔ فایل‌های
            حذف‌شده را هم در بر می‌گیرد.
          </p>
        </section>
        {validation && <BusinessMessage error>{validation}</BusinessMessage>}
        {request.isError ? (
          <div className="rounded-2xl border border-destructive/25 bg-card p-8 text-center">
            <AlertTriangle className="mx-auto size-8 text-destructive" />
            <h2 className="mt-3 font-bold">گزارش دریافت نشد</h2>
            <p role="alert" className="mt-2 text-sm text-muted-foreground">
              {businessError(request.error)}
            </p>
            <Button className="mt-5" variant="outline" onClick={() => void request.refetch()}>
              تلاش دوباره
            </Button>
          </div>
        ) : !data ? (
          <div
            role="status"
            className="flex min-h-80 items-center justify-center gap-2 text-sm text-muted-foreground"
          >
            <LoaderCircle className="size-5 animate-spin" />
            در حال دریافت گزارش‌های سامانه...
          </div>
        ) : (
          <>
            <section
              className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
              aria-label="خلاصهٔ پردازش‌ها"
            >
              <Metric
                title="فایل‌های آپلودشده"
                value={data.summary.uploads}
                description={`${reportDate(data.range.from)} تا ${reportDate(data.range.to)}؛ شامل سوابق حذف‌شده`}
                icon={<Files className="size-5" />}
              />
              <Metric
                title="ترمیم تکمیل‌شده"
                value={data.summary.completed}
                description="وضعیت فعلی فایل‌های آپلودشده در این بازه"
                icon={<CheckCircle2 className="size-5" />}
              />
              <Metric
                title="پردازش ناموفق"
                value={data.summary.failed}
                description="فایل‌های این بازه با وضعیت فعلی ناموفق"
                icon={<AlertTriangle className="size-5" />}
                tone="text-destructive"
              />
              <Metric
                title="اصلاح ثبت‌شده"
                value={data.summary.healedIssues}
                description={`${count(data.summary.identifiedIssues)} خطای شناسایی‌شده در این بازه`}
                icon={<WandSparkles className="size-5" />}
              />
            </section>
            {data.summary.uploads === 0 && (
              <BusinessMessage>
                در بازهٔ انتخاب‌شده هیچ فایل آپلودشده‌ای ثبت نشده است.
              </BusinessMessage>
            )}
            <div className="grid gap-5 lg:grid-cols-3">
              <ReportTrend daily={data.daily} />
              <section className="rounded-2xl border border-border bg-card p-5">
                <h2 className="flex items-center gap-2 font-bold">
                  <Activity className="size-4 text-primary" />
                  وضعیت پردازش‌ها
                </h2>
                <div className="mt-5 space-y-4">
                  {data.statuses.map((item) => (
                    <div key={item.status}>
                      <div className="mb-2 flex items-center justify-between gap-3 text-xs">
                        <span>{statusLabel(item.status)}</span>
                        <strong>{count(item.count)}</strong>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className={`h-full rounded-full ${item.status === "failed" ? "bg-destructive" : item.status === "completed" ? "bg-primary" : "bg-primary/45"}`}
                          style={{
                            width: `${data.summary.uploads ? Math.min(100, (item.count / data.summary.uploads) * 100) : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-5 text-xs leading-6 text-muted-foreground">
                  {count(data.summary.processing)} فایل در صف یا در حال ترمیم است.
                </p>
              </section>
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              <section className="rounded-2xl border border-border bg-card p-5">
                <h2 className="flex items-center gap-2 font-bold">
                  <Users className="size-4 text-primary" />
                  حساب‌ها و شرکت‌ها
                </h2>
                <p className="mt-1 text-xs leading-6 text-muted-foreground">
                  تعداد فعلی کل سامانه؛ کاربران جدید مربوط به بازهٔ انتخاب‌شده‌اند.
                </p>
                <dl className="mt-5 grid grid-cols-2 gap-3">
                  {[
                    ["کل کاربران", data.summary.users],
                    ["کاربران جدید", data.summary.newUsers],
                    ["کل شرکت‌ها", data.summary.companies],
                    ["شرکت‌های با پلن فعال", data.summary.activeCompanies],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="rounded-xl bg-muted/60 p-4">
                      <dt className="text-xs text-muted-foreground">{label}</dt>
                      <dd className="mt-2 text-xl font-black">{count(Number(value))}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-4 flex flex-wrap gap-2">
                  {data.plans.map((plan) => (
                    <span
                      key={plan.code}
                      className="rounded-lg border border-border px-3 py-2 text-xs"
                    >
                      {plan.name}: <strong>{count(plan.count)}</strong>
                    </span>
                  ))}
                </div>
              </section>
              <section className="rounded-2xl border border-border bg-card p-5">
                <h2 className="font-bold">حجم و نگهداری فایل‌ها</h2>
                <p className="mt-1 text-xs leading-6 text-muted-foreground">
                  برای فایل‌های آپلودشده در بازهٔ انتخاب‌شده
                </p>
                <p className="mt-6 text-3xl font-black text-primary">
                  {reportBytes(data.summary.bytes)}
                </p>
                <p className="mt-2 text-xs leading-6 text-muted-foreground">
                  حجم تجمعی آپلود؛ شامل فایل‌های حذف‌شده است.
                </p>
                <dl className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-muted/60 p-4">
                    <dt className="text-xs text-muted-foreground">فایل‌های نگهداری‌شده</dt>
                    <dd className="mt-2 text-xl font-black">{count(data.summary.storedFiles)}</dd>
                  </div>
                  <div className="rounded-xl bg-muted/60 p-4">
                    <dt className="text-xs text-muted-foreground">سوابق فایل حذف‌شده</dt>
                    <dd className="mt-2 text-xl font-black">{count(data.summary.deletedFiles)}</dd>
                  </div>
                </dl>
              </section>
            </div>
            <section className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="border-b border-border p-5">
                <h2 className="font-bold">آخرین پردازش‌های ناموفق</h2>
                <p className="mt-1 text-xs leading-6 text-muted-foreground">
                  حداکثر ۱۰ فایل موجود از بازهٔ انتخاب‌شده
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-right text-sm">
                  <thead className="bg-muted/70 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-5 py-3">فایل</th>
                      <th className="px-5 py-3">کاربر</th>
                      <th className="px-5 py-3">تاریخ آپلود</th>
                      <th className="px-5 py-3">حجم</th>
                      <th className="px-5 py-3">وضعیت</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentFailures.map((file) => (
                      <tr key={file.id} className="border-t border-border">
                        <td className="px-5 py-4">
                          <strong className="block">{file.name}</strong>
                          <bdi
                            className="mt-1 block max-w-72 truncate text-xs text-muted-foreground"
                            dir="ltr"
                          >
                            {file.originalName}
                          </bdi>
                        </td>
                        <td className="px-5 py-4">
                          <Link
                            className="font-medium text-primary hover:underline"
                            to={`/dashboard/admin/users?user=${encodeURIComponent(file.user.id)}`}
                          >
                            {file.user.name}
                          </Link>
                        </td>
                        <td className="px-5 py-4 text-xs">{reportDate(file.createdAt)}</td>
                        <td className="px-5 py-4 text-xs">{reportBytes(file.sizeInBytes)}</td>
                        <td className="px-5 py-4">
                          <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
                            ناموفق
                          </span>
                        </td>
                      </tr>
                    ))}
                    {!data.recentFailures.length && (
                      <tr>
                        <td colSpan={5} className="p-10 text-center text-muted-foreground">
                          <CheckCircle2 className="mx-auto mb-3 size-7 text-primary" />
                          فایل ناموفقی در این بازه وجود ندارد.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}
