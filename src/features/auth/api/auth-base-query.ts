import type { BaseQueryApi, FetchArgs } from "@reduxjs/toolkit/query";
import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import { type AuthState, logout, setCredentials } from "../model/auth-slice";
import type { AuthCredentials } from "../model/types";

interface StateWithAuth {
  auth: AuthState;
}

interface WrappedAuthResponse {
  data: AuthCredentials;
}

const isAuthCredentials = (value: unknown): value is AuthCredentials => {
  if (!value || typeof value !== "object") return false;
  const credentials = value as Partial<AuthCredentials>;
  return (
    typeof credentials.accessToken === "string" &&
    Boolean(credentials.user) &&
    typeof credentials.user?.id === "string" &&
    typeof credentials.user.name === "string" &&
    typeof credentials.user.phone === "string" &&
    Array.isArray(credentials.user.roles) &&
    credentials.user.roles.every((role) => typeof role === "string")
  );
};

export const AUTH_API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api";

export const unwrapAuthResponse = (
  response: AuthCredentials | WrappedAuthResponse,
): AuthCredentials => {
  const credentials = "data" in response ? response.data : response;
  if (!isAuthCredentials(credentials)) throw new Error("Invalid authentication response");
  return credentials;
};

export const createAuthBaseQuery = (baseUrl = AUTH_API_BASE_URL) =>
  fetchBaseQuery({
    baseUrl,
    credentials: "include",
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as StateWithAuth).auth.accessToken;
      if (token) headers.set("authorization", `Bearer ${token}`);
      return headers;
    },
  });

const refreshBaseQuery = fetchBaseQuery({
  baseUrl: AUTH_API_BASE_URL,
  credentials: "include",
});

let refreshRequest: Promise<AuthCredentials | null> | null = null;

const refreshCredentials = (api: BaseQueryApi): Promise<AuthCredentials | null> => {
  if (refreshRequest) return refreshRequest;

  const request = Promise.resolve(
    refreshBaseQuery({ url: "/auth/refresh", method: "POST" }, api, {}),
  )
    .then((result) => {
      if (result.error || !result.data) return null;
      const credentials = unwrapAuthResponse(result.data as AuthCredentials | WrappedAuthResponse);
      api.dispatch(setCredentials(credentials));
      return credentials;
    })
    .catch(() => null);

  refreshRequest = request;
  void request.finally(() => {
    if (refreshRequest === request) refreshRequest = null;
  });
  return request;
};

export const createReauthenticatingBaseQuery = (baseUrl: string) => {
  const baseQuery = createAuthBaseQuery(baseUrl);

  return async (args: string | FetchArgs, api: BaseQueryApi, extraOptions: object) => {
    let result = await baseQuery(args, api, extraOptions);

    if (result.error?.status === 401) {
      const refreshed = await refreshCredentials(api);
      if (refreshed) {
        result = await baseQuery(args, api, extraOptions);
      } else {
        api.dispatch(logout());
      }
    }

    return result;
  };
};
