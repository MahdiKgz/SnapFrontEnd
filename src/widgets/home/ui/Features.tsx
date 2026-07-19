import React from "react";

import { Database, Layers, Sliders, Zap } from "lucide-react";

// نصب پکیج lucide-react لازمه: pnpm add lucide-react

const FEATURES_DATA = [
  {
    icon: <Zap className="h-6 w-6 text-primary" />,
    title: "اصلاح آنی و خودکار خطاهای هندسی",
    description:
      "دیگر نیازی به بازبینی دستی تک‌تک پلی‌گون‌ها نیست. موتور هوشمند سیستم، خطاهای تداخل، هم‌پوشانی و شکاف‌های بین لایه‌ها را در چند ثانیه شناسایی و برطرف می‌کند.",
  },
  {
    icon: <Database className="h-6 w-6 text-primary" />,
    title: "کاهش چشمگیر هزینه‌های بازبینی",
    description:
      "با خودکارسازی فرآیند کنترل کیفیت داده‌های مکانی، زمان تحویل پروژه‌های نقشه را به حداقل رسانده و هزینه‌های نیروی انسانی را تا چند برابر کاهش دهید.",
  },
  {
    icon: <Sliders className="h-6 w-6 text-primary" />,
    title: "مدیریت بدون دغدغه فایل‌های سنگین",
    description:
      "بدون نیاز به سیستم‌های سخت‌افزاری گران‌قیمت، لایه‌های مکانی حجیم و نقشه‌های سازمانی خود را به راحتی بارگذاری، فیلتر و گزارش‌گیری کنید.",
  },
  {
    icon: <Layers className="h-6 w-6 text-primary" />,
    title: "میز کار یکپارچه و تعاملی",
    description:
      "ارتباط مستقیم و همزمان بین جدول اطلاعات و نقشه گرافیکی؛ به طوری که هر تغییر در داده‌ها، فوراً وضعیت هندسی لایه‌ها را روی نقشه به‌روزرسانی می‌کند.",
  },
];

function Features() {
  return (
    <section className="relative py-24 bg-background overflow-hidden border-t border-border/50">
      {/* هاله نور پس‌زمینه مبهم */}
      <div className="absolute top-1/2 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        {/* سربرگ بخش قابلیت‌ها */}
        <div className="text-center max-w-2xl mx-auto mb-16 flex flex-col items-center gap-3">
          <h2 className="text-xs font-semibold tracking-wider text-primary uppercase bg-primary/10 px-3 py-1 rounded-full">
            چرا SnapGIS؟
          </h2>
          <p className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
            ابزارهای مهندسی شده برای داده‌های مکانی
          </p>
          <p className="text-muted-foreground text-base sm:text-lg">
            سیستم یکپارچه‌ای که تمام چالش‌های پرفورمنس، سرعت فچ دیتای بزرگ و نمایش لایه‌های لایو
            جی‌آی‌اس را یک‌بار برای همیشه حل کرده است.
          </p>
        </div>

        {/* شبکه کارت‌های قابلیت‌ها */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES_DATA.map((feature, index) => (
            <div
              key={index}
              className="group relative rounded-xl border border-border/60 bg-card/40 p-6 backdrop-blur-sm hover:border-primary/40 hover:bg-card/80 transition-all duration-300 shadow-[0_4px_30px_rgba(0,0,0,0.2)]"
            >
              {/* افکت نئونی زیر کارت در حالت هاور */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-b from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

              {/* آیکون */}
              <div className="mb-4 inline-flex p-3 rounded-lg bg-secondary/80 border border-border group-hover:border-primary/30 group-hover:bg-primary/5 transition-colors">
                {feature.icon}
              </div>

              {/* عنوان و توضیحات */}
              <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed font-light">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Features;
