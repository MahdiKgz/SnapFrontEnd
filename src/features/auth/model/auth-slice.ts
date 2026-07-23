import { type PayloadAction, createSlice } from "@reduxjs/toolkit";

import { clearStoredCredentials, readStoredCredentials, storeCredentials } from "./auth-storage";
import type { AuthCredentials, AuthUser } from "./types";

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
}

const storedCredentials = readStoredCredentials();

const initialState: AuthState = {
  accessToken: storedCredentials?.accessToken ?? null,
  refreshToken: storedCredentials?.refreshToken ?? null,
  user: storedCredentials?.user ?? null,
};

const initialStateWithoutCredentials: AuthState = {
  accessToken: null,
  refreshToken: null,
  user: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (_state, action: PayloadAction<AuthCredentials>) => {
      storeCredentials(action.payload);

      return {
        accessToken: action.payload.accessToken,
        refreshToken: action.payload.refreshToken ?? null,
        user: action.payload.user,
      };
    },
    logout: () => {
      clearStoredCredentials();
      return initialStateWithoutCredentials;
    },
  },
});

export const { logout, setCredentials } = authSlice.actions;
export default authSlice.reducer;
