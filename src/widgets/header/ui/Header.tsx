import { useEffect, useRef, useState } from "react";

import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { useLogoutMutation } from "@/features/auth/api/auth-api";
import { logout } from "@/features/auth/model/auth-slice";
import { ChevronDown, LayoutDashboard, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { Link } from "react-router-dom";

function Header() {
  const dispatch = useAppDispatch();
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [revokeSession, { isLoading: isLoggingOut }] = useLogoutMutation();
  const { status, user } = useAppSelector((state) => state.auth);
  const isAuthenticated = status === "authenticated" && user !== null;

  useEffect(() => {
    if (!isAccountMenuOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsAccountMenuOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isAccountMenuOpen]);

  const handleLogout = async () => {
    try {
      await revokeSession().unwrap();
    } catch {
      // Local logout must still work if the API is temporarily unavailable.
    } finally {
      setIsAccountMenuOpen(false);
      dispatch(logout());
    }
  };

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

        {/* سمت چپ: ورود یا منوی حساب کاربری */}
        {isAuthenticated ? (
          <div ref={accountMenuRef} className="relative">
            <Button
              type="button"
              variant="outline"
              className="h-10 gap-2 rounded-xl border-primary/20 bg-primary/5 px-2.5 shadow-sm hover:bg-primary/10 sm:px-3"
              aria-haspopup="menu"
              aria-expanded={isAccountMenuOpen}
              aria-controls="landing-account-menu"
              onClick={() => setIsAccountMenuOpen((isOpen) => !isOpen)}
            >
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <UserRound className="size-4" />
              </span>
              <span className="hidden max-w-32 truncate text-xs font-semibold sm:block">
                {user.name}
              </span>
              <ChevronDown
                className={`size-3.5 text-muted-foreground transition-transform duration-200 ${
                  isAccountMenuOpen ? "rotate-180" : ""
                }`}
              />
            </Button>

            {isAccountMenuOpen && (
              <div
                id="landing-account-menu"
                role="menu"
                aria-label="حساب کاربری"
                className="absolute top-[calc(100%+0.6rem)] left-0 z-50 w-72 origin-top-left animate-in rounded-2xl border border-border bg-popover p-2 text-popover-foreground shadow-xl fade-in-0 zoom-in-95 slide-in-from-top-2 duration-200 motion-reduce:animate-none"
              >
                <div className="rounded-xl bg-muted/50 p-3">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <UserRound className="size-5" />
                    </span>
                    <span className="min-w-0">
                      <strong className="block truncate text-sm">{user.name}</strong>
                      <span className="mt-0.5 block text-xs text-muted-foreground" dir="ltr">
                        {user.phone}
                      </span>
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-1.5 border-t border-border/60 pt-2.5 text-[11px] text-muted-foreground">
                    <ShieldCheck className="size-3.5 text-primary" />
                    {user.roles.includes("admin") ? "مدیر سیستم" : "کاربر تأییدشده"}
                  </div>
                </div>

                <div className="mt-2 grid gap-1">
                  <Link
                    to="/dashboard"
                    role="menuitem"
                    onClick={() => setIsAccountMenuOpen(false)}
                    className={buttonVariants({
                      variant: "ghost",
                      className: "h-10 w-full justify-start gap-2 px-3 text-xs",
                    })}
                  >
                    <LayoutDashboard />
                    ورود به داشبورد
                  </Link>
                  <Button
                    type="button"
                    role="menuitem"
                    variant="destructive"
                    className="h-10 w-full justify-start gap-2 px-3 text-xs"
                    disabled={isLoggingOut}
                    onClick={() => void handleLogout()}
                  >
                    <LogOut />
                    {isLoggingOut ? "در حال خروج..." : "خروج از حساب"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : status === "checking" ? (
          <span
            className="h-10 w-28 animate-pulse rounded-xl bg-muted"
            aria-label="در حال بررسی حساب"
          />
        ) : (
          <Link
            to="/login"
            className={buttonVariants({
              className:
                "h-10 px-4 text-xs shadow-[0_0_20px_rgba(114,180,145,0.15)] transition-all hover:shadow-[0_0_25px_rgba(114,180,145,0.3)]",
            })}
          >
            ورود یا ثبت‌نام
          </Link>
        )}
      </div>
    </header>
  );
}

export default Header;
