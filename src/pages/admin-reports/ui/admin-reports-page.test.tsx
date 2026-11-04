// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { SystemReports } from "@features/business";

import AdminReportsPage from "./admin-reports-page";

const { query, refetch } = vi.hoisted(() => ({ query: vi.fn(), refetch: vi.fn() }));
vi.mock("@features/business/api/business-api", () => ({
  useGetSystemReportsQuery: (...args: unknown[]) => query(...args),
}));
const data: SystemReports = {
  range: { from: "2026-11-01", to: "2026-11-04", timeZone: "UTC" },
  summary: {
    users: 12,
    newUsers: 2,
    companies: 4,
    activeCompanies: 3,
    uploads: 9,
    bytes: 2048,
    identifiedIssues: 25,
    healedIssues: 18,
    storedFiles: 8,
    deletedFiles: 1,
    completed: 6,
    failed: 1,
    processing: 2,
  },
  plans: [{ code: "starter", name: "پایه", count: 12 }],
  statuses: [
    { status: "completed", count: 6 },
    { status: "failed", count: 1 },
    { status: "queued", count: 2 },
  ],
  daily: [
    {
      date: "2026-11-04",
      uploads: 9,
      completed: 6,
      failed: 1,
      identifiedIssues: 25,
      healedIssues: 18,
      bytes: 2048,
    },
  ],
  recentFailures: [
    {
      id: "file",
      name: "محدودهٔ شهر",
      originalName: "parcels.geojson",
      healStatus: "failed",
      sizeInBytes: 1024,
      identifiedIssues: 5,
      healedIssues: 0,
      createdAt: "2026-11-04T12:00:00Z",
      user: { id: "user-1", name: "کاربر نمونه" },
    },
  ],
};
const view = () =>
  render(
    <MemoryRouter>
      <AdminReportsPage />
    </MemoryRouter>,
  );
beforeEach(() => {
  vi.clearAllMocks();
  query.mockReturnValue({ currentData: { data }, isFetching: false, refetch });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("system reports", () => {
  it("shows real totals, upload-date semantics, failed metadata and a working user-detail link", () => {
    view();
    expect(screen.getByRole("heading", { name: "گزارش‌های سامانه" })).toBeTruthy();
    expect(
      within(screen.getByRole("region", { name: "خلاصهٔ پردازش‌ها" })).getByText("۹"),
    ).toBeTruthy();
    expect(screen.getByText("parcels.geojson")).toBeTruthy();
    expect(screen.getByRole("link", { name: "کاربر نمونه" }).getAttribute("href")).toBe(
      "/dashboard/admin/users?user=user-1",
    );
    expect(screen.getByText(/تاریخ آپلود فایل/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "ناموفق‌ها" }));
    expect(screen.getByRole("img", { name: "نمودار ناموفق‌ها در بازه انتخاب‌شده" })).toBeTruthy();
  });
  it("applies only valid submitted date ranges and supports quick presets", () => {
    view();
    fireEvent.change(screen.getByLabelText("از تاریخ"), { target: { value: "2026-11-01" } });
    fireEvent.change(screen.getByLabelText("تا تاریخ"), { target: { value: "2026-11-04" } });
    fireEvent.submit(screen.getByRole("button", { name: "اعمال بازه" }).closest("form")!);
    expect(query).toHaveBeenLastCalledWith(
      { from: "2026-11-01", to: "2026-11-04" },
      expect.anything(),
    );
    fireEvent.change(screen.getByLabelText("از تاریخ"), { target: { value: "2026-11-05" } });
    fireEvent.submit(screen.getByRole("button", { name: "اعمال بازه" }).closest("form")!);
    expect(screen.getByRole("alert").textContent).toContain("۳۶۶");
    expect(query).toHaveBeenLastCalledWith(
      { from: "2026-11-01", to: "2026-11-04" },
      expect.anything(),
    );
    fireEvent.click(screen.getByRole("button", { name: "۷ روز اخیر" }));
    expect(screen.queryByRole("alert")).toBeNull();
    const range = query.mock.calls.at(-1)![0];
    expect(Date.parse(range.to) - Date.parse(range.from)).toBe(6 * 86400000);
  });
  it("shows loading and prevents exporting a report before it arrives", () => {
    query.mockReturnValue({ isFetching: true, refetch });
    view();
    expect(screen.getByRole("status").textContent).toContain("در حال دریافت");
    expect(
      screen.getByRole("button", { name: "خروجی CSV روند روزانه" }).hasAttribute("disabled"),
    ).toBe(true);
  });
  it("hides stale report data after an error and retries", () => {
    query.mockReturnValue({
      data: { data },
      isError: true,
      error: { data: { message: "دسترسی مدیر لازم است" } },
      refetch,
    });
    view();
    expect(screen.getByRole("alert").textContent).toBe("دسترسی مدیر لازم است");
    expect(screen.queryByText("parcels.geojson")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "تلاش دوباره" }));
    expect(refetch).toHaveBeenCalledOnce();
  });
  it("shows a meaningful empty report and no failed-file rows", () => {
    query.mockReturnValue({
      currentData: {
        data: { ...data, summary: { ...data.summary, uploads: 0 }, recentFailures: [] },
      },
      refetch,
    });
    view();
    expect(screen.getByRole("status").textContent).toContain("هیچ فایل آپلودشده‌ای");
    expect(screen.getByText("فایل ناموفقی در این بازه وجود ندارد.")).toBeTruthy();
  });
  it("downloads daily CSV from the currently displayed report", () => {
    const create = vi.fn(() => "blob:report");
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: create, revokeObjectURL: vi.fn() }));
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    view();
    fireEvent.click(screen.getByRole("button", { name: "خروجی CSV روند روزانه" }));
    expect(create).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
  });
});
