// @vitest-environment jsdom
import authReducer from "@/features/auth/model/auth-slice";
import type { AuthState } from "@/features/auth/model/auth-slice";
import { configureStore } from "@reduxjs/toolkit";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import Header from "./Header";

const { revokeSession } = vi.hoisted(() => ({ revokeSession: vi.fn() }));

vi.mock("@/features/auth/api/auth-api", () => ({
  useLogoutMutation: () => [revokeSession, { isLoading: false }],
}));

const renderHeader = (auth: AuthState) => {
  const store = configureStore({
    reducer: { auth: authReducer },
    preloadedState: { auth },
  });
  render(
    <Provider store={store}>
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    </Provider>,
  );
  return store;
};

describe("landing Header account actions", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    revokeSession.mockReturnValue({ unwrap: () => Promise.resolve() });
  });

  it("shows one authentication action to anonymous users", () => {
    renderHeader({ status: "anonymous", accessToken: null, user: null });

    const authLink = screen.getByRole("link", { name: "ورود یا ثبت‌نام" });
    expect(authLink.getAttribute("href")).toBe("/login");
    expect(screen.queryByRole("link", { name: "ورود به داشبورد" })).toBeNull();
  });

  it("opens account details and provides dashboard and logout actions", async () => {
    const store = renderHeader({
      status: "authenticated",
      accessToken: "access-token",
      user: {
        id: "user-1",
        name: "Mahdi User",
        phone: "09120000002",
        roles: ["user"],
      },
    });

    fireEvent.click(screen.getByRole("button", { name: /Mahdi User/ }));
    expect(screen.getByRole("menu", { name: "حساب کاربری" })).toBeTruthy();
    expect(screen.getByText("09120000002")).toBeTruthy();
    expect(screen.getByText("کاربر تأییدشده")).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "ورود به داشبورد" }).getAttribute("href")).toBe(
      "/dashboard",
    );

    fireEvent.click(screen.getByRole("menuitem", { name: "خروج از حساب" }));
    await waitFor(() => expect(revokeSession).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(store.getState().auth.status).toBe("anonymous"));
    expect(screen.queryByRole("menu", { name: "حساب کاربری" })).toBeNull();
  });
});
