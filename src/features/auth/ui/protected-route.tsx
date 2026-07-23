import type { ReactNode } from "react";

import { useAppSelector } from "@/app/store/hooks";

interface ProtectedRouteProps {
  children: ReactNode;
  fallback: ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const isAuthenticated = useAppSelector((state) => Boolean(state.auth.accessToken));

  return isAuthenticated ? children : fallback;
}
