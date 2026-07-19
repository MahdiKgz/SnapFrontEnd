import React from "react";

import { Button } from "@/components/ui/button";

function Hero() {
  return (
    <section className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-background pt-16">
      {/* بک‌گراند انیمیشنی لایه‌ای (Grid Line Pattern & Neon Glow) */}
      <div className="absolute inset-0 z-0">
        {/* لایه اول: شبکه گرید خطی جی‌آی‌اس */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 animate-[pulse_4s_cubic-bezier(0.4,0,0.6,1)_infinite]" />

        {/* لایه دوم: درخشش‌های داینامیک نئونی اوربیتال در پشت متن */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-[ping_10s_cubic-bezier(0,0,0.2,1)_infinite]" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[80px] pointer-events-none animate-[pulse_6s_ease-in-out_infinite]" />
      </div>

      {/* محتوای متنی و معرفی پروژه */}
      <div className="container relative z-10 mx-auto px-6 text-center max-w-4xl flex flex-col items-center gap-6">
        {/* نشان کوچک بالای هیرو */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-medium backdrop-blur-sm shadow-[0_0_15px_rgba(114,180,145,0.1)]">
          <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
          نسل جدید دستیارهای اطلاعات مکانی (GIS)
        </div>

        {/* تیتر اصلی با فونت ضخیم و متمایز */}
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-foreground leading-[1.3] max-w-3xl">
          تحلیل و پردازش داده‌های مکانی،
          <span className="block mt-2 bg-gradient-to-r from-primary via-emerald-400 to-teal-500 bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(114,180,145,0.2)]">
            سریع‌تر و هوشمندتر از همیشه
          </span>
        </h1>

        {/* توضیحات پروژه */}
        <p className="text-muted-foreground text-lg sm:text-xl max-w-2xl leading-relaxed font-normal">
          سامانه <span className="text-foreground font-semibold">SnapGIS</span> به متخصصین جی‌آی‌اس
          کمک می‌کند تا بدون دغدغه‌های زیرساختی، فایل‌های مکانی سنگین خود را آپدیت، فیلتر و با
          پرفورمنس فوق‌العاده بر روی نقشه‌های تعاملی مدیریت کنند.
        </p>

        {/* دکمه‌های فراخوان (CTA) */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-4 w-full sm:w-auto">
          <Button
            size="lg"
            className="w-full sm:w-auto text-base px-8 h-12 shadow-[0_0_25px_rgba(114,180,145,0.2)] hover:shadow-[0_0_35px_rgba(114,180,145,0.4)] transition-all"
          >
            ورود به میز کار
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full sm:w-auto text-base px-8 h-12 bg-transparent border-border hover:bg-accent/50 text-foreground"
          >
            مستندات فنی ابزار
          </Button>
        </div>
      </div>
    </section>
  );
}

export default Hero;
