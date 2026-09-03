import type { ReactNode } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Crown,
  Files,
  LoaderCircle,
  Map,
  RefreshCw,
  ScanSearch,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useGetUserDashboardSummaryQuery } from "../api/files-api";

const formatCount = (value: number) => value.toLocaleString("fa-IR");

function MetricCard({
  description,
  icon,
  label,
  tone,
  value,
}: {
  description: string;
  icon: ReactNode;
  label: string;
  tone: string;
  value: number;
}) {
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
      <span className={`absolute inset-x-0 top-0 h-0.5 ${tone}`} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <strong className="mt-3 block text-3xl font-black tracking-tight text-foreground">
            {formatCount(value)}
          </strong>
        </div>
        <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary [&_svg]:size-5">
          {icon}
        </span>
      </div>
      <p className="mt-4 text-xs leading-6 text-muted-foreground">{description}</p>
    </article>
  );
}

function LoadingOverview() {
  return (
    <div className="flex min-h-[24rem] items-center justify-center gap-2 text-sm text-muted-foreground">
      <LoaderCircle className="size-5 animate-spin" />
      در حال آماده‌سازی پیشخوان...
    </div>
  );
}

export function DashboardOverview() {
  const { data, isError, isFetching, refetch } = useGetUserDashboardSummaryQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const summary = data?.data;

  if (isFetching && !summary) return <LoadingOverview />;

  if (isError || !summary) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
          <AlertTriangle className="mx-auto size-9 text-destructive" />
          <h1 className="mt-4 text-lg font-bold">پیشخوان دریافت نشد</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            ارتباط با سرور برقرار نشد. لطفاً دوباره تلاش کنید.
          </p>
          <Button className="mt-5 gap-2" variant="outline" onClick={() => void refetch()}>
            <RefreshCw />
            تلاش دوباره
          </Button>
        </div>
      </div>
    );
  }

  const repairRate =
    summary.usage.identifiedIssues > 0
      ? Math.min(
          100,
          Math.round((summary.usage.healedIssues / summary.usage.identifiedIssues) * 100),
        )
      : 0;

  return (
    <div className="h-full overflow-y-auto p-5 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold text-primary">نمای کلی حساب</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-foreground">پیشخوان</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              وضعیت اشتراک و خلاصه فعالیت فایل‌های مکانی شما در یک نگاه.
            </p>
          </div>
          <Link to="/map" className={buttonVariants({ className: "gap-2" })}>
            <Map />
            تحلیل فایل جدید
          </Link>
        </header>

        <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-l from-primary/15 via-card to-card p-6 shadow-sm md:p-7">
          <div className="pointer-events-none absolute -left-16 -top-20 size-56 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <Crown className="size-6" />
              </span>
              <div>
                <p className="text-xs text-muted-foreground">طرح فعلی شما</p>
                <h2 className="mt-1 text-2xl font-black">{summary.plan.name}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  تمام قابلیت‌های فعلی SnapGIS برای شما فعال است.
                </p>
              </div>
            </div>
            <div className="flex min-w-56 items-center gap-3 rounded-2xl border border-border/60 bg-background/60 px-4 py-3 backdrop-blur-sm">
              <Clock3 className="size-5 text-primary" />
              <div>
                <p className="text-[11px] text-muted-foreground">زمان باقی‌مانده</p>
                <p className="mt-0.5 text-sm font-bold">
                  {summary.plan.remainingDays === null
                    ? "بدون محدودیت زمانی"
                    : `${formatCount(summary.plan.remainingDays)} روز`}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label="فایل‌های بارگذاری‌شده"
            value={summary.usage.files}
            description="مجموع فایل‌هایی که در حساب شما نگهداری می‌شوند."
            icon={<Files />}
            tone="bg-sky-500"
          />
          <MetricCard
            label="خطاهای شناسایی‌شده"
            value={summary.usage.identifiedIssues}
            description="مجموع ایرادهایی که تحلیل خودکار در فایل‌ها پیدا کرده است."
            icon={<ScanSearch />}
            tone="bg-amber-500"
          />
          <MetricCard
            label="خطاهای ترمیم‌شده"
            value={summary.usage.healedIssues}
            description="مجموع اصلاحاتی که موتور ترمیم با موفقیت اعمال کرده است."
            icon={<CheckCircle2 />}
            tone="bg-emerald-500"
          />
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <article className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold">نرخ ترمیم خطاها</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  نسبت خطاهای ترمیم‌شده به کل خطاهای شناسایی‌شده
                </p>
              </div>
              <strong className="text-2xl font-black text-primary">
                ٪{formatCount(repairRate)}
              </strong>
            </div>
            <div
              className="mt-5 h-2 overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-label="نرخ ترمیم خطاها"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={repairRate}
            >
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-700"
                style={{ width: `${repairRate}%` }}
              />
            </div>
          </article>

          <Link
            to="/dashboard/files"
            className="group flex items-center justify-between gap-4 rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Files className="size-5" />
              </span>
              <div>
                <h2 className="text-sm font-bold">مدیریت فایل‌ها</h2>
                <p className="mt-1 text-xs text-muted-foreground">مشاهده، ویرایش یا حذف فایل‌ها</p>
              </div>
            </div>
            <ArrowLeft className="size-4 text-muted-foreground transition-transform group-hover:-translate-x-1 group-hover:text-primary" />
          </Link>
        </section>
      </div>
    </div>
  );
}
