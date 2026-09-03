// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DashboardOverview } from "./dashboard-overview";

const { refetch } = vi.hoisted(() => ({ refetch: vi.fn() }));

vi.mock("../api/files-api", () => ({
  useGetUserDashboardSummaryQuery: () => ({
    data: {
      success: true,
      data: {
        plan: {
          code: "free",
          name: "رایگان",
          expiresAt: null,
          remainingDays: null,
        },
        usage: { files: 7, identifiedIssues: 24, healedIssues: 18 },
      },
    },
    isError: false,
    isFetching: false,
    refetch,
  }),
}));

describe("DashboardOverview", () => {
  afterEach(cleanup);

  it("shows the user's plan, remaining time, and persisted activity totals", () => {
    render(
      <MemoryRouter>
        <DashboardOverview />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "پیشخوان" })).toBeTruthy();
    expect(screen.getByText("رایگان")).toBeTruthy();
    expect(screen.getByText("بدون محدودیت زمانی")).toBeTruthy();
    expect(screen.getByText("۷")).toBeTruthy();
    expect(screen.getByText("۲۴")).toBeTruthy();
    expect(screen.getByText("۱۸")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: /مدیریت فایل‌ها/ }).getAttribute("href"),
    ).toBe("/dashboard/files");
    expect(
      screen
        .getByRole("progressbar", { name: "نرخ ترمیم خطاها" })
        .getAttribute("aria-valuenow"),
    ).toBe("75");
  });
});
