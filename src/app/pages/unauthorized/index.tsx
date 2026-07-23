import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowRight, Home, LockKeyhole, ShieldX } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

function UnauthorizedPage() {
  const location = useLocation();

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-background px-6 py-12 text-foreground">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-30" />
      <div className="absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[110px]" />

      <main className="relative z-10 w-full max-w-lg rounded-2xl border border-border/60 bg-card/90 p-7 text-center shadow-2xl shadow-primary/5 backdrop-blur sm:p-10">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-destructive/20 bg-destructive/10 text-destructive">
          <ShieldX className="h-8 w-8" />
        </div>

        <div className="mb-3 flex items-center justify-center gap-2 text-xs font-semibold tracking-widest text-primary">
          <LockKeyhole className="h-3.5 w-3.5" />
          <span>دسترسی محافظت‌شده</span>
        </div>

        <h1 className="text-2xl font-black tracking-tight sm:text-3xl">
          شما اجازه مشاهده این صفحه را ندارید
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-7 text-muted-foreground">
          میز کار SnapGIS فقط برای کاربران واردشده در دسترس است. برای ادامه، وارد حساب کاربری خود
          شوید.
        </p>

        <div className="mt-8 flex flex-col-reverse justify-center gap-3 sm:flex-row">
          <Link to="/" className={cn(buttonVariants({ variant: "outline" }), "h-10 gap-2 px-5")}>
            <Home className="h-4 w-4" />
            بازگشت به خانه
          </Link>
          <Link
            to="/auth/login"
            state={{ from: location.pathname }}
            className={cn(buttonVariants(), "h-10 gap-2 px-5")}
          >
            ورود به حساب
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 border-t border-border/50 pt-5">
          <Button variant="ghost" size="sm" disabled className="text-xs text-muted-foreground">
            کد وضعیت: ۴۰۳
          </Button>
        </div>
      </main>
    </div>
  );
}

export default UnauthorizedPage;
