// @vitest-environment jsdom
import { renderHook } from "@testing-library/react";
import type { Map as MapLibreMap } from "maplibre-gl";
import { describe, expect, it, vi } from "vitest";

import type { AffectedFeatureCollection, TopologyIssue } from "./types";
import { useReviewIssueFocus } from "./use-healed-review-map";

const issue: TopologyIssue = {
  issueIndex: 42,
  check: "spikes",
  code: "SPIKE",
  featureIndex: 7,
  featureId: "parcel-1",
  geometryType: "Polygon",
  disposition: "ManualReview",
  details: {},
  location: {
    geometryCollectionPath: [],
    coordinatePath: null,
    relatedCoordinatePath: null,
    polygonPath: null,
    relatedPolygonPath: null,
  },
};
const source: AffectedFeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      snapgisFeatureIndex: 7,
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [51, 35],
            [52, 35],
            [52, 36],
            [51, 35],
          ],
        ],
      },
    },
  ],
};

function renderFocus(selectedIssueIndex: number | null, isMapReady = true) {
  const map = {
    addSource: vi.fn(),
    addLayer: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    getLayer: vi.fn(),
    getSource: vi.fn(),
    setPaintProperty: vi.fn(),
    flyTo: vi.fn(),
    fitBounds: vi.fn(),
  };
  const result = renderHook(() =>
    useReviewIssueFocus({
      data: source,
      issues: [issue],
      isMapReady,
      mapRef: { current: map as unknown as MapLibreMap },
      selectedIssueIndex,
    }),
  );
  return { map, ...result };
}

describe("saved issue geometry focus", () => {
  it("does not create synthetic points when opening a saved file", () => {
    const { map } = renderFocus(null);
    expect(map.addSource).not.toHaveBeenCalled();
    expect(map.addLayer).not.toHaveBeenCalled();
  });
  it("focuses the actual feature extent for a stable paginated issue index", () => {
    const { map } = renderFocus(42);
    expect(map.fitBounds).toHaveBeenCalledWith(
      [
        [51, 35],
        [52, 36],
      ],
      expect.objectContaining({ maxZoom: 17 }),
    );
    expect(map.addSource).not.toHaveBeenCalled();
  });
  it("waits until the output and map are ready", () => {
    const { map } = renderFocus(42, false);
    expect(map.fitBounds).not.toHaveBeenCalled();
    expect(map.flyTo).not.toHaveBeenCalled();
  });
  it("ignores an issue absent from the saved report", () => {
    const { map } = renderFocus(99);
    expect(map.fitBounds).not.toHaveBeenCalled();
  });
});
