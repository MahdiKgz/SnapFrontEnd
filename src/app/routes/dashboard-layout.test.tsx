// @vitest-environment jsdom
import authReducer, { type AuthState } from "@/features/auth/model/auth-slice";
import { configureStore } from "@reduxjs/toolkit";
import { cleanup, render, screen, within } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DashboardLayout } from "./dashboard-layout";

vi.mock("@/features/auth/api/auth-api", () => ({
  useLogoutMutation: () => [vi.fn(), { isLoading: false }],
}));
vi.mock("@/features/theme/ui/theme-toggle", () => ({ ThemeToggle: () => <button>تم</button> }));

function renderSidebar(roles: string[]) {
  const auth: AuthState = {
    status: "authenticated",
    accessToken: "test-session",
    user: { id: "user-1", name: "Test User", phone: "09120000001", roles },
  };
  const store = configureStore({ reducer: { auth: authReducer }, preloadedState: { auth } });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={["/dashboard/admin/users"]}>
        <DashboardLayout />
      </MemoryRouter>
    </Provider>,
  );
  return within(screen.getByRole("navigation", { name: "منوی داشبورد" }));
}

describe("dashboard navigation by role", () => {
  afterEach(cleanup);

  it.each([["user"], ["viewer"], []])(
    "keeps workspace navigation available and management hidden for %j",
    (...roles) => {
      const nav = renderSidebar(roles);
      expect(nav.getByRole("heading", { name: "فضای کاری" })).toBeTruthy();
      expect(nav.getAllByRole("link")).toHaveLength(3);
      expect(nav.queryByRole("link", { name: "مدیریت کاربران" })).toBeNull();
      expect(nav.queryByRole("heading", { name: "مدیریت سامانه" })).toBeNull();
      expect(nav.queryByRole("heading", { name: "گزارش‌های مدیریتی" })).toBeNull();
    },
  );

  it("shows three sections to admins and marks only the current link active", () => {
    const nav = renderSidebar(["user", "admin"]);
    expect(nav.getAllByRole("heading")).toHaveLength(3);
    expect(nav.getByRole("link", { name: "مدیریت کاربران" }).getAttribute("href")).toBe(
      "/dashboard/admin/users",
    );
    expect(nav.getByRole("link", { name: "مدیریت پلن‌ها" }).getAttribute("href")).toBe(
      "/dashboard/admin/plans",
    );
    expect(nav.getByRole("link", { name: "گزارش‌های سامانه" }).getAttribute("href")).toBe(
      "/dashboard/admin/reports",
    );
    expect(nav.getByRole("link", { name: "مدیریت کاربران" }).getAttribute("aria-current")).toBe(
      "page",
    );
    expect(nav.getByRole("link", { name: "پیشخوان" }).getAttribute("aria-current")).toBeNull();
  });
});
