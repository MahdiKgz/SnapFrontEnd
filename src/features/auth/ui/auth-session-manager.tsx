import { type ReactNode, useCallback, useEffect, useRef } from "react";

import { useAppDispatch, useAppSelector } from "@/app/store/hooks";

import { useRefreshMutation } from "../api/auth-api";
import { getAccessTokenExpiration } from "../model/access-token";
import { checkSession, logout, setCredentials } from "../model/auth-slice";

interface AuthSessionManagerProps {
  children: ReactNode;
}

const REFRESH_LEAD_TIME_MS = 30_000;

export function AuthSessionManager({ children }: AuthSessionManagerProps) {
  const dispatch = useAppDispatch();
  const { accessToken, status } = useAppSelector((state) => state.auth);
  const [refresh] = useRefreshMutation();
  const refreshInFlight = useRef<Promise<void> | null>(null);

  const refreshSession = useCallback(() => {
    if (refreshInFlight.current) return refreshInFlight.current;

    dispatch(checkSession());
    const request = refresh()
      .unwrap()
      .then((credentials) => {
        dispatch(setCredentials(credentials));
      })
      .catch(() => {
        dispatch(logout());
      })
      .finally(() => {
        refreshInFlight.current = null;
      });

    refreshInFlight.current = request;
    return request;
  }, [dispatch, refresh]);

  useEffect(() => {
    if (status === "checking") void refreshSession();
  }, [refreshSession, status]);

  useEffect(() => {
    if (status !== "authenticated" || !accessToken) return;

    const expiration = getAccessTokenExpiration(accessToken);
    if (expiration === null) {
      dispatch(logout());
      return;
    }

    const delay = Math.max(0, expiration - Date.now() - REFRESH_LEAD_TIME_MS);
    const timeout = window.setTimeout(() => void refreshSession(), delay);
    return () => window.clearTimeout(timeout);
  }, [accessToken, dispatch, refreshSession, status]);

  return children;
}
