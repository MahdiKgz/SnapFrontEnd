import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { useLogoutMutation } from "@/features/auth/api/auth-api";
import { logout } from "@/features/auth/model/auth-slice";
import { ThemeToggle } from "@/features/theme/ui/theme-toggle";
import {
  ArrowLeftRight,
  ChartNoAxesCombined,
  Layers,
  LayoutDashboard,
  LogOut,
  Map,
  Tags,
  User,
  Users,
} from "lucide-react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";

const NAVIGATION_SECTIONS = [
  {
    id: "workspace",
    title: "فضای کاری",
    adminOnly: false,
    items: [
      { path: "/dashboard", title: "پیشخوان", icon: LayoutDashboard },
      { path: "/dashboard/files", title: "مدیریت فایل‌ها", icon: Layers },
      { path: "/dashboard/convert", title: "تبدیل فرمت و مختصات", icon: ArrowLeftRight },
      { path: "/map", title: "میز کار نقشه", icon: Map },
    ],
  },
  {
    id: "administration",
    title: "مدیریت سامانه",
    adminOnly: true,
    items: [
      { path: "/dashboard/admin/users", title: "مدیریت کاربران", icon: Users },
      { path: "/dashboard/admin/plans", title: "مدیریت پلن‌ها", icon: Tags },
    ],
  },
  {
    id: "reports",
    title: "گزارش‌های مدیریتی",
    adminOnly: true,
    items: [
      { path: "/dashboard/admin/reports", title: "گزارش‌های سامانه", icon: ChartNoAxesCombined },
    ],
  },
];

export function DashboardLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const isAdmin = user?.roles.includes("admin") ?? false;
  const [revokeSession, { isLoading: isLoggingOut }] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await revokeSession().unwrap();
    } catch {
      // Local sign-out must still complete when the server is unavailable.
    } finally {
      dispatch(logout());
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="w-full h-screen flex items-stretch bg-background text-foreground overflow-hidden">
      {/* سایدبار اختصاصی پنل جی‌آی‌اس */}
      <aside className="w-64 min-h-0 border-l border-sidebar-border bg-sidebar flex flex-col justify-between z-20 shrink-0">
        {/* بخش بالایی سایدبار: لوگو و آیتم‌ها */}
        <div className="flex min-h-0 flex-1 flex-col gap-6 px-4 pt-6 pb-4">
          {/* برندینگ کوچک پنل */}
          <div className="flex shrink-0 items-center gap-2 px-2 font-sans font-bold text-lg tracking-wider text-sidebar-foreground">
            <span className="h-6 w-6 rounded-md bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground text-xs font-black shadow-[0_0_10px_rgba(114,180,145,0.2)]">
              S
            </span>
            <span>
              Snap<span className="text-sidebar-primary">GIS</span>
            </span>
          </div>

          <nav aria-label="منوی داشبورد" className="min-h-0 flex-1 space-y-6 overflow-y-auto">
            {NAVIGATION_SECTIONS.filter((section) => !section.adminOnly || isAdmin).map(
              (section) => (
                <section key={section.id} aria-labelledby={`sidebar-${section.id}`}>
                  <h2
                    id={`sidebar-${section.id}`}
                    className="mb-2 px-4 text-[11px] font-semibold text-sidebar-foreground/50"
                  >
                    {section.title}
                  </h2>
                  <ul className="space-y-1">
                    {section.items.map((item) => (
                      <li key={item.path}>
                        <NavLink
                          to={item.path}
                          end={item.path === "/dashboard"}
                          className={({ isActive }) =>
                            `flex h-10 items-center gap-3 rounded-lg px-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring ${
                              isActive
                                ? "bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-sm"
                                : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                            }`
                          }
                        >
                          <item.icon className="size-4 shrink-0" aria-hidden="true" />
                          <span>{item.title}</span>
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </section>
              ),
            )}
          </nav>
        </div>

        {/* بخش پایینی سایدبار: اطلاعات کاربر و خروج */}
        <div className="shrink-0 p-4 border-t border-sidebar-border bg-sidebar-accent/30 flex flex-col gap-2">
          <ThemeToggle showLabel />
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
            onClick={() => void handleLogout()}
            disabled={isLoggingOut}
            className="flex items-center gap-3 px-4 h-10 w-full rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors text-right"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span className="font-medium">{isLoggingOut ? "در حال خروج..." : "خروج از حساب"}</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 h-full relative bg-background">
        <Outlet />
      </main>
    </div>
  );
}
