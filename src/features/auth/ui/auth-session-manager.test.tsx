// @vitest-environment jsdom
import { configureStore } from "@reduxjs/toolkit";
import { cleanup, render, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import authReducer, { type AuthState } from "../model/auth-slice";
import { AuthSessionManager } from "./auth-session-manager";

const { refreshTrigger } = vi.hoisted(() => ({ refreshTrigger: vi.fn() }));

vi.mock("../api/auth-api", () => ({
  useRefreshMutation: () => [refreshTrigger],
}));

const checkingState: AuthState = {
  status: "checking",
  accessToken: null,
  user: null,
};

const credentials = {
  accessToken: `header.${btoa(
    JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }),
  )}.signature`,
  user: {
    id: "user-1",
    name: "Snap User",
    phone: "09123456789",
    roles: ["user"],
  },
};

const createTestStore = () =>
  configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth: checkingState },
  });

describe("AuthSessionManager", () => {
  beforeEach(() => {
    localStorage.clear();
    refreshTrigger.mockReset();
  });

  afterEach(cleanup);

  it("restores authentication from the HttpOnly refresh session", async () => {
    refreshTrigger.mockReturnValue({ unwrap: () => Promise.resolve(credentials) });
    const store = createTestStore();

    render(
      <Provider store={store}>
        <AuthSessionManager>application</AuthSessionManager>
      </Provider>,
    );

    await waitFor(() => expect(store.getState().auth.status).toBe("authenticated"));
    expect(store.getState().auth.user).toEqual(credentials.user);
    expect(refreshTrigger).toHaveBeenCalledOnce();
  });

  it("resolves to anonymous when the refresh session has expired", async () => {
    refreshTrigger.mockReturnValue({ unwrap: () => Promise.reject(new Error("expired")) });
    const store = createTestStore();

    render(
      <Provider store={store}>
        <AuthSessionManager>application</AuthSessionManager>
      </Provider>,
    );

    await waitFor(() => expect(store.getState().auth.status).toBe("anonymous"));
    expect(store.getState().auth.accessToken).toBeNull();
  });
});
