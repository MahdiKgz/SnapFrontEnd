// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";

import authReducer, { logout, setCredentials } from "./auth-slice";
import type { AuthCredentials } from "./types";

const credentials: AuthCredentials = {
  accessToken: createToken(Math.floor(Date.now() / 1000) + 3600),
  user: {
    id: "user-1",
    name: "کاربر آزمایشی",
    phone: "09123456789",
    roles: ["user"],
  },
};

function createToken(expiration: number) {
  return `header.${btoa(JSON.stringify({ exp: expiration }))}.signature`;
}

describe("auth slice", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("stores credentials after a successful authentication", () => {
    const state = authReducer(undefined, setCredentials(credentials));

    expect(state).toEqual({
      status: "authenticated",
      accessToken: credentials.accessToken,
      user: credentials.user,
    });
    expect(JSON.parse(localStorage.getItem("snapgis.auth") ?? "")).toEqual(credentials);
  });

  it("clears credentials on logout", () => {
    const authenticatedState = authReducer(undefined, setCredentials(credentials));
    const state = authReducer(authenticatedState, logout());

    expect(state).toEqual({
      status: "anonymous",
      accessToken: null,
      user: null,
    });
    expect(localStorage.getItem("snapgis.auth")).toBeNull();
  });

  it("rejects credentials containing an expired access token", () => {
    const state = authReducer(
      undefined,
      setCredentials({
        ...credentials,
        accessToken: createToken(Math.floor(Date.now() / 1000) - 1),
      }),
    );

    expect(state.status).toBe("anonymous");
    expect(state.accessToken).toBeNull();
    expect(localStorage.getItem("snapgis.auth")).toBeNull();
  });
});
