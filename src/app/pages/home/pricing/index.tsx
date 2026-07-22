import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Building2,
  Check,
  Headphones,
  Server,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

const INDIVIDUAL_PLANS = [
  {
    id: "starter",
    name: "پایه (استارتاپ)",
    priceMonth: "۴۹۰,۰۰۰",
    priceYear: "۳۹۰,۰۰۰",
    description: "مناسب متخصصین و پروژه‌های کوچک جهت اسکن و رفع خطاهای اولیه.",
    features: [
      "پردازش تا ۵۰ لایه در ماه",
      "حداکثر حجم فایل: ۵۰ مگابایت",
      "پشتیبانی از فرمت‌های GeoJSON و KML",
      "الگوریتم‌های پایه رفع تداخل و شکاف",
      "خروجی استاندارد وکتوری",
      "پشتیبانی تیکتی (پاسخ‌گویی ۲۴ ساعته)",
    ],
    popular: false,
    buttonText: "شروع دوره آزمایشی",
  },
  {
    id: "pro",
    name: "حرفه‌ای (Pro)",
    priceMonth: "۹۹۰,۰۰۰",
    priceYear: "۷۹۰,۰۰۰",
    description: "بهترین گزینه برای مشاوران GIS و شرکت‌های در حال رشد.",
    features: [
      "پردازش تا ۵۰۰ لایه در ماه",
      "حداکثر حجم فایل: ۲۵۰ مگابایت",
      "پشتیبانی از تمام فرمت‌ها (GeoJSON, SHP, KML, TopoJSON)",
      "موتور پیشرفته هوشمند رفع خطاهای پیچیده",
      "دسترس‌پذیری API جهت اتصال به سیستم‌ها",
      "گزارش‌گیری تحلیلی و مدیریتی کامل",
      "پشتیبانی اولویت‌دار تلفنی و تیکتی",
    ],
    popular: true,
    buttonText: "انتخاب پلن حرفه‌ای",
  },
  {
    id: "advanced",
    name: "پیشرفته (Enterprise Lite)",
    priceMonth: "۱,۹۹۰,۰۰۰",
    priceYear: "۱,۵۹۰,۰۰۰",
    description: "برای تیم‌های بزرگ که نیاز به پردازش مداوم و حجم بالای داده دارند.",
    features: [
      "پردازش تا ۲,۵۰۰ لایه در ماه",
      "حداکثر حجم فایل: ۱ گیگابایت",
      "پردازش هم‌زمان و موازی فایل‌ها",
      "اتصال مستقیم به پایگاه‌داده PostGIS",
      "تعریف متدهای سفارشی صحت‌سنجی",
      "پشتیبانی اختصاصی ۲۴/۷",
    ],
    popular: false,
    buttonText: "ارتقا به پیشرفته",
  },
];

const ENTERPRISE_FEATURES = [
  {
    icon: <Server className="h-6 w-6 text-primary" />,
    title: "نصب روی زیرساخت اختصاصی (On-Premise)",
    description:
      "امکان استقرار کامل موتور پردازشی SnapGIS روی سرورها و شبکه داخلی سازمان جهت حفظ حداکثر امنیت داده‌ها.",
  },
  {
    icon: <ShieldCheck className="h-6 w-6 text-primary" />,
    title: "توافق‌نامه سطح خدمات (SLA اختصاصی)",
    description:
      "تضمین پایداری ۹۹.۹٪ سیستم، پشتیبانی فنی اختصاصی و تعهد به زمان رفع خطاهای احتمالی.",
  },
  {
    icon: <Zap className="h-6 w-6 text-primary" />,
    title: "پردازش بدون محدودیت و سفارشی",
    description:
      "عدم محدودیت در حجم و تعداد لایه‌ها به همراه توسعه الگوریتم‌های اختصاصی توپولوژی متناسب با استاندرادهای سازمان شما.",
  },
  {
    icon: <Headphones className="h-6 w-6 text-primary" />,
    title: "تیم پشتیبانی و آموزش اختصاصی",
    description:
      "برگزاری دوره‌های آموزشی برای کارشناسان GIS سازمان و همراهی مدیر حساب اختصاصی در تمام مراحل.",
  },
];

