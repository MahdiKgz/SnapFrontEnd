import { ProtectedRoute, PublicOnlyRoute } from "@features/auth";
import { AdminPlansPage } from "@pages/admin-plans";
import { ArticlePage } from "@pages/article";
import { BlogPage } from "@pages/blog";
import { CompanyPage } from "@pages/company";
import { ContactPage } from "@pages/contact";
import { ConversionPage } from "@pages/conversion";
import { DashboardFilesPage } from "@pages/dashboard-files";
import { DashboardOverviewPage } from "@pages/dashboard-overview";
import { HomePage } from "@pages/home";
import { LoginPage } from "@pages/login";
import { ManagementPlaceholder } from "@pages/management-placeholder";
import { MapPage } from "@pages/map";
import { PricingPage } from "@pages/pricing";
import { RegisterPage } from "@pages/register";
import { WriterArticlesPage } from "@pages/writer-articles";
import { AuthLayout } from "@widgets/auth-layout";
import { DashboardLayout } from "@widgets/dashboard-layout";
import { PublicLayout } from "@widgets/public-layout";
import { Navigate, Outlet, createBrowserRouter } from "react-router-dom";

export const appRouter = createBrowserRouter([
  {
    path: "/map",
    element: (
      <ProtectedRoute>
        <MapPage />
      </ProtectedRoute>
    ),
  },

  {
    element: <PublicLayout />,
    children: [
      {
        path: "/",
        element: <HomePage />,
      },
      {
        path: "blog",
        element: <BlogPage />,
      },
      { path: "blog/:slug", element: <ArticlePage /> },
      {
        path: "contact-us",
        element: <ContactPage />,
      },
      {
        path: "pricing",
        element: <PricingPage />,
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
        element: <LoginPage />,
      },
      {
        path: "/register",
        element: <RegisterPage />,
      },
    ],
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
        element: <DashboardOverviewPage />,
      },
      {
        path: "overview",
        element: <DashboardOverviewPage />,
      },
      {
        path: "files",
        element: <DashboardFilesPage />,
      },
      { path: "company", element: <CompanyPage /> },
      {
        path: "convert",
        element: <ConversionPage />,
      },
      {
        path: "articles",
        element: (
          <ProtectedRoute requiredRole="writer">
            <WriterArticlesPage />
          </ProtectedRoute>
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
          { path: "users", element: <ManagementPlaceholder title="مدیریت کاربران" /> },
          { path: "plans", element: <AdminPlansPage /> },
          { path: "reports", element: <ManagementPlaceholder title="گزارش‌های مدیریتی" /> },
        ],
      },
      {
        path: "map",
        element: <MapPage />,
      },
    ],
  },

  {
    path: "*",
    element: <div>صفحه پیدا نشد (404)</div>,
  },
]);
