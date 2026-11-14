import { Suspense, lazy } from "react";
import type { ReactNode } from "react";

import { Navigate, Outlet, createBrowserRouter } from "react-router-dom";

import { AuthLayout } from "@widgets/auth-layout";
import { DashboardLayout } from "@widgets/dashboard-layout";
import { PublicLayout } from "@widgets/public-layout";

import { ProtectedRoute, PublicOnlyRoute } from "@features/auth";

const AccountSecurityPage = lazy(() =>
  import("@pages/account-security").then(({ AccountSecurityPage }) => ({
    default: AccountSecurityPage,
  })),
);
const AdminPlansPage = lazy(() =>
  import("@pages/admin-plans").then(({ AdminPlansPage }) => ({ default: AdminPlansPage })),
);
const AdminReportsPage = lazy(() =>
  import("@pages/admin-reports").then(({ AdminReportsPage }) => ({ default: AdminReportsPage })),
);
const AdminUsersPage = lazy(() =>
  import("@pages/admin-users").then(({ AdminUsersPage }) => ({ default: AdminUsersPage })),
);
const ArticlePage = lazy(() =>
  import("@pages/article").then(({ ArticlePage }) => ({ default: ArticlePage })),
);
const BlogPage = lazy(() => import("@pages/blog").then(({ BlogPage }) => ({ default: BlogPage })));
const CompanyPage = lazy(() =>
  import("@pages/company").then(({ CompanyPage }) => ({ default: CompanyPage })),
);
const ContactPage = lazy(() =>
  import("@pages/contact").then(({ ContactPage }) => ({ default: ContactPage })),
);
const ConversionPage = lazy(() =>
  import("@pages/conversion").then(({ ConversionPage }) => ({ default: ConversionPage })),
);
const DashboardFilesPage = lazy(() =>
  import("@pages/dashboard-files").then(({ DashboardFilesPage }) => ({
    default: DashboardFilesPage,
  })),
);
const DashboardOverviewPage = lazy(() =>
  import("@pages/dashboard-overview").then(({ DashboardOverviewPage }) => ({
    default: DashboardOverviewPage,
  })),
);
const HomePage = lazy(() => import("@pages/home").then(({ HomePage }) => ({ default: HomePage })));
const LoginPage = lazy(() =>
  import("@pages/login").then(({ LoginPage }) => ({ default: LoginPage })),
);
const MapPage = lazy(() => import("@pages/map").then(({ MapPage }) => ({ default: MapPage })));
const ForgotPasswordPage = lazy(() =>
  import("@pages/password-recovery").then(({ ForgotPasswordPage }) => ({
    default: ForgotPasswordPage,
  })),
);
const ResetPasswordPage = lazy(() =>
  import("@pages/password-recovery").then(({ ResetPasswordPage }) => ({
    default: ResetPasswordPage,
  })),
);
const PricingPage = lazy(() =>
  import("@pages/pricing").then(({ PricingPage }) => ({ default: PricingPage })),
);
const RegisterPage = lazy(() =>
  import("@pages/register").then(({ RegisterPage }) => ({ default: RegisterPage })),
);
const WriterArticlesPage = lazy(() =>
  import("@pages/writer-articles").then(({ WriterArticlesPage }) => ({
    default: WriterArticlesPage,
  })),
);

function RouteLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-48 w-full items-center justify-center text-sm text-muted-foreground"
    >
      در حال بارگذاری صفحه…
    </div>
  );
}

const loadPage = (page: ReactNode) => <Suspense fallback={<RouteLoading />}>{page}</Suspense>;

export const appRouter = createBrowserRouter([
  {
    path: "/map",
    element: loadPage(
      <ProtectedRoute>
        <MapPage />
      </ProtectedRoute>,
    ),
  },

  {
    element: <PublicLayout />,
    children: [
      {
        path: "/",
        element: loadPage(<HomePage />),
      },
      {
        path: "blog",
        element: loadPage(<BlogPage />),
      },
      { path: "blog/:slug", element: loadPage(<ArticlePage />) },
      {
        path: "contact-us",
        element: loadPage(<ContactPage />),
      },
      {
        path: "pricing",
        element: loadPage(<PricingPage />),
      },
    ],
  },

  {
    element: (
      <PublicOnlyRoute>
        <AuthLayout />
      </PublicOnlyRoute>
    ),
    children: [
      {
        path: "/login",
        element: loadPage(<LoginPage />),
      },
      { path: "/auth/forgot", element: loadPage(<ForgotPasswordPage />) },
      {
        path: "/register",
        element: loadPage(<RegisterPage />),
      },
    ],
  },

  {
    element: <AuthLayout />,
    children: [{ path: "/auth/reset", element: loadPage(<ResetPasswordPage />) }],
  },

  {
    path: "/auth",
    children: [
      { index: true, element: <Navigate to="/login" replace /> },
      { path: "login", element: <Navigate to="/login" replace /> },
      { path: "register", element: <Navigate to="/register" replace /> },
    ],
  },

  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: loadPage(<DashboardOverviewPage />),
      },
      {
        path: "overview",
        element: loadPage(<DashboardOverviewPage />),
      },
      {
        path: "files",
        element: loadPage(<DashboardFilesPage />),
      },
      { path: "company", element: loadPage(<CompanyPage />) },
      { path: "security", element: loadPage(<AccountSecurityPage />) },
      {
        path: "convert",
        element: loadPage(<ConversionPage />),
      },
      {
        path: "articles",
        element: loadPage(
          <ProtectedRoute requiredRole="writer">
            <WriterArticlesPage />
          </ProtectedRoute>,
        ),
      },
      {
        path: "admin",
        element: (
          <ProtectedRoute requiredRole="admin">
            <Outlet />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <Navigate to="users" replace /> },
          { path: "users", element: loadPage(<AdminUsersPage />) },
          { path: "plans", element: loadPage(<AdminPlansPage />) },
          { path: "reports", element: loadPage(<AdminReportsPage />) },
        ],
      },
      {
        path: "map",
        element: loadPage(<MapPage />),
      },
    ],
  },

  {
    path: "*",
    element: <div>صفحه پیدا نشد (404)</div>,
  },
]);
