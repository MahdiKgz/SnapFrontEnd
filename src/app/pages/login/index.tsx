// src/pages/auth/LoginPage.tsx
import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, ShieldCheck, Smartphone } from "lucide-react";
import { Link } from "react-router-dom";

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // فرآیند ارسال دیتای لاگین به سرور
    console.log({ phone, password });
  };

  return (
    <div className="w-full min-h-screen flex items-stretch">
      {/* سمت راست: فرم ورود */}
      <div className="w-full lg:w-[30%] flex flex-col justify-center px-6 sm:px-16 lg:px-20 py-12 bg-background relative z-10">
        {/* لوگو و نام پلتفرم */}
        <div className="mb-10 flex items-center gap-2 font-sans font-bold text-xl tracking-wider text-foreground">
          <span className="h-7 w-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-sm shadow-[0_0_15px_rgba(114,180,145,0.4)]">
            S
          </span>
          <span>
            Snap<span className="text-primary">GIS</span>
          </span>
        </div>

        {/* تیتر ورود */}
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-2xl font-black tracking-tight text-foreground">ورود به میز کار</h1>
          <p className="text-muted-foreground text-sm font-light">
            جهت دسترسی به پنل مدیریت لایه‌ها و موتور رفع خطای توپولوژی، وارد حساب خود شوید.
          </p>
        </div>

        {/* خودِ فرم لاگین */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* فیلد شماره تلفن */}
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium text-foreground/80">
              شماره تلفن همراه
            </Label>
            <div className="relative">
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground/60">
                <Smartphone className="h-4 w-4" />
              </span>
              <Input
                id="phone"
                type="tel"
                placeholder="09123456789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pr-10 pl-3 text-left font-sans h-11 tracking-widest border-border/80 bg-card/40 focus-visible:ring-primary/50"
                required
              />
            </div>
          </div>

          {/* flex فیلد رمز عبور */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium text-foreground/80">
                رمز عبور
              </Label>
              <Link to="/auth/forgot" className="text-xs text-primary hover:underline font-light">
                رمز عبور را فراموش کرده‌اید؟
              </Link>
            </div>
            <div className="relative">
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground/60">
                <Lock className="h-4 w-4" />
              </span>
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10 pl-10 h-11 tracking-widest border-border/80 bg-card/40 focus-visible:ring-primary/50"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground/60 hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* دکمه ثبت فرم */}
          <Button
            type="submit"
            className="w-full h-11 text-base font-semibold mt-2 shadow-[0_0_20px_rgba(114,180,145,0.15)] hover:shadow-[0_0_25px_rgba(114,180,145,0.3)] transition-all"
          >
            ورود به حساب کاربری
          </Button>
        </form>

        {/* هدایت به ثبت‌نام */}
        <p className="mt-8 text-sm text-center text-muted-foreground font-light">
          حساب کاربری ندارید؟{" "}
          <Link to="/auth/register" className="text-primary font-medium hover:underline">
            ایجاد حساب کاربری جدید
          </Link>
        </p>
      </div>

      {/* سمت چپ: آرت‌ورک هندسی بیزینسی (مخصوص دسکتاپ) */}
      <div className="hidden lg:flex flex-1 relative bg-neutral-950 items-center justify-center p-12 overflow-hidden border-r border-border/40">
        {/* گرید لاین‌ها و نورهای پس‌زمینه */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f2937_1px,transparent_1px),linear-gradient(to_bottom,#1f2937_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px]" />

        <div className="relative z-10 max-w-md text-right flex flex-col gap-4">
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 self-start text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h3 className="text-2xl font-bold text-neutral-100">امنیت و سرعت در پردازش لایه‌ها</h3>
          <p className="text-sm text-neutral-400 leading-relaxed font-light">
            دسترسی به قدرتمندترین الگوریتم‌های هندسی و موتورهای توپولوژیکی در بستر زیرساخت ابری
            اختصاصی و امن پروژه‌های شما.
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
