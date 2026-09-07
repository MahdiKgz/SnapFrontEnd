import type { ReactNode } from "react";

import { useAppSelector } from "@/app/store/hooks";
import { Navigate, useLocation } from "react-router-dom";

import { isAccessTokenExpired } from "../model/access-token";
import { SessionLoader } from "./session-loader";

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const location = useLocation();
  const { accessToken, status, user } = useAppSelector((state) => state.auth);

  if (status === "checking") return <SessionLoader />;

  const isAuthenticated =
    status === "authenticated" &&
    Boolean(accessToken) &&
    !isAccessTokenExpired(accessToken as string);

  if (!isAuthenticated) {
    const from = `${location.pathname}${location.search}${location.hash}`;
    return <Navigate to="/login" replace state={{ from }} />;
  }

  if (requiredRole && !user?.roles.includes(requiredRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
