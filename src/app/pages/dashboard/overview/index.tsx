import React from "react";

import { Button } from "@/components/ui/button";
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  ShieldAlert,
} from "lucide-react";

const STATS_DATA = [
  {
    title: "کل لایه‌های بارگذاری‌شده",
    value: "۲۴ لایه",
    change: "+۱۲٪ این ماه",
    icon: <Layers className="h-5 w-5 text-primary" />,
    bg: "bg-primary/10",
  },
  {
    title: "خطاهای توپولوژی شناسایی‌شده",
    value: "۱,۴۲۰ خطا",
    change: "۸۴٪ برطرف شده",
    icon: <ShieldAlert className="h-5 w-5 text-destructive" />,
    bg: "bg-destructive/10",
  },
  {
    title: "صرفه‌جویی در زمان بازبینی",
    value: "۴۸ ساعت",
    change: "در ۲ هفته اخیر",
    icon: <CheckCircle2 className="h-5 w-5 text-primary" />,
    bg: "bg-primary/10",
  },
  {
    title: "وضعیت موتور خودکار",
    value: "پایدار",
    change: "نرخ دقت ۹۹.۸٪",
    icon: <Activity className="h-5 w-5 text-emerald-500" />,
    bg: "bg-emerald-500/10",
  },
];

const RECENT_ACTIVITIES = [
  {
    id: 1,
    name: "نقشه لایه خروجی معابر شهری.geojson",
    type: "اصلاح خودکار توپولوژی",
    status: "موفق",
    time: "۱۰ دقیقه پیش",
  },
  {
    id: 2,
    name: "بلوک‌های ساختمانی منطقه ۱.shp",
    type: "اسکن و کشف تداخل‌ها",
    status: "دارای خطا",
    time: "۱ ساعت پیش",
  },
  {
    id: 3,
    name: "اراضی کشاورزی حومه.kml",
    type: "پاک‌سازی تداخل و شکاف‌ها",
    status: "موفق",
    time: "دیروز",
  },
];

function Overview() {
  return (
    <div className="p-6 md:p-8 space-y-8 h-full overflow-y-auto">
      {/* سربرگ صفحه خلاصه وضعیت */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight text-foreground">خلاصه وضعیت سیستم</h1>
          <p className="text-sm text-muted-foreground font-light">
            گزارش کلیدی از فرآیند خودکارسازی، کنترل کیفیت و وضعیت فایل‌های مکانی شما.
          </p>
        </div>
        <Button className="gap-2 shadow-[0_4px_12px_rgba(114,180,145,0.15)]">
          <FileSpreadsheet className="h-4 w-4" />
          خروجی گزارش جامع
        </Button>
      </div>

      {/* کارت‌های آمار کلیدی */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {STATS_DATA.map((stat, index) => (
          <div
            key={index}
            className="relative rounded-xl border border-border/60 bg-card p-6 shadow-sm flex flex-col justify-between gap-4 hover:border-border transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground font-medium">{stat.title}</span>
              <div className={`p-2 rounded-lg ${stat.bg} shrink-0`}>{stat.icon}</div>
            </div>
            <div>
              <span className="text-2xl font-black text-foreground tracking-tight">
                {stat.value}
              </span>
              <p className="text-xs text-muted-foreground font-light mt-1">{stat.change}</p>
            </div>
          </div>
        ))}
      </div>

      {/* بخش پایینی: جدول آخرین فعالیت‌ها */}
      <div className="rounded-xl border border-border/60 bg-card p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-foreground">آخرین فعالیت‌های پردازشی</h3>
            <p className="text-xs text-muted-foreground font-light">
              لیست آخرین لایه‌های مکانی که توسط موتور توپولوژی اسکن یا ویرایش شده‌اند.
            </p>
          </div>
          <Button variant="ghost" size="sm" className="text-xs text-primary gap-1">
            مشاهده همه فعالیت‌ها
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b border-border/40 text-sm font-semibold text-muted-foreground h-10">
                <th className="pb-3 pr-2">نام فایل لایه</th>
                <th className="pb-3">نوع عملیات پردازشی</th>
                <th className="pb-3">وضعیت نهایی</th>
                <th className="pb-3 pl-2 text-left">زمان اجرا</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30 text-sm font-light text-foreground/90">
              {RECENT_ACTIVITIES.map((activity) => (
                <tr key={activity.id} className="h-12 hover:bg-muted/30 transition-colors">
                  <td className="pr-2 font-medium max-w-[200px] truncate" dir="ltr">
                    {activity.name}
                  </td>
                  <td className="text-muted-foreground">{activity.type}</td>
                  <td>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        activity.status === "موفق"
                          ? "bg-primary/10 text-primary"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {activity.status}
                    </span>
                  </td>
                  <td className="pl-2 text-left text-muted-foreground font-sans">
                    {activity.time}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Overview;
