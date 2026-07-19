import React from "react";

import { FileText, Globe, Mail, Phone, Shield } from "lucide-react";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-background border-t border-border/40 overflow-hidden">
      {/* هاله نور بسیار محو در گوشه فوتر */}
      <div className="absolute bottom-0 right-0 w-62.5 h-62.5 bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-6 py-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* ستون اول: معرفی کوتاه */}
          <div className="flex flex-col items-start gap-4">
            <div className="flex items-center gap-2 font-sans font-bold text-lg tracking-wider text-foreground">
              <span className="h-6 w-6 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-sm shadow-[0_0_15px_rgba(var(--primary),0.5)]">
                S
              </span>
              <span>
                Snap<span className="text-primary">GIS</span>
              </span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed font-light">
              سامانه هوشمند و یکپارچه مدیریت لایه‌ها و رفع خطاهای توپولوژی در داده‌های مکانی بیزینسی
              و سازمانی.
            </p>
          </div>

          {/* ستون دوم: دسترسی سریع */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-bold text-foreground">دسترسی سریع</h4>
            <ul className="flex flex-col gap-2 text-sm font-light text-muted-foreground">
              <li>
                <a href="#features" className="hover:text-primary transition-colors">
                  قابلیت‌های سامانه
                </a>
              </li>
              <li>
                <a href="#workflow" className="hover:text-primary transition-colors">
                  روال اجرای کار
                </a>
              </li>
              <li>
                <a href="/docs" className="hover:text-primary transition-colors">
                  مستندات فنی
                </a>
              </li>
            </ul>
          </div>

          {/* ستون سوم: حقوقی و قوانین */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-bold text-foreground">قوانین و مستندات</h4>
            <ul className="flex flex-col gap-2 text-sm font-light text-muted-foreground">
              <li className="flex items-center gap-2">
                <Shield className="h-4 w-4" /> حریم خصوصی کاربران
              </li>
              <li className="flex items-center gap-2">
                <FileText className="h-4 w-4" /> شرایط و ضوابط استفاده
              </li>
              <li className="flex items-center gap-2">
                <Globe className="h-4 w-4" /> توافق‌نامه سطح خدمات (SLA)
              </li>
            </ul>
          </div>

          {/* ستون چهارم: ارتباطات */}
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-bold text-foreground">پشتیبانی و ارتباط</h4>
            <ul className="flex flex-col gap-2 text-sm font-light text-muted-foreground">
              <li className="flex items-center gap-2" dir="ltr">
                <Mail className="h-4 w-4" /> support@snapgis.com
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4" /> مرکز تماس سازمانی
              </li>
            </ul>
          </div>
        </div>

        {/* خط پایینی کپی‌رایت */}
        <div className="pt-8 border-t border-border/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-light text-muted-foreground">
          <p>© {currentYear} سامانه SnapGIS. تمامی حقوق مادی و معنوی محفوظ است.</p>
          <p className="font-sans">Designed for Enterprise Geospatial Data</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
