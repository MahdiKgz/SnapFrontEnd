import type { SystemReports } from "@features/business";

const DAY = 86_400_000;
export const reportRange = (days = 30, now = new Date()) => {
  const to = now.toISOString().slice(0, 10);
  const end = new Date(`${to}T00:00:00Z`).getTime();
  return { from: new Date(end - (days - 1) * DAY).toISOString().slice(0, 10), to };
};
export const validReportRange = ({ from, to }: { from: string; to: string }) => {
  const start = Date.parse(`${from}T00:00:00Z`);
  const end = Date.parse(`${to}T00:00:00Z`);
  const validDate = (date: string, time: number) =>
    /^\d{4}-\d{2}-\d{2}$/.test(date) &&
    Number.isFinite(time) &&
    new Date(time).toISOString().slice(0, 10) === date;
  return validDate(from, start) && validDate(to, end) && start <= end && end - start < 366 * DAY;
};
export const reportDate = (date: string) =>
  new Date(date.length === 10 ? `${date}T00:00:00Z` : date).toLocaleDateString("fa-IR", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
  });
export const reportBytes = (bytes: number) => {
  if (!bytes) return "۰ بایت";
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), 4);
  return `${(bytes / 1024 ** index).toLocaleString("fa-IR", { maximumFractionDigits: 1 })} ${["بایت", "کیلوبایت", "مگابایت", "گیگابایت", "ترابایت"][index]}`;
};
export const statusLabel = (status: string) =>
  ({
    "dry-run-complete": "در انتظار ترمیم",
    queued: "در صف",
    processing: "در حال ترمیم",
    completed: "ترمیم‌شده",
    failed: "ناموفق",
    cancelled: "لغوشده",
  })[status] ?? status;

export function reportBuckets(daily: SystemReports["daily"]) {
  const size = Math.max(1, Math.ceil(daily.length / 40));
  return Array.from({ length: Math.ceil(daily.length / size) }, (_, index) => {
    const days = daily.slice(index * size, (index + 1) * size);
    return {
      from: days[0].date,
      to: days[days.length - 1].date,
      uploads: days.reduce((sum, day) => sum + day.uploads, 0),
      failed: days.reduce((sum, day) => sum + day.failed, 0),
      healedIssues: days.reduce((sum, day) => sum + day.healedIssues, 0),
    };
  });
}
export function reportsCsv(data: Pick<SystemReports, "daily">) {
  const rows = [
    [
      "تاریخ (UTC)",
      "آپلود",
      "ترمیم‌شده",
      "ناموفق",
      "خطای شناسایی‌شده",
      "اصلاح ثبت‌شده",
      "حجم (بایت)",
    ],
    ...data.daily.map((day) => [
      day.date,
      day.uploads,
      day.completed,
      day.failed,
      day.identifiedIssues,
      day.healedIssues,
      day.bytes,
    ]),
  ];
  return rows
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\r\n");
}
