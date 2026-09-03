// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FileManagementDashboard } from "./file-management-dashboard";

const { deleteFile, refetch, renameFile } = vi.hoisted(() => ({
  deleteFile: vi.fn(),
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
  useGetUserFilesQuery: () => ({
    data: {
      success: true,
      data: {
        items: [summary],
        pagination: { skip: 0, limit: 10, total: 1, hasMore: false },
      },
    },
    isError: false,
    isFetching: false,
    refetch,
  }),
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

describe("FileManagementDashboard", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
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
    expect(deleteFile).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "بله، حذف شود" }));
    await waitFor(() => expect(deleteFile).toHaveBeenCalledWith(summary.id));
  });
});
