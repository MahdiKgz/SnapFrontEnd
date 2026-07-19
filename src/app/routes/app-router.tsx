import { Navigate, createBrowserRouter } from "react-router-dom";

import Home from "../pages/home";
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
        element: <div>صفحه بلاگ</div>,
      },
      {
        path: "contact-us",
        element: <div>صفحه تماس با ما</div>,
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
        element: <Navigate to="map" replace />,
      },
      {
        path: "map",
        element: <div>کامپوننت نقشه و لایه‌ها</div>,
      },
      {
        path: "tables",
        element: <div>کامپوننت جداول تان‌استک</div>,
      },
    ],
  },

  {
    path: "*",
    element: <div>صفحه پیدا نشد (404)</div>,
  },
]);
