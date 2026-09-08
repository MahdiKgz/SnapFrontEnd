// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { HealedExportButton } from "./healed-export-button";

const { exportFile, downloadFile, status, abort } = vi.hoisted(() => ({
  exportFile: vi.fn(),
  downloadFile: vi.fn(),
  status: vi.fn(),
  abort: vi.fn(),
}));
vi.mock("../api/conversion-api", () => ({
  useExportHealedMutation: () => [exportFile, { isLoading: false }],
  useDownloadConversionMutation: () => [downloadFile, { isLoading: false }],
  useConversionJobStatus: status,
}));
const result = {
  kind: "download",
  filename: "converted.zip",
  url: "blob:export",
  report: { features: 1, sourceCRS: "EPSG:4326", targetCRS: "EPSG:32639", warnings: [] },
};
beforeEach(() => {
  status.mockReturnValue({});
  exportFile.mockReturnValue({ unwrap: async () => result, abort });
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  URL.revokeObjectURL = vi.fn();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});
it("asks for an output format and CRS before downloading, then sends only options to the server", async () => {
  render(<HealedExportButton jobId="healed-job" />);
  expect(exportFile).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "دانلود فایل ترمیم‌شده" }));
  expect(await screen.findByRole("dialog")).toBeTruthy();
  const format = screen.getByLabelText("فرمت فایل خروجی");
  expect(Array.from((format as HTMLSelectElement).options).map((option) => option.value)).toEqual([
    "geojson",
    "shapefile",
    "dxf",
  ]);
  fireEvent.change(format, { target: { value: "shapefile" } });
  fireEvent.change(screen.getByLabelText("سیستم مختصات مقصد"), { target: { value: "epsg:32639" } });
  fireEvent.click(screen.getByRole("button", { name: "ساخت و دانلود خروجی" }));
  await waitFor(() =>
    expect(exportFile).toHaveBeenCalledWith({
      jobId: "healed-job",
      targetFormat: "shapefile",
      targetCRS: "EPSG:32639",
    }),
  );
  await screen.findByRole("link", { name: "دریافت دوبارهٔ فایل" });
  expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledOnce();
  fireEvent.click(screen.getByRole("button", { name: "بستن انتخاب خروجی" }));
  await waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:export"));
});
it("validates the target CRS before sending the request", async () => {
  render(<HealedExportButton jobId="job" />);
  fireEvent.click(screen.getByRole("button", { name: "دانلود فایل ترمیم‌شده" }));
  fireEvent.change(await screen.findByLabelText("سیستم مختصات مقصد"), {
    target: { value: "invalid" },
  });
  fireEvent.click(screen.getByRole("button", { name: "ساخت و دانلود خروجی" }));
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect(exportFile).not.toHaveBeenCalled();
});
it("downloads a completed queued export through the authenticated conversion endpoint", async () => {
  exportFile.mockReturnValue({
    unwrap: async () => ({ success: true, data: { jobId: "export-job", status: "queued" } }),
    abort,
  });
  status.mockImplementation((id) =>
    id ? { currentData: { data: { status: "completed", result: result.report } } } : {},
  );
  downloadFile.mockReturnValue({ unwrap: async () => result, abort });
  render(<HealedExportButton jobId="job" />);
  fireEvent.click(screen.getByRole("button", { name: "دانلود فایل ترمیم‌شده" }));
  fireEvent.click(await screen.findByRole("button", { name: "ساخت و دانلود خروجی" }));
  fireEvent.click(await screen.findByRole("button", { name: "دانلود خروجی آماده" }));
  await waitFor(() => expect(downloadFile).toHaveBeenCalledWith("export-job"));
});
