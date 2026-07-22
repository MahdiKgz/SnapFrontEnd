import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Building2,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
} from "lucide-react";

function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // فرآیند ارسال پیام
    console.log(formData);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-6 relative overflow-hidden">
      {/* هاله نور نئونی در پس‌زمینه */}
      <div className="absolute top-1/4 -right-20 w-[450px] h-[450px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 -left-20 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto max-w-7xl relative z-10">
        {/* سربرگ صفحه */}
        <div className="flex flex-col gap-3 mb-12 text-right">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium w-fit">
            <MessageSquare className="h-3.5 w-3.5" />
            ارتباط مستقیم با تیم SnapGIS
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground">
            تماس با ما و <span className="text-primary">مشاوره سازمانی</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-2xl font-light">
            سوالات، پیشنهادات یا نیاز به سرویس‌های سفارشی رفع خطای توپولوژی دارید؟ تیم فنی و
            پشتیبانی ما آماده پاسخ‌گویی به شماست.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* بخش سمت راست: فرم ارسال پیام */}
          <div className="lg:col-span-7 rounded-2xl border border-border/60 bg-card/40 p-6 sm:p-10 backdrop-blur-md shadow-lg space-y-6">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-foreground">
                ارسال پیام یا درخواست دموی سازمانی
              </h2>
              <p className="text-xs text-muted-foreground font-light">
                فرم زیر را تکمیل کنید؛ کارشناسان ما در کوتاه‌ترین زمان ممکن با شما تماس خواهند گرفت.
              </p>
            </div>

            {submitted ? (
              <div className="p-8 rounded-xl border border-primary/30 bg-primary/10 flex flex-col items-center text-center gap-4 py-12">
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground">پیام شما با موفقیت دریافت شد</h3>
                <p className="text-xs text-muted-foreground font-light max-w-md leading-relaxed">
                  با تشکر از ارتباط شما. همکاران ما پس از بررسی پیام، حداکثر ظرف ۲۴ ساعت کاری آینده
                  با شما تماس خواهند گرفت.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSubmitted(false)}
                  className="mt-2 text-xs border-border"
                >
                  ارسال پیام جدید
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* نام و نام خانوادگی */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs font-medium text-foreground/80">
                      نام و نام خانوادگی *
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="مثلاً: علی رضایی"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="h-10 text-xs border-border/80 bg-background/50 focus-visible:ring-primary/50"
                      required
                    />
                  </div>

                  {/* شماره تماس */}
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-xs font-medium text-foreground/80">
                      شماره تلفن همراه *
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="09123456789"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="h-10 text-xs border-border/80 bg-background/50 text-left font-sans tracking-widest focus-visible:ring-primary/50"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* ایمیل */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs font-medium text-foreground/80">
                      پست الکترونیکی
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@company.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="h-10 text-xs border-border/80 bg-background/50 text-left font-sans focus-visible:ring-primary/50"
                    />
                  </div>

                  {/* موضوع */}
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-xs font-medium text-foreground/80">
                      موضوع درخواست *
                    </Label>
                    <Input
                      id="subject"
                      type="text"
                      placeholder="مثلاً: درخواست خرید لایسنس سازمانی"
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="h-10 text-xs border-border/80 bg-background/50 focus-visible:ring-primary/50"
                      required
                    />
                  </div>
                </div>

                {/* متن پیام */}
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-xs font-medium text-foreground/80">
                    متن پیام *
                  </Label>
                  <textarea
                    id="message"
                    rows={5}
                    placeholder="شرح درخواست یا سوال خود را اینجا بنویسید..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full rounded-md border border-border/80 bg-background/50 p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    required
                  />
                </div>

                {/* دکمه ارسال */}
                <Button
                  type="submit"
                  className="w-full h-11 text-sm font-semibold gap-2 shadow-[0_0_20px_rgba(114,180,145,0.15)] hover:shadow-[0_0_25px_rgba(114,180,145,0.3)] transition-all"
                >
                  <Send className="h-4 w-4" />
                  ارسال پیام
                </Button>
              </form>
            )}
          </div>

          {/* بخش سمت چپ: کارت‌های اطلاعات تماس و دفتر مرکزی */}
          <div className="lg:col-span-5 space-y-6">
            {/* کارت‌های راه ارتباطی */}
            <div className="grid grid-cols-1 gap-4">
              <div className="rounded-xl border border-border/60 bg-card/30 p-5 backdrop-blur-md flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground">شماره تماس پشتیبانی</h3>
                  <p className="text-sm font-semibold text-foreground font-sans mt-0.5" dir="ltr">
                    +98 (21) 8888-0000
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-border/60 bg-card/30 p-5 backdrop-blur-md flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground">پست الکترونیکی</h3>
                  <p className="text-sm font-semibold text-foreground font-sans mt-0.5" dir="ltr">
                    support@snapgis.com
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-border/60 bg-card/30 p-5 backdrop-blur-md flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground">ساعات کاری</h3>
                  <p className="text-sm font-semibold text-foreground mt-0.5">
                    شنبه تا چهارشنبه - ۰۹:۰۰ الی ۱۷:۰۰
                  </p>
                </div>
              </div>
            </div>

            {/* کارت آدرس و موقعیت مکانی */}
            <div className="rounded-2xl border border-border/60 bg-card/30 p-6 backdrop-blur-md space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <Building2 className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">دفتر مرکزی و مرکز نوآوری</h3>
                  <p className="text-xs text-muted-foreground font-light">
                    تهران، خیابان آزادی، مرکز فناوری‌های مکانی
                  </p>
                </div>
              </div>

              {/* پریویوی نمایشی موقعیت دفتر روی نقشه */}
              <div className="h-40 w-full rounded-xl border border-border/40 overflow-hidden relative bg-neutral-900/50 flex items-center justify-center group">
                <div className="absolute inset-0 bg-[radial-gradient(#1f2937_1px,transparent_1px)] bg-[size:1rem_1rem] opacity-40" />
                <div className="relative z-10 flex flex-col items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-[0_0_15px_rgba(114,180,145,0.6)] animate-pulse">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] font-bold text-foreground bg-background/80 px-2.5 py-1 rounded-md border border-border/40 backdrop-blur-sm">
                    موقعیت دفتر SnapGIS
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactPage;
