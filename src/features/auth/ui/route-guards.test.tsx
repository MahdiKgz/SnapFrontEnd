// @vitest-environment jsdom
import { configureStore } from "@reduxjs/toolkit";
import { cleanup, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";

import authReducer, { type AuthState } from "../model/auth-slice";
import { ProtectedRoute } from "./protected-route";
import { PublicOnlyRoute } from "./public-only-route";

const validToken = `header.${btoa(
  JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }),
)}.signature`;

const user = {
  id: "user-1",
  name: "Snap User",
  phone: "09123456789",
  roles: ["user"],
};

const anonymousState: AuthState = {
  status: "anonymous",
  accessToken: null,
  user: null,
};

const authenticatedState: AuthState = {
  status: "authenticated",
  accessToken: validToken,
  user,
};

function LoginDestination() {
  const location = useLocation();
  return <div>login:{(location.state as { from?: string } | null)?.from}</div>;
}

const renderProtectedRoute = (auth: AuthState) => {
  const store = configureStore({ reducer: { auth: authReducer }, preloadedState: { auth } });
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/map?layer=roads#selected"]}>
        <Routes>
          <Route path="/login" element={<LoginDestination />} />
          <Route
            path="*"
            element={
              <ProtectedRoute>
                <div>protected map</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
};

describe("authentication route guards", () => {
  afterEach(cleanup);

  it("redirects anonymous users to login and preserves their destination", () => {
    renderProtectedRoute(anonymousState);
    expect(screen.getByText("login:/map?layer=roads#selected")).toBeTruthy();
  });

  it("renders protected content for a valid authenticated session", () => {
    renderProtectedRoute(authenticatedState);
    expect(screen.getByText("protected map")).toBeTruthy();
  });

  it("redirects authenticated users away from login and registration", () => {
    const store = configureStore({
      reducer: { auth: authReducer },
      preloadedState: { auth: authenticatedState },
    });
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <div>login form</div>
                </PublicOnlyRoute>
              }
            />
            <Route path="/dashboard" element={<div>dashboard</div>} />
          </Routes>
        </MemoryRouter>
      </Provider>,
    );

    expect(screen.getByText("dashboard")).toBeTruthy();
  });
});
