// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MapWorkbench } from "./map-workbench";

const { healedOutput, loadHealedOutput, loadOriginalInput, previewGeoJson } = vi.hoisted(() => ({
  healedOutput: {
    type: "FeatureCollection" as const,
    features: [],
  },
  loadHealedOutput: vi.fn(),
  loadOriginalInput: vi.fn(),
  previewGeoJson: vi.fn(),
}));

vi.mock("@/entities/map", () => ({
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

vi.mock("@/features/map-preview", () => ({
  useMapPreview: () => ({
    clearPreviewError: vi.fn(),
    isPreviewing: false,
    previewError: "",
    previewFile: vi.fn(),
    previewGeoJson,
    removePreview: vi.fn(),
  }),
}));

vi.mock("@/features/topology", () => ({
  TopologyForm: () => <div />,
  useLazyGetHealedOutputQuery: () => [loadHealedOutput, { isFetching: false }],
  useLazyGetOriginalInputQuery: () => [loadOriginalInput, { isFetching: false }],
  useUpdateManualReviewMutation: () => [vi.fn(), { isLoading: false }],
  useTopologyResultsMap: vi.fn(),
}));

vi.mock("@/features/files", () => ({
  useGetUserFileQuery: () => ({ data: undefined, refetch: vi.fn() }),
}));

vi.mock("@/features/topology/model/use-healed-review-map", () => ({
  getIssueCoordinate: vi.fn(),
  useManualReviewMarkers: vi.fn(),
  useOriginalGeometryOverlay: vi.fn(),
}));

describe("MapWorkbench saved healed output", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadHealedOutput.mockReturnValue({ unwrap: () => Promise.resolve(healedOutput) });
    loadOriginalInput.mockReturnValue({ unwrap: () => Promise.resolve(healedOutput) });
    previewGeoJson.mockResolvedValue(undefined);
  });

  afterEach(cleanup);

  it("loads and displays the healed file selected from the dashboard modal", async () => {
    const fileId = "19c53c73-b994-4723-abf1-ab2f87e05679";
    render(
      <MemoryRouter initialEntries={[`/map?healedFile=${fileId}`]}>
        <MapWorkbench />
      </MemoryRouter>,
    );

    await waitFor(() => expect(loadHealedOutput).toHaveBeenCalledWith(`/heal/${fileId}/output`));
    expect(loadOriginalInput).toHaveBeenCalledWith(fileId);
    await waitFor(() => expect(previewGeoJson).toHaveBeenCalledWith(healedOutput));
    expect(screen.getByRole("button", { name: "نمایش هندسه اصلی" })).toBeTruthy();
  });
});
