import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

import { type AuthState, setCredentials } from "../model/auth-slice";
import type { AuthCredentials, LoginRequest, RegisterRequest } from "../model/types";

interface StateWithAuth {
  auth: AuthState;
}

interface WrappedAuthResponse {
  data: AuthCredentials;
}

function unwrapAuthResponse(response: AuthCredentials | WrappedAuthResponse) {
  return "data" in response ? response.data : response;
}

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_BASE_URL ?? "/api",
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as StateWithAuth).auth.accessToken;

      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }

      return headers;
    },
  }),
  endpoints: (builder) => ({
    login: builder.mutation<AuthCredentials, LoginRequest>({
      query: (credentials) => ({
        url: "/auth/login",
        method: "POST",
        body: credentials,
      }),
      transformResponse: unwrapAuthResponse,
      async onQueryStarted(_credentials, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials(data));
        } catch {
          // The mutation exposes the server error to the form.
        }
      },
    }),
    register: builder.mutation<AuthCredentials, RegisterRequest>({
      query: (account) => ({
        url: "/auth/register",
        method: "POST",
        body: account,
      }),
      transformResponse: unwrapAuthResponse,
      async onQueryStarted(_account, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(setCredentials(data));
        } catch {
          // The mutation exposes the server error to the form.
        }
      },
    }),
  }),
});

export const { useLoginMutation, useRegisterMutation } = authApi;
