// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MapWorkbench } from "./map-workbench";

const { healedOutput, loadHealedOutput, loadOriginalInput, previewGeoJson, getFile } = vi.hoisted(
  () => ({
    getFile: vi.fn(),
    healedOutput: {
      type: "FeatureCollection" as const,
      features: [],
    },
    loadHealedOutput: vi.fn(),
    loadOriginalInput: vi.fn(),
    previewGeoJson: vi.fn(),
  }),
);

vi.mock("@entities/map", () => ({
  MapCanvas: () => <div data-testid="map-canvas" />,
  useMapLibreMap: () => ({
    containerRef: { current: null },
    isMapReady: true,
    mapRef: {
      current: {
        resize: vi.fn(),
        getCenter: () => ({ lng: 51.389, lat: 35.689 }),
        getZoom: () => 11,
        on: vi.fn(),
        off: vi.fn(),
      },
    },
  }),
}));

vi.mock("@features/map-preview", () => ({
  useMapPreview: () => ({
    clearPreviewError: vi.fn(),
    isPreviewing: false,
    previewError: "",
    previewGeoJson,
    removePreview: vi.fn(),
  }),
}));

vi.mock("@features/topology", () => ({
  TopologyForm: () => <div />,
  useLazyGetHealedOutputQuery: () => [loadHealedOutput, { isFetching: false }],
  useLazyGetOriginalInputQuery: () => [loadOriginalInput, { isFetching: false }],
  useUpdateManualReviewMutation: () => [vi.fn(), { isLoading: false }],
  useManualReviewMarkers: vi.fn(),
  useOriginalGeometryOverlay: vi.fn(),
  useTopologyResultsMap: vi.fn(),
}));

vi.mock("@features/files", () => ({
  useGetUserFileQuery: (...args: unknown[]) => getFile(...args),
}));

describe("MapWorkbench saved healed output", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadHealedOutput.mockReturnValue({ unwrap: () => Promise.resolve(healedOutput) });
    loadOriginalInput.mockReturnValue({ unwrap: () => Promise.resolve(healedOutput) });
    previewGeoJson.mockResolvedValue(undefined);
    getFile.mockReturnValue({
      currentData: {
        data: {
          id: "19c53c73-b994-4723-abf1-ab2f87e05679",
          status: "completed",
          report: { issues: [{}] },
        },
      },
      refetch: vi.fn(),
    });
  });

  afterEach(cleanup);

  it.each(["dry-run-complete", "queued", "processing", "failed", "cancelled"])(
    "opens original geometry for %s without requesting unfinished output",
    async (status) => {
      getFile.mockReturnValue({ currentData: { data: { id: "file-1", status } } });
      render(
        <MemoryRouter initialEntries={["/map?healedFile=file-1&issue=0"]}>
          <MapWorkbench />
        </MemoryRouter>,
      );
      await waitFor(() => expect(previewGeoJson).toHaveBeenCalledWith(healedOutput));
      expect(loadOriginalInput).toHaveBeenCalledWith("file-1");
      expect(loadHealedOutput).not.toHaveBeenCalled();
      expect(screen.queryByRole("button", { name: "نمایش هندسه اصلی" })).toBeNull();
    },
  );

  it("waits for current file metadata, ignoring previously cached data", () => {
    getFile.mockReturnValue({
      data: { data: { id: "old-file", status: "completed" } },
      isFetching: true,
    });
    render(
      <MemoryRouter initialEntries={["/map?healedFile=file-1"]}>
        <MapWorkbench />
      </MemoryRouter>,
    );
    expect(loadOriginalInput).not.toHaveBeenCalled();
    expect(loadHealedOutput).not.toHaveBeenCalled();
  });

  it("switches to healed output when current file metadata becomes completed", async () => {
    getFile.mockReturnValue({ currentData: { data: { id: "file-1", status: "processing" } } });
    const view = () => (
      <MemoryRouter initialEntries={["/map?healedFile=file-1"]}>
        <MapWorkbench />
      </MemoryRouter>
    );
    const { rerender } = render(view());
    await waitFor(() => expect(loadOriginalInput).toHaveBeenCalledWith("file-1"));
    getFile.mockReturnValue({ currentData: { data: { id: "file-1", status: "completed" } } });
    rerender(view());
    await waitFor(() => expect(loadHealedOutput).toHaveBeenCalledWith("/heal/file-1/output"));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "نمایش هندسه اصلی" })).toBeTruthy(),
    );
  });

  it("can retry a failed metadata request without calling the output endpoint", () => {
    const refetch = vi.fn();
    getFile.mockReturnValue({ isError: true, refetch });
    render(
      <MemoryRouter initialEntries={["/map?healedFile=file-1"]}>
        <MapWorkbench />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: "تلاش دوباره" }));
    expect(refetch).toHaveBeenCalledOnce();
    expect(loadHealedOutput).not.toHaveBeenCalled();
  });

  it("loads and displays the healed file selected from the dashboard modal", async () => {
    const fileId = "19c53c73-b994-4723-abf1-ab2f87e05679";
    render(
      <MemoryRouter initialEntries={[`/map?healedFile=${fileId}&issue=0`]}>
        <MapWorkbench />
      </MemoryRouter>,
    );

    await waitFor(() => expect(loadHealedOutput).toHaveBeenCalledWith(`/heal/${fileId}/output`));
    expect(loadOriginalInput).not.toHaveBeenCalled();
    await waitFor(() => expect(previewGeoJson).toHaveBeenCalledWith(healedOutput));
    expect(screen.getByRole("button", { name: "نمایش هندسه اصلی" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "نمایش هندسه اصلی" }));
    await waitFor(() => expect(loadOriginalInput).toHaveBeenCalledWith(fileId));
    expect(screen.queryByTestId("review-panel")).toBeNull();
  });
});
