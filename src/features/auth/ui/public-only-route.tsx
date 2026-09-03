import type { ReactNode } from "react";

import { useAppSelector } from "@/app/store/hooks";
import { Navigate } from "react-router-dom";

import { isAccessTokenExpired } from "../model/access-token";
import { SessionLoader } from "./session-loader";

interface PublicOnlyRouteProps {
  children: ReactNode;
}

export function PublicOnlyRoute({ children }: PublicOnlyRouteProps) {
  const { accessToken, status } = useAppSelector((state) => state.auth);

  if (status === "checking") return <SessionLoader />;
  if (status === "authenticated" && accessToken && !isAccessTokenExpired(accessToken)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
