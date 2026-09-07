// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ConversionPage from "./conversion-page";

const mocks = vi.hoisted(() => ({
  convert: vi.fn(),
  download: vi.fn(),
  status: {} as { currentData?: unknown; error?: unknown },
  refetch: vi.fn(),
}));
vi.mock("../api/conversion-api", () => ({
  useConvertFileMutation: () => [mocks.convert, { isLoading: false }],
  useDownloadConversionMutation: () => [mocks.download, { isLoading: false }],
  useConversionJobStatus: () => ({ ...mocks.status, refetch: mocks.refetch }),
}));
const report = { features: 1, sourceCRS: "EPSG:4326", targetCRS: "EPSG:32639", warnings: [] };
const finished = { kind: "download", url: "blob:converted", filename: "converted.zip", report };
const chooseFile = (name = "parcels.geojson") => {
  fireEvent.change(screen.getByLabelText("فایل ورودی"), {
    target: { files: [new File(["{}"], name)] },
  });
};
beforeEach(() => {
  mocks.status = {};
  mocks.convert.mockReset();
  mocks.download.mockReset();
  mocks.refetch.mockReset();
  mocks.convert.mockReturnValue({ unwrap: async () => finished, abort: vi.fn() });
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  vi.stubGlobal("URL", Object.assign(URL, { revokeObjectURL: vi.fn() }));
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("standalone conversion form", () => {
  it("requires a DXF source CRS before sending a file", async () => {
    render(<ConversionPage />);
    chooseFile("drawing.dxf");
    fireEvent.click(screen.getByRole("button", { name: "تبدیل و دریافت فایل" }));
    expect(screen.getByRole("alert").textContent).toContain("سیستم مختصات مبدأ");
    expect(mocks.convert).not.toHaveBeenCalled();
    fireEvent.change(screen.getByLabelText(/سیستم مختصات مبدأ/), {
      target: { value: "EPSG:32639" },
    });
    fireEvent.click(screen.getByRole("button", { name: "تبدیل و دریافت فایل" }));
    await waitFor(() => expect(mocks.convert).toHaveBeenCalledOnce());
  });
  it("uploads options without parsing the file locally and offers a server-generated download", async () => {
    render(<ConversionPage />);
    chooseFile();
    fireEvent.change(screen.getByLabelText("فرمت خروجی"), { target: { value: "shapefile" } });
    fireEvent.change(screen.getByLabelText("سیستم مختصات مقصد (اختیاری)"), {
      target: { value: "epsg:32639" },
    });
    fireEvent.click(screen.getByRole("button", { name: "تبدیل و دریافت فایل" }));
    await screen.findByRole("link", { name: "دریافت دوباره" });
    const form = mocks.convert.mock.calls[0][0] as FormData;
    expect(form.get("targetFormat")).toBe("shapefile");
    expect(form.get("targetCRS")).toBe("EPSG:32639");
    expect(form.has("sourceCRS")).toBe(false);
    expect(form.get("file")).toBeInstanceOf(File);
    expect(screen.getByRole("link", { name: "دریافت دوباره" }).getAttribute("download")).toBe(
      "converted.zip",
    );
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledOnce();
    cleanup();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:converted");
  });
  it("does not show a download when conversion fails", async () => {
    mocks.convert.mockReturnValue({
      unwrap: async () => {
        throw { data: { code: "INVALID_SOURCE_CRS" } };
      },
      abort: vi.fn(),
    });
    render(<ConversionPage />);
    chooseFile();
    fireEvent.click(screen.getByRole("button", { name: "تبدیل و دریافت فایل" }));
    expect((await screen.findByRole("alert")).textContent).toContain(
      "سیستم مختصات مبدأ معتبر نیست",
    );
    expect(screen.queryByRole("link", { name: "دریافت دوباره" })).toBeNull();
  });
  it("handles a queued job with plain status and a download button when ready", async () => {
    mocks.convert.mockReturnValue({
      unwrap: async () => ({ success: true, data: { jobId: "test-job", status: "queued" } }),
      abort: vi.fn(),
    });
    mocks.download.mockReturnValue({ unwrap: async () => finished, abort: vi.fn() });
    const view = render(<ConversionPage />);
    chooseFile();
    fireEvent.click(screen.getByRole("button", { name: "تبدیل و دریافت فایل" }));
    await screen.findByRole("status");
    expect(screen.queryByRole("button", { name: "دانلود خروجی" })).toBeNull();
    mocks.status = {
      currentData: {
        success: true,
        data: { jobId: "test-job", status: "completed", result: report },
      },
    };
    view.rerender(<ConversionPage />);
    fireEvent.click(await screen.findByRole("button", { name: "دانلود خروجی" }));
    await screen.findByRole("link", { name: "دریافت دوباره" });
    expect(mocks.download).toHaveBeenCalledWith("test-job");
  });
  it("aborts requests on unmount and releases a download that arrives late", async () => {
    let resolve: (result: unknown) => void = () => {};
    const abort = vi.fn();
    mocks.convert.mockReturnValue({
      unwrap: () =>
        new Promise((done) => {
          resolve = done;
        }),
      abort,
    });
    const view = render(<ConversionPage />);
    chooseFile();
    fireEvent.click(screen.getByRole("button", { name: "تبدیل و دریافت فایل" }));
    view.unmount();
    expect(abort).toHaveBeenCalledOnce();
    await act(async () => resolve(finished));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:converted");
    expect(HTMLAnchorElement.prototype.click).not.toHaveBeenCalled();
  });
});
