import { ProtectedRoute } from "@/features/auth/ui/protected-route";
import MapPage from "@/pages/map";
import { Navigate, createBrowserRouter } from "react-router-dom";

import Overview from "../pages/dashboard/overview";
import Home from "../pages/home";
import BlogPage from "../pages/home/blog";
import ContactPage from "../pages/home/contact";
import PricingPage from "../pages/home/pricing";
import LoginPage from "../pages/login";
import RegisterPage from "../pages/register";
import UnauthorizedPage from "../pages/unauthorized";
import AuthLayout from "./auth-layout";
import { DashboardLayout } from "./dashboard-layout";
import PublicLayout from "./public-layout";

export const appRouter = createBrowserRouter([
  {
    path: "/map",
    element: <MapPage />,
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
    path: "/auth",
    element: <AuthLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="login" replace />,
      },
      {
        path: "login",
        element: <LoginPage />,
      },
      {
        path: "register",
        element: <RegisterPage />,
      },
    ],
  },

  {
    path: "/dashboard",
    element: (
      <ProtectedRoute fallback={<UnauthorizedPage />}>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="overview" replace />,
      },
      {
        path: "overview",
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
