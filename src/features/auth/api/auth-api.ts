import { createApi } from "@reduxjs/toolkit/query/react";

import type { AuthCredentials, LoginRequest, RegisterRequest } from "../model/types";
import { createAuthBaseQuery, unwrapAuthResponse } from "./auth-base-query";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: createAuthBaseQuery(),
  endpoints: (builder) => ({
    login: builder.mutation<AuthCredentials, LoginRequest>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      transformResponse: unwrapAuthResponse,
    }),
    register: builder.mutation<AuthCredentials, RegisterRequest>({
      query: (account) => ({
        url: "/auth/register",
        method: "POST",
        body: account,
      }),
      transformResponse: unwrapAuthResponse,
    }),
    refresh: builder.mutation<AuthCredentials, void>({
      query: () => ({ url: "/auth/refresh", method: "POST" }),
      transformResponse: unwrapAuthResponse,
    }),
    logout: builder.mutation<void, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
    }),
  }),
});

export const { useLoginMutation, useLogoutMutation, useRefreshMutation, useRegisterMutation } =
  authApi;
