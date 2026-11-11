import type { ReactNode } from "react";

import { ShieldCheck } from "lucide-react";

import { ThemeToggle } from "@features/theme";

interface AuthFormLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function AuthFormLayout({ title, description, children }: AuthFormLayoutProps) {
  return (
    <div className="w-full min-h-screen flex items-stretch">
      <div className="w-full lg:w-[30%] flex flex-col justify-center px-6 sm:px-16 lg:px-10 xl:px-16 2xl:px-20 py-12 bg-background relative z-10">
        <div className="mb-10 flex items-center gap-2 font-sans font-bold text-xl tracking-wider text-foreground">
          <span className="h-7 w-7 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-sm shadow-[0_0_15px_rgba(114,180,145,0.4)]">
            S
          </span>
          <span>
            Snap<span className="text-primary">GIS</span>
          </span>
          <ThemeToggle className="mr-auto" />
        </div>

        <div className="mb-8 flex flex-col gap-2">
          <h1 className="text-2xl font-black tracking-tight text-foreground">{title}</h1>
          <p className="text-sm font-light text-muted-foreground">{description}</p>
        </div>
        {children}
      </div>

      <div className="hidden lg:flex flex-1 relative bg-muted/40 dark:bg-card items-center justify-center p-12 overflow-hidden border-r border-border/40">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] bg-[size:3rem_3rem]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px]" />

        <div className="relative z-10 max-w-md text-right flex flex-col gap-4">
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 self-start text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h3 className="text-2xl font-bold text-foreground">امنیت و سرعت در پردازش لایه‌ها</h3>
          <p className="text-sm text-muted-foreground leading-relaxed font-light">
            دسترسی به قدرتمندترین الگوریتم‌های هندسی و موتورهای توپولوژیکی در بستر زیرساخت ابری
            اختصاصی و امن پروژه‌های شما.
          </p>
        </div>
      </div>
    </div>
  );
}
