import { type PayloadAction, createSlice } from "@reduxjs/toolkit";

import { isAccessTokenExpired } from "./access-token";
import { clearStoredCredentials, readStoredCredentials, storeCredentials } from "./auth-storage";
import type { AuthCredentials, AuthStatus, AuthUser } from "./types";

export interface AuthState {
  status: AuthStatus;
  accessToken: string | null;
  user: AuthUser | null;
}

const storedCredentials = readStoredCredentials();

const initialState: AuthState = {
  status: storedCredentials ? "authenticated" : "checking",
  accessToken: storedCredentials?.accessToken ?? null,
  user: storedCredentials?.user ?? null,
};

const initialStateWithoutCredentials: AuthState = {
  status: "anonymous",
  accessToken: null,
  user: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (_state, action: PayloadAction<AuthCredentials>) => {
      if (isAccessTokenExpired(action.payload.accessToken)) {
        clearStoredCredentials();
        return initialStateWithoutCredentials;
      }

      storeCredentials(action.payload);

      return {
        status: "authenticated" as const,
        accessToken: action.payload.accessToken,
        user: action.payload.user,
      };
    },
    checkSession: (state) => {
      state.status = "checking";
    },
    logout: () => {
      clearStoredCredentials();
      return initialStateWithoutCredentials;
    },
  },
});

export const { checkSession, logout, setCredentials } = authSlice.actions;
export default authSlice.reducer;