function PricingPage() {
  const [activeTab, setActiveTab] = useState<"standard" | "enterprise">("standard");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("yearly");

  return (
    <div className="min-h-screen bg-background text-foreground py-16 px-6 relative overflow-hidden">
      {/* نور پس‌زمینه */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="container mx-auto max-w-7xl relative z-10">
        {/* سربرگ و تیتر اصلی */}
        <div className="flex flex-col items-center text-center gap-4 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            تعرفه‌های شفاف و انعطاف‌پذیر
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground">
            پلن مناسب <span className="text-primary">کسب‌ و کار خود</span> را انتخاب کنید
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-2xl font-light">
            از پروژه‌های شخصی تا سامانه‌های یکپارچه سازمانی؛ ابزارهای هوشمند پاک‌سازی داده‌های مکانی
            در اختیار شماست.
          </p>

          {/* سوییچ اصلی تب‌ها (استاندارد vs سازمانی) */}
          <div className="flex items-center p-1.5 rounded-xl border border-border/60 bg-card/40 backdrop-blur-md mt-6">
            <button
              onClick={() => setActiveTab("standard")}
              className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === "standard"
                  ? "bg-primary text-primary-foreground shadow-[0_2px_12px_rgba(114,180,145,0.3)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              پلن‌های استاندارد
            </button>
            <button
              onClick={() => setActiveTab("enterprise")}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === "enterprise"
                  ? "bg-primary text-primary-foreground shadow-[0_2px_12px_rgba(114,180,145,0.3)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Building2 className="h-4 w-4" />
              راهکارهای سازمانی (Enterprise)
            </button>
          </div>
        </div>

        {/* محتوای تب اول: پلن‌های استاندارد */}
        {activeTab === "standard" && (
          <div className="space-y-10 animate-in fade-in duration-300">
            {/* سوییچ ماهانه / سالانه */}
            <div className="flex items-center justify-center gap-3 text-sm">
              <span
                className={`font-medium ${billingCycle === "monthly" ? "text-foreground" : "text-muted-foreground"}`}
              >
                پرداخت ماهانه
              </span>
              <button
                onClick={() => setBillingCycle(billingCycle === "monthly" ? "yearly" : "monthly")}
                className="w-12 h-6 rounded-full bg-card border border-border/80 p-1 relative transition-colors"
              >
                <div
                  className={`w-4 h-4 rounded-full bg-primary transition-transform ${
                    billingCycle === "yearly" ? "-translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
              <span
                className={`font-medium flex items-center gap-1.5 ${billingCycle === "yearly" ? "text-foreground" : "text-muted-foreground"}`}
              >
                پرداخت سالانه
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary font-bold">
                  ۲۰٪ تخفیف
                </span>
              </span>
            </div>

            {/* گرید کارت‌های قیمت‌گذاری */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
              {INDIVIDUAL_PLANS.map((plan) => (
                <div
                  key={plan.id}
                  className={`relative rounded-2xl border p-8 backdrop-blur-md flex flex-col justify-between transition-all duration-300 ${
                    plan.popular
                      ? "border-primary bg-card/60 shadow-[0_0_35px_rgba(114,180,145,0.15)] md:-translate-y-2"
                      : "border-border/60 bg-card/30 hover:border-border"
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3.5 right-1/2 translate-x-1/2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-black shadow-md">
                      پیشنهاد ویژه
                    </div>
                  )}

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                      <p className="text-xs text-muted-foreground font-light mt-2 leading-relaxed">
                        {plan.description}
                      </p>
                    </div>

                    {/* قیمت */}
                    <div className="flex items-baseline gap-1 border-b border-border/40 pb-6">
                      <span className="text-3xl font-black text-foreground tracking-tight">
                        {billingCycle === "yearly" ? plan.priceYear : plan.priceMonth}
                      </span>
                      <span className="text-xs text-muted-foreground font-light">
                        تومان / ماهانه
                      </span>
                    </div>

                    {/* لیست امکانات */}
                    <ul className="space-y-3">
                      {plan.features.map((feature, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2.5 text-xs text-foreground/80 font-light"
                        >
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Button
                    className={`w-full h-11 mt-8 font-semibold text-xs transition-all ${
                      plan.popular
                        ? "shadow-[0_0_20px_rgba(114,180,145,0.2)]"
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    }`}
                  >
                    {plan.buttonText}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* محتوای تب دوم: راهکارهای سازمانی */}
        {activeTab === "enterprise" && (
          <div className="space-y-12 animate-in fade-in duration-300">
            {/* بنر معرفی سرویس سازمانی */}
            <div className="rounded-2xl border border-border/60 bg-card/30 p-8 sm:p-12 backdrop-blur-md flex flex-col lg:flex-row items-center justify-between gap-8 shadow-xl">
              <div className="space-y-4 max-w-2xl text-right">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium">
                  <Building2 className="h-3.5 w-3.5" />
                  مخصوص ارگان‌ها، شهرداری‌ها و شرکت‌های بزرگ
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-foreground leading-tight">
                  زیرساخت اختصاصی رفع خطای مکانی برای سازمان شما
                </h2>
                <p className="text-muted-foreground text-sm leading-relaxed font-light">
                  اگر حجم داده‌های مکانی شما بالاست یا به دلایل امنیتی نیاز به نصب زیرساخت درون
                  شبکه‌ای (On-Premise) دارید، تیم مهندسی SnapGIS آماده ارائه راهکار تخصصی است.
                </p>
              </div>

              <Button
                size="lg"
                className="h-12 px-8 text-sm font-bold gap-2 shrink-0 shadow-[0_0_20px_rgba(114,180,145,0.2)]"
              >
                درخواست جلسه / دموی اختصاصی
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>

            {/* گرید ویژگی‌های سازمانی */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {ENTERPRISE_FEATURES.map((item, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-border/60 bg-card/40 p-6 backdrop-blur-md space-y-3"
                >
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 w-fit">
                    {item.icon}
                  </div>
                  <h3 className="text-base font-bold text-foreground">{item.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed font-light">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PricingPage;
