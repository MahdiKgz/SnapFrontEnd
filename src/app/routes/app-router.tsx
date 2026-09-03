import { ProtectedRoute } from "@/features/auth/ui/protected-route";
import { PublicOnlyRoute } from "@/features/auth/ui/public-only-route";
import MapPage from "@/pages/map";
import { Navigate, createBrowserRouter } from "react-router-dom";

import Overview from "../pages/dashboard/overview";
import Home from "../pages/home";
import BlogPage from "../pages/home/blog";
import ContactPage from "../pages/home/contact";
import PricingPage from "../pages/home/pricing";
import LoginPage from "../pages/login";
import RegisterPage from "../pages/register";
import AuthLayout from "./auth-layout";
import { DashboardLayout } from "./dashboard-layout";
import PublicLayout from "./public-layout";

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
        element: <Home />,
      },
      {
        path: "blog",
        element: <BlogPage />,
      },
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
        element: <Overview />,
      },
      {
        path: "overview",
        element: <Overview />,
      },
      {
        path: "files",
        element: <Overview />,
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
