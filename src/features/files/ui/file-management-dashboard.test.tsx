// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FileManagementDashboard } from "./file-management-dashboard";

const { deleteFile, getFiles, refetch, renameFile } = vi.hoisted(() => ({
  deleteFile: vi.fn(),
  getFiles: vi.fn(),
  refetch: vi.fn(),
  renameFile: vi.fn(),
}));

const summary = {
  id: "19c53c73-b994-4723-abf1-ab2f87e05679",
  name: "Parcel layer",
  originalName: "parcels.geojson",
  sizeInBytes: 1024,
  uploadedAt: "2026-09-03T06:30:00.000Z",
  updatedAt: "2026-09-03T06:30:00.000Z",
  status: "completed",
  isHealed: true,
  issuesFound: 2,
};

let detailIsHealed = true;

function LocationProbe() {
  const location = useLocation();
  return <output aria-label="مسیر فعلی">{`${location.pathname}${location.search}`}</output>;
}

vi.mock("../api/files-api", () => ({
  DEFAULT_FILES_LIMIT: 10,
  useGetUserFilesQuery: getFiles,
  useGetUserFileQuery: () => ({
    data: {
      success: true,
      data: {
        ...summary,
        status: detailIsHealed ? "completed" : "dry-run-complete",
        isHealed: detailIsHealed,
        mimeType: "application/geo+json",
        report: {
          valid: false,
          summary: { issuesFound: 2, issueGroups: 1 },
          issueGroups: [
            {
              groupId: "duplicateVertices:DUPLICATE_VERTEX",
              code: "DUPLICATE_VERTEX",
              issueCount: 2,
              affectedFeatureCount: 1,
            },
          ],
        },
        healing: {
          completedAt: "2026-09-03T06:35:00.000Z",
          error: null,
          result: detailIsHealed
            ? {
                repairs: { duplicateVerticesRemoved: 2 },
                output: { previewPath: `/heal/${summary.id}/output` },
              }
            : null,
        },
      },
    },
    isError: false,
    isFetching: false,
    refetch,
  }),
  useRenameUserFileMutation: () => [renameFile, { isLoading: false }],
  useDeleteUserFileMutation: () => [deleteFile],
}));

vi.mock("@/features/topology", () => ({
  useCancelHealingMutation: () => [vi.fn(), { isLoading: false }],
}));

