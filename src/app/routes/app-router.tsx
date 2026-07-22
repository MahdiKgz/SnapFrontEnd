import { Navigate, createBrowserRouter } from "react-router-dom";

import MapPage from "../pages/dashboard/map";
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
    element: <AuthLayout />,
    children: [
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
    element: <DashboardLayout />,
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
