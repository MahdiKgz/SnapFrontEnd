// @vitest-environment jsdom
import type { RefObject } from "react";

import { renderHook } from "@testing-library/react";
import type { Map as MapLibreMap } from "maplibre-gl";
import { describe, expect, it, vi } from "vitest";

import type { AffectedFeatureCollection } from "./types";
import { useTopologyResultsMap } from "./use-topology-results-map";

const affectedFeatures: AffectedFeatureCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      id: "parcel-five",
      properties: { name: "Parcel Five" },
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
      snapgisFeatureIndex: 5,
    },
    {
      type: "Feature",
      id: "parcel-seven",
      properties: { name: "Parcel Seven" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [53, 35],
            [54, 35],
            [54, 36],
            [53, 35],
          ],
        ],
      },
      snapgisFeatureIndex: 7,
    },
  ],
};

describe("useTopologyResultsMap", () => {
  it("updates the selected source and flies to every feature in the selected issue group", () => {
    const sources = new Map<string, ReturnType<typeof vi.fn>>();
    const layers = new Set<string>();
    const layerPaint = new Map<string, Record<string, unknown>>();
    const flyTo = vi.fn();

    const map = {
      addLayer: (layer: { id: string; paint?: Record<string, unknown> }) => {
        layers.add(layer.id);
        layerPaint.set(layer.id, layer.paint ?? {});
      },
      addSource: (id: string) => sources.set(id, vi.fn()),
      cameraForBounds: () => ({
        center: [51.5, 35.5],
        zoom: 16,
        bearing: 0,
      }),
      flyTo,
      getLayer: (id: string) => (layers.has(id) ? { id } : undefined),
      getSource: (id: string) => {
        const setData = sources.get(id);
        return setData ? { setData } : undefined;
      },
      getZoom: () => 12,
      isStyleLoaded: () => true,
      off: vi.fn(),
      once: vi.fn(),
      removeLayer: (id: string) => layers.delete(id),
      removeSource: (id: string) => sources.delete(id),
    } as unknown as MapLibreMap;
    const mapRef = { current: map } as RefObject<MapLibreMap | null>;

    const { rerender } = renderHook(
      ({ selectedFeatureIndexes }: { selectedFeatureIndexes: number[] }) =>
        useTopologyResultsMap({
          affectedFeatures,
          mapRef,
          selectedFeatureIndexes,
        }),
      {
        initialProps: { selectedFeatureIndexes: [] },
      },
    );

    rerender({ selectedFeatureIndexes: [5, 7] });

    const setSelectedData = sources.get("topology-selected-feature");
    expect(setSelectedData).toHaveBeenLastCalledWith(
      expect.objectContaining({
        features: [
          expect.objectContaining({ id: "parcel-five" }),
          expect.objectContaining({ id: "parcel-seven" }),
        ],
      }),
    );
    expect(flyTo).toHaveBeenCalledWith(
      expect.objectContaining({
        duration: 900,
        essential: true,
        zoom: 16,
      }),
    );
    expect(layerPaint.get("topology-selected-line")?.["line-color"]).toBe("#7f1d1d");
  });
});
