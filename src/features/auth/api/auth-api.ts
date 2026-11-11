import { createApi } from "@reduxjs/toolkit/query/react";

import type { AccountEmail, AuthCredentials, LoginRequest, RegisterRequest } from "../model/types";
import { createAuthBaseQuery, unwrapAuthResponse } from "./auth-base-query";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: createAuthBaseQuery(),
  tagTypes: ["AccountEmail"],
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
    accountEmail: builder.query<AccountEmail, void>({
      query: () => "/auth/email",
      transformResponse: (response: { data: AccountEmail }) => response.data,
      providesTags: ["AccountEmail"],
      keepUnusedDataFor: 0,
    }),
    requestEmailVerification: builder.mutation<AccountEmail, { email: string; password: string }>({
      query: (body) => ({ url: "/auth/email", method: "POST", body }),
      transformResponse: (response: { data: AccountEmail }) => response.data,
      invalidatesTags: (result) => (result ? ["AccountEmail"] : []),
    }),
    verifyEmail: builder.mutation<AccountEmail, { token: string }>({
      query: (body) => ({ url: "/auth/email/verify", method: "POST", body }),
      transformResponse: (response: { data: AccountEmail }) => response.data,
      invalidatesTags: (result) => (result ? ["AccountEmail"] : []),
    }),
    forgotPassword: builder.mutation<{ success: true }, { email: string }>({
      query: (body) => ({ url: "/auth/forgot-password", method: "POST", body }),
    }),
    resetPassword: builder.mutation<void, { token: string; password: string }>({
      query: (body) => ({ url: "/auth/reset-password", method: "POST", body }),
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

export const {
  useAccountEmailQuery,
  useForgotPasswordMutation,
  useLoginMutation,
  useLogoutMutation,
  useRefreshMutation,
  useRegisterMutation,
  useRequestEmailVerificationMutation,
  useResetPasswordMutation,
  useVerifyEmailMutation,
} = authApi;
