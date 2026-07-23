import React from "react";

import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { authApi } from "@/features/auth/api/auth-api";
import { logout } from "@/features/auth/model/auth-slice";
import { Layers, LogOut, Map, Settings, ShieldAlert, User } from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

const NAVIGATION_ITEMS = [
  { path: "/dashboard/map", title: "میز کار نقشه", icon: <Map className="h-4 w-4" /> },
  { path: "/dashboard/layers", title: "مدیریت لایه‌ها", icon: <Layers className="h-4 w-4" /> },
  { path: "/dashboard/errors", title: "گزارش‌های خطا", icon: <ShieldAlert className="h-4 w-4" /> },
  { path: "/dashboard/settings", title: "تنظیمات سیستم", icon: <Settings className="h-4 w-4" /> },
];

export function DashboardLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(authApi.util.resetApiState());
    navigate("/auth/login", { replace: true });
  };

  return (
    <div className="w-full h-screen flex items-stretch bg-background text-foreground overflow-hidden">
      {/* سایدبار اختصاصی پنل جی‌آی‌اس */}
      <aside className="w-64 border-l border-sidebar-border bg-sidebar flex flex-col justify-between z-20 shrink-0">
        {/* بخش بالایی سایدبار: لوگو و آیتم‌ها */}
        <div className="flex flex-col gap-8 p-6">
          {/* برندینگ کوچک پنل */}
          <div className="flex items-center gap-2 font-sans font-bold text-lg tracking-wider text-sidebar-foreground">
            <span className="h-6 w-6 rounded-md bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground text-xs font-black shadow-[0_0_10px_rgba(114,180,145,0.2)]">
              S
            </span>
            <span>
              Snap<span className="text-sidebar-primary">GIS</span>
            </span>
          </div>

          {/* منوی ناوبری */}
          <nav className="flex flex-col gap-1">
            {NAVIGATION_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 h-10 rounded-lg text-sm transition-all duration-200 group
                  ${
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-[0_4px_12px_rgba(114,180,145,0.15)]"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                  }
                `}
              >
                <span className="shrink-0">{item.icon}</span>
                <span>{item.title}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* بخش پایینی سایدبار: اطلاعات کاربر و خروج */}
        <div className="p-4 border-t border-sidebar-border bg-sidebar-accent/30 flex flex-col gap-2">
          <div className="flex items-center gap-3 px-4 py-2 text-sidebar-foreground">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sidebar-primary/10 text-sidebar-primary">
              <User className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xs font-semibold">
                {user?.name ?? "کاربر SnapGIS"}
              </span>
              <span className="block truncate text-[11px] text-sidebar-foreground/60" dir="ltr">
                {user?.phone}
              </span>
            </span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 h-10 w-full rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors text-right"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className="font-medium">خروج از حساب</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 h-full relative bg-background">
        <Outlet />
      </main>
    </div>
  );
}