describe("FileManagementDashboard", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    getFiles.mockImplementation(({ skip, limit }: { skip: number; limit: number }) => {
      const response = {
        success: true,
        data: {
          items: [summary],
          pagination: { skip, limit, total: 1, hasMore: false },
        },
      };
      return { data: response, currentData: response, isError: false, isFetching: false, refetch };
    });
    detailIsHealed = true;
    renameFile.mockReturnValue({ unwrap: () => Promise.resolve() });
    deleteFile.mockReturnValue({ unwrap: () => Promise.resolve() });
  });

  it("shows the paginated summary and animates the detail modal", async () => {
    render(
      <MemoryRouter>
        <FileManagementDashboard />
      </MemoryRouter>,
    );

    expect(screen.getByText("Parcel layer")).toBeTruthy();
    expect(screen.getByText("parcels.geojson")).toBeTruthy();
    expect(screen.getByText("صفحه ۱ از ۱")).toBeTruthy();

    fireEvent.click(screen.getByLabelText("مشاهده Parcel layer"));
    const dialog = screen.getByRole("dialog", { name: "جزئیات فایل" });
    expect(dialog.className).toContain("animate-in");
    expect(screen.getByText("DUPLICATE_VERTEX")).toBeTruthy();
    expect(screen.getByText("رأس‌های تکراری حذف‌شده")).toBeTruthy();
    expect(
      screen
        .getByRole("button", { name: "نمایش عوارض ترمیم‌شده روی نقشه" })
        .hasAttribute("disabled"),
    ).toBe(false);

    fireEvent.click(within(dialog).getByRole("button", { name: "بستن" }));
    expect(dialog.className).toContain("animate-out");
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "جزئیات فایل" })).toBeNull());
  });

  it("opens a healed file on the map and disables the action before healing", () => {
    const { unmount } = render(
      <MemoryRouter initialEntries={["/dashboard/files"]}>
        <FileManagementDashboard />
        <LocationProbe />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "نمایش Parcel layer روی نقشه" }));
    expect(screen.getByLabelText("مسیر فعلی").textContent).toBe(`/map?healedFile=${summary.id}`);

    fireEvent.click(screen.getByLabelText("مشاهده Parcel layer"));
    fireEvent.click(screen.getByRole("button", { name: "نمایش عوارض ترمیم‌شده روی نقشه" }));
    expect(screen.getByLabelText("مسیر فعلی").textContent).toBe(`/map?healedFile=${summary.id}`);

    unmount();
    detailIsHealed = false;
    render(
      <MemoryRouter>
        <FileManagementDashboard />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByLabelText("مشاهده Parcel layer"));
    expect(
      screen.getByRole("button", { name: "نمایش روی نقشه پس از ترمیم" }).hasAttribute("disabled"),
    ).toBe(true);
  });

  it("renames a file and asks for confirmation before deletion", async () => {
    render(
      <MemoryRouter>
        <FileManagementDashboard />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByLabelText("ویرایش Parcel layer"));
    fireEvent.change(screen.getByLabelText("نام نمایشی"), {
      target: { value: "Updated parcel layer" },
    });
    fireEvent.click(screen.getByRole("button", { name: "ذخیره تغییرات" }));
    await waitFor(() =>
      expect(renameFile).toHaveBeenCalledWith({
        id: summary.id,
        name: "Updated parcel layer",
      }),
    );

    fireEvent.click(screen.getByLabelText("حذف Parcel layer"));
    expect(screen.getByRole("dialog", { name: "تأیید حذف فایل" })).toBeTruthy();
    expect(
      screen
        .getByRole("region", { name: "جدول فایل‌ها" })
        .contains(screen.getByRole("dialog", { name: "تأیید حذف فایل" })),
    ).toBe(false);
    expect(deleteFile).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "بله، حذف شود" }));
    await waitFor(() => expect(deleteFile).toHaveBeenCalledWith(summary.id));
  });

  it("requests the selected page size and resets the page and table scroll", () => {
    const files = Array.from({ length: 31 }, (_, index) => ({
      ...summary,
      id: String(index),
      name: `File ${index}`,
    }));
    getFiles.mockImplementation(({ skip, limit }: { skip: number; limit: number }) => {
      const response = {
        data: {
          items: files.slice(skip, skip + limit),
          pagination: { skip, limit, total: files.length, hasMore: skip + limit < files.length },
        },
      };
      return { data: response, currentData: response, isError: false, isFetching: false, refetch };
    });
    render(
      <MemoryRouter>
        <FileManagementDashboard />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "صفحه بعد" }));
    expect(getFiles).toHaveBeenLastCalledWith({ skip: 10, limit: 10 });
    expect(screen.getByText("صفحه ۲ از ۴")).toBeTruthy();

    const scrollRegion = screen.getByRole("region", { name: "جدول فایل‌ها" });
    scrollRegion.scrollTop = 300;
    fireEvent.change(screen.getByRole("combobox", { name: "تعداد در صفحه" }), {
      target: { value: "20" },
    });
    expect(getFiles).toHaveBeenLastCalledWith({ skip: 0, limit: 20 });
    expect(scrollRegion.scrollTop).toBe(0);
    expect(screen.getByText("صفحه ۱ از ۲")).toBeTruthy();
    expect(within(scrollRegion).getAllByRole("row")).toHaveLength(21);

    fireEvent.click(screen.getByRole("button", { name: "صفحه بعد" }));
    expect(getFiles).toHaveBeenLastCalledWith({ skip: 20, limit: 20 });
    expect(within(scrollRegion).getAllByRole("row")).toHaveLength(12);
    expect(screen.getByRole("button", { name: "صفحه بعد" }).hasAttribute("disabled")).toBe(true);

    fireEvent.change(screen.getByRole("combobox", { name: "تعداد در صفحه" }), {
      target: { value: "50" },
    });
    expect(getFiles).toHaveBeenLastCalledWith({ skip: 0, limit: 50 });
    expect(screen.getByText("صفحه ۱ از ۱")).toBeTruthy();
    expect(within(scrollRegion).getAllByRole("row")).toHaveLength(32);
  });

  it("returns to the previous page after deleting its last file at the selected page size", async () => {
    let files = Array.from({ length: 21 }, (_, index) => ({
      ...summary,
      id: String(index),
      name: `File ${index}`,
    }));
    getFiles.mockImplementation(({ skip, limit }: { skip: number; limit: number }) => {
      const response = {
        data: {
          items: files.slice(skip, skip + limit),
          pagination: { skip, limit, total: files.length, hasMore: skip + limit < files.length },
        },
      };
      return { data: response, currentData: response, isError: false, isFetching: false, refetch };
    });
    deleteFile.mockImplementation((id: string) => ({
      unwrap: async () => {
        files = files.filter((file) => file.id !== id);
      },
    }));
    render(
      <MemoryRouter>
        <FileManagementDashboard />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByRole("combobox", { name: "تعداد در صفحه" }), {
      target: { value: "20" },
    });
    fireEvent.click(screen.getByRole("button", { name: "صفحه بعد" }));
    expect(screen.getByText("صفحه ۲ از ۲")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "حذف File 20" }));
    fireEvent.click(screen.getByRole("button", { name: "بله، حذف شود" }));

    await waitFor(() => expect(screen.getByText("صفحه ۱ از ۱")).toBeTruthy());
    expect(getFiles).toHaveBeenLastCalledWith({ skip: 0, limit: 20 });
    expect(
      screen.getByRole("combobox", { name: "تعداد در صفحه" }).getAttribute("disabled"),
    ).toBeNull();
    expect(screen.queryByText("File 20")).toBeNull();
  });
  it("debounces quick search, resets pagination, and uses server results without local filtering", async () => {
    getFiles.mockImplementation(({ skip, limit }) => {
      const response = {
        data: { items: [summary], pagination: { skip, limit, total: 31, hasMore: true } },
      };
      return { data: response, currentData: response, isFetching: false, refetch };
    });
    render(
      <MemoryRouter>
        <FileManagementDashboard />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: "صفحه بعد" }));
    fireEvent.change(screen.getByRole("searchbox", { name: "جستجوی فایل‌ها" }), {
      target: { value: "نام متفاوت" },
    });
    expect(getFiles).toHaveBeenLastCalledWith({ skip: 10, limit: 10 });
    await waitFor(() =>
      expect(getFiles).toHaveBeenLastCalledWith({ skip: 0, limit: 10, search: "نام متفاوت" }),
    );
    expect(screen.getByText("Parcel layer")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "پاک‌کردن جستجو و فیلترها" }));
    expect(getFiles).toHaveBeenLastCalledWith({ skip: 0, limit: 10 });
  });

  it("applies filter drafts only on submit and resets the page", async () => {
    getFiles.mockImplementation(({ skip, limit }) => {
      const response = {
        data: { items: [summary], pagination: { skip, limit, total: 31, hasMore: true } },
      };
      return { data: response, currentData: response, isFetching: false, refetch };
    });
    render(
      <MemoryRouter>
        <FileManagementDashboard />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: "صفحه بعد" }));
    fireEvent.click(screen.getByRole("button", { name: "فیلتر فایل‌ها" }));
    const type = await screen.findByRole("combobox", { name: "نوع فایل" });
    fireEvent.change(type, { target: { value: "geojson" } });
    fireEvent.change(screen.getByRole("combobox", { name: "خطاهای شناسایی‌شده" }), {
      target: { value: "false" },
    });
    fireEvent.change(screen.getByLabelText("بارگذاری از تاریخ"), {
      target: { value: "2026-09-01" },
    });
    fireEvent.change(screen.getByLabelText("بارگذاری تا تاریخ"), {
      target: { value: "2026-09-06" },
    });
    expect(getFiles).toHaveBeenLastCalledWith({ skip: 10, limit: 10 });
    fireEvent.click(screen.getByRole("button", { name: "اعمال فیلترها" }));
    expect(getFiles).toHaveBeenLastCalledWith({
      skip: 0,
      limit: 10,
      fileType: "geojson",
      hasIssues: false,
      uploadedFrom: new Date("2026-09-01T00:00:00").toISOString(),
      uploadedTo: new Date("2026-09-07T00:00:00").toISOString(),
    });
    fireEvent.click(screen.getByRole("button", { name: "صفحه بعد" }));
    expect(getFiles.mock.lastCall?.[0]).toMatchObject({
      skip: 10,
      fileType: "geojson",
      hasIssues: false,
    });
  });

  it("shows a filtered empty state and clears the filters", async () => {
    getFiles.mockImplementation((query) => {
      const filtered = !!query.fileType;
      const response = {
        data: {
          items: filtered ? [] : [summary],
          pagination: { skip: 0, limit: 10, total: filtered ? 0 : 1, hasMore: false },
        },
      };
      return { data: response, currentData: response, isFetching: false, refetch };
    });
    render(
      <MemoryRouter>
        <FileManagementDashboard />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: "فیلتر فایل‌ها" }));
    fireEvent.change(await screen.findByRole("combobox", { name: "نوع فایل" }), {
      target: { value: "kml" },
    });
    fireEvent.click(screen.getByRole("button", { name: "اعمال فیلترها" }));
    expect(screen.getByText("فایلی مطابق جستجو و فیلترها پیدا نشد")).toBeTruthy();
    expect(screen.queryByText("هنوز فایلی ندارید")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "پاک‌کردن جستجو و فیلترها" }));
    expect(screen.getByText("Parcel layer")).toBeTruthy();
  });
});
