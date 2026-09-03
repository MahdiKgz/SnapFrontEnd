// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
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
          result: {
            repairs: { duplicateVerticesRemoved: 2 },
          },
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

    fireEvent.click(within(dialog).getByRole("button", { name: "بستن" }));
    expect(dialog.className).toContain("animate-out");
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "جزئیات فایل" })).toBeNull());
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
