import React from "react";

import { Button } from "@/components/ui/button";
// یا هر کامپوننت ناوبری که استفاده می‌کنی
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
          <div className="flex items-center gap-2 font-sans font-bold text-lg tracking-wider text-foreground">
            <span className="h-6 w-6 rounded-md bg-primary flex items-center justify-center text-primary-foreground text-sm shadow-[0_0_15px_rgba(var(--primary),0.5)]">
              S
            </span>
            <span>
              Snap<span className="text-primary">GIS</span>
            </span>
          </div>

          {/* منوی ناوبری شدسی‌ان */}
          <NavigationMenu>
            <NavigationMenuList className="gap-1">
              <NavigationMenuItem>
                <NavigationMenuTrigger
                  className={`${navigationMenuTriggerStyle()} bg-transparent hover:bg-accent/50 text-muted-foreground hover:text-foreground data-[state=open]:text-foreground`}
                >
                  دسته‌بندی‌ها
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <div className="w-[200px] p-2 bg-card border border-border rounded-lg shadow-xl">
                    <NavigationMenuLink
                      href="/category/gis"
                      className="block p-2 text-sm rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                    >
                      سیستم‌های اطلاعاتی مکانی
                    </NavigationMenuLink>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger
                  className={`${navigationMenuTriggerStyle()} bg-transparent hover:bg-accent/50 text-muted-foreground hover:text-foreground`}
                >
                  مقالات
                </NavigationMenuTrigger>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuLink
                  href="/contact"
                  className={`${navigationMenuTriggerStyle()} bg-transparent hover:bg-accent/50 text-muted-foreground hover:text-foreground`}
                >
                  ارتباط با ما
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* سمت چپ: دکمه‌های ورود و اکشن */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            ورود به پنل
          </Button>
          <Button className="text-sm font-medium shadow-[0_0_20px_rgba(114,180,145,0.15)] hover:shadow-[0_0_25px_rgba(114,180,145,0.3)] transition-all">
            شروع رایگان
          </Button>
        </div>
      </div>
    </header>
  );
}

export default Header;
