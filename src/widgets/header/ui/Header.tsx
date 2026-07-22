import React from "react";

import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Link } from "react-router-dom";

function Header() {
  return (
    <header className="fixed top-0 inset-x-0 h-16 z-50 border-b border-border bg-background/70 backdrop-blur-md transition-all">
      <div className="container mx-auto h-full flex items-center justify-between px-6">
        {/* سمت راست: لوگو و ناوبری اصلی */}
        <div className="flex items-center gap-8">
          {/* لوگوی سیستم */}
          <Link
            to="/"
            className="flex items-center gap-2 font-sans font-bold text-lg tracking-wider text-foreground"
          >
            <span className="h-6 w-6 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-sm shadow-[0_0_15px_rgba(var(--primary),0.5)]">
              S
            </span>
            <span>
              Snap<span className="text-primary">GIS</span>
            </span>
          </Link>

          {/* منوی ناوبری شدسی‌ان */}
          <NavigationMenu dir="rtl">
            <NavigationMenuList className="gap-1">
              {/* صفحه اصلی */}
              <NavigationMenuItem>
                <NavigationMenuLink
                  className={`${navigationMenuTriggerStyle()} bg-transparent hover:bg-accent/50 text-muted-foreground hover:text-foreground`}
                >
                  <Link to="/">صفحه اصلی</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              {/* منوی دراپ‌داون خدمات و قابلیت‌ها */}
              <NavigationMenuItem>
                <NavigationMenuTrigger
                  className={`${navigationMenuTriggerStyle()} bg-transparent hover:bg-accent/50 text-muted-foreground hover:text-foreground data-[state=open]:text-foreground`}
                >
                  قابلیت‌ها
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-[220px] p-2 bg-card border border-border rounded-lg shadow-xl flex flex-col gap-1">
                    <NavigationMenuLink className="block p-2 text-xs rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                      <Link to="/#features">موتور رفع خطای توپولوژی</Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink className="block p-2 text-xs rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                      <Link to="/#workflow">مدیریت و اصلاح لایه‌ها</Link>
                    </NavigationMenuLink>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* وبلاگ */}
              <NavigationMenuItem>
                <NavigationMenuLink
                  className={`${navigationMenuTriggerStyle()} bg-transparent hover:bg-accent/50 text-muted-foreground hover:text-foreground`}
                >
                  <Link to="/blog">مقالات</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              {/* تعرفه‌ها */}
              <NavigationMenuItem>
                <NavigationMenuLink
                  className={`${navigationMenuTriggerStyle()} bg-transparent hover:bg-accent/50 text-muted-foreground hover:text-foreground`}
                >
                  <Link to="/pricing">تعرفه‌ها</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              {/* ارتباط با ما */}
              <NavigationMenuItem>
                <NavigationMenuLink
                  className={`${navigationMenuTriggerStyle()} bg-transparent hover:bg-accent/50 text-muted-foreground hover:text-foreground`}
                >
                  <Link to="/contact-us">ارتباط با ما</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* سمت چپ: دکمه‌های ورود و اکشن */}
        <div className="flex items-center gap-3">
          <Link to="/auth/login">
            <Button
              variant="ghost"
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              ورود به پنل
            </Button>
          </Link>

          <Link to="/dashboard">
            <Button className="text-xs font-medium shadow-[0_0_20px_rgba(114,180,145,0.15)] hover:shadow-[0_0_25px_rgba(114,180,145,0.3)] transition-all">
              ورود به میز کار
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

export default Header;
