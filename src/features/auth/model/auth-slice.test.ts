// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";

import authReducer, { logout, setCredentials } from "./auth-slice";
import type { AuthCredentials } from "./types";

const credentials: AuthCredentials = {
  accessToken: "access-token",
  refreshToken: "refresh-token",
  user: {
    id: "user-1",
    name: "کاربر آزمایشی",
    phone: "09123456789",
  },
};

describe("auth slice", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores credentials after a successful authentication", () => {
    const state = authReducer(undefined, setCredentials(credentials));

    expect(state).toEqual({
      accessToken: credentials.accessToken,
      refreshToken: credentials.refreshToken,
      user: credentials.user,
    });
    expect(JSON.parse(localStorage.getItem("snapgis.auth") ?? "")).toEqual(credentials);
  });

  it("clears credentials on logout", () => {
    const authenticatedState = authReducer(undefined, setCredentials(credentials));
    const state = authReducer(authenticatedState, logout());

    expect(state).toEqual({
      accessToken: null,
      refreshToken: null,
      user: null,
    });
    expect(localStorage.getItem("snapgis.auth")).toBeNull();
  });
});
