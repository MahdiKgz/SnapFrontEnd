import React from "react";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Sparkles } from "lucide-react";

function CTA() {
  return (
    <section className="relative py-24 bg-background overflow-hidden border-t border-border/40">
      {/* پترن نقطه‌چین هندسی پس‌زمینه */}
      <div className="absolute inset-0 bg-[radial-gradient(#1f2937_1px,transparent_1px)] bg-[size:2rem_2rem] opacity-30 pointer-events-none" />

      {/* هاله نور نئونی در پس‌زمینه */}
      <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-[500px] h-[400px] bg-primary/10 rounded-full blur-[130px] pointer-events-none" />

      {/* تغییر اصلی: کانتینر حالا محدودیت مکس‌ویدث اختصاصی ندارد و با کل کانتینر پروژه هم‌عرض است */}
      <div className="container mx-auto px-6 relative z-10 w-full">
        <div className="relative rounded-2xl border border-border/60 bg-card/30 p-8 sm:p-12 backdrop-blur-md flex flex-col lg:flex-row items-center justify-between gap-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] w-full">
          {/* خط نئونی عمودی در لبه راست کارت */}
          <div className="absolute right-0 inset-y-0 w-[2px] bg-gradient-to-b from-transparent via-primary/50 to-transparent" />

          {/* سمت راست: محتوای بیزینسی */}
          <div className="flex flex-col items-start text-right gap-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium">
              <Sparkles className="h-3.5 w-3.5" />
              شروع سریع بدون نیاز به پیکربندی
            </div>

            <h2 className="text-3xl sm:text-5xl font-black text-foreground tracking-tight leading-[1.25]">
              کنترل کیفیت و پاک‌سازی داده‌های مکانی،
              <span className="text-primary block mt-1">فقط با چند کلیک.</span>
            </h2>

            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed font-light mt-2">
              به فرآیند سنتی و زمان‌بر بازبینی دستی پایان دهید. همین حالا با بارگذاری اولین لایه،
              سرعت و دقت موتور هوشمند رفع خطای توپولوژی را روی میز کار خود تجربه کنید.
            </p>
          </div>

          {/* سمت چپ: باکس دکمه‌های اکشن */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch gap-3 w-full lg:w-auto min-w-[280px]">
            <Button
              size="lg"
              className="w-full text-base px-8 h-12 shadow-[0_0_20px_rgba(114,180,145,0.15)] hover:shadow-[0_0_30px_rgba(114,180,145,0.4)] group/btn transition-all duration-300"
            >
              ثبت‌نام و آپلود اولین لایه
              <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover/btn:-translate-x-1" />
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="w-full text-base px-8 h-12 bg-transparent border-border hover:bg-accent/40 text-foreground"
            >
              درخواست دمو سازمانی
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CTA;
