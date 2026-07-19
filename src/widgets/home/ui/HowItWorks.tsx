import React from "react";

import { CheckCircle2, Download, ShieldAlert, UploadCloud } from "lucide-react";

const STEPS_DATA = [
  {
    icon: <UploadCloud className="h-6 w-6 text-primary" />,
    stepNumber: "۱",
    title: "بارگذاری آسان لایه‌ها",
    description:
      "فایل‌های مکانی یا لایه‌های سازمانی خود را با هر حجمی که دارند، به‌سادگی در پنل کاربری آپلود کنید.",
  },
  {
    icon: <ShieldAlert className="h-6 w-6 text-primary" />,
    stepNumber: "۲",
    title: "اسکن و شناسایی خودکار",
    description:
      "موتور هوشمند سیستم در چند ثانیه تمام خطاهای هندسی، تداخل‌ها و شکاف‌های بین پلی‌گون‌ها را کشف می‌کند.",
  },
  {
    icon: <CheckCircle2 className="h-6 w-6 text-primary" />,
    stepNumber: "۳",
    title: "اصلاح هوشمند خطاها",
    description:
      "خطاها را به صورت خودکار با یک کلیک برطرف کنید یا آن‌ها را تعاملی روی نقشه مدیریت و ویرایش نمایید.",
  },
  {
    icon: <Download className="h-6 w-6 text-primary" />,
    stepNumber: "۴",
    title: "خروجی پاک‌سازی‌شده",
    description:
      "داده‌های مکانی کاملاً اصلاح‌شده، دقیق و منطبق بر استانداردهای توپولوژی را تحویل بگیرید.",
  },
];

function HowItWorks() {
  return (
    <section className="relative py-24 bg-background/50 overflow-hidden border-t border-border/50">
      {/* هاله نور پس‌زمینه در سمت راست */}
      <div className="absolute top-1/3 right-0 w-[350px] h-[350px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        {/* سربرگ بخش روال کار */}
        <div className="text-center max-w-2xl mx-auto mb-20 flex flex-col items-center gap-3">
          <h2 className="text-xs font-semibold tracking-wider text-primary uppercase bg-primary/10 px-3 py-1 rounded-full">
            فرآیند اجرای کار
          </h2>
          <p className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
            از بارگذاری تا خروجی دقیق در ۴ گام ساده
          </p>
          <p className="text-muted-foreground text-base sm:text-lg">
            بدون نیاز به درگیر شدن با تنظیمات پیچیده نرم‌افزاری؛ فرآیند کنترل کیفیت داده‌های شما
            کاملاً خودکار طی می‌شود.
          </p>
        </div>

        {/* شبکه مراحل کار */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* خط اتصال بین مراحل در دسکتاپ (اختیاری و ظریف) */}
          <div className="hidden lg:block absolute top-1/2 left-4 right-4 h-[1px] bg-border/40 -translate-y-12 z-0" />

          {STEPS_DATA.map((item, index) => (
            <div key={index} className="relative flex flex-col items-center text-center z-10 group">
              {/* بخش بالایی: آیکون و شماره مرحله */}
              <div className="relative mb-6">
                {/* شماره مرحله متمایز پشت آیکون */}
                {/* تگ شماره مرحله اصلاح شده */}
                <span className="absolute -top-6 -right-4 text-5xl font-black text-muted-foreground/40 tracking-tighter select-none group-hover:text-primary/40 transition-colors duration-300 z-5">
                  {item.stepNumber}
                </span>

                {/* باکس اصلی آیکون */}
                <div className="flex items-center justify-center w-16 h-16 rounded-xl border border-border bg-card shadow-lg group-hover:border-primary/40 group-hover:shadow-[0_0_20px_rgba(114,180,145,0.15)] transition-all duration-300">
                  {item.icon}
                </div>
              </div>

              {/* عنوان و توضیحات گام */}
              <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                {item.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xs font-light">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
