// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { FeatureCollection } from "geojson";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MapWorkbench } from "./map-workbench";

const { sources, layers, map, mapRef, getFile, loadOutput, loadOriginal, output, report } =
  vi.hoisted(() => {
    const polygon = {
      type: "Polygon" as const,
      coordinates: [
        [
          [51, 35],
          [52, 35],
          [52, 36],
          [51, 35],
        ],
      ],
    };
    const output: FeatureCollection = {
      type: "FeatureCollection",
      features: [
        { type: "Feature", id: "repaired-parcel", properties: {}, geometry: polygon },
        {
          type: "Feature",
          id: "survey-point",
          properties: {},
          geometry: { type: "Point", coordinates: [53, 37] },
        },
      ],
    };
    const report = {
      affectedFeatureCollection: {
        type: "FeatureCollection",
        features: [{ ...output.features[0], snapgisFeatureIndex: 7 }],
      },
      issues: [{ issueIndex: 42, featureIndex: 7, disposition: "ManualReview" }],
    };
    const sources = new Map<
      string,
      { data: FeatureCollection; setData: (data: FeatureCollection) => void }
    >();
    const layers = new Map<string, unknown>();
    const map = {
      resize: vi.fn(),
      getCenter: () => ({ lng: 51, lat: 35 }),
      getZoom: () => 11,
      on: vi.fn(),
      off: vi.fn(),
      isStyleLoaded: () => true,
      fitBounds: vi.fn(),
      addSource: vi.fn((id: string, { data }: { data: FeatureCollection }) => {
        const source = {
          data,
          setData: (next: FeatureCollection) => {
            source.data = next;
          },
        };
        sources.set(id, source);
      }),
      getSource: (id: string) => sources.get(id),
      removeSource: (id: string) => sources.delete(id),
      addLayer: vi.fn((layer: { id: string }) => layers.set(layer.id, layer)),
      getLayer: (id: string) => layers.get(id),
      removeLayer: (id: string) => layers.delete(id),
    };
    return {
      sources,
      layers,
      map,
      mapRef: { current: map },
      output,
      report,
      getFile: vi.fn(),
      loadOutput: vi.fn(),
      loadOriginal: vi.fn(),
    };
  });
vi.mock("@entities/map", () => ({
  MapCanvas: () => <div />,
  useMapLibreMap: () => ({ containerRef: { current: null }, isMapReady: true, mapRef }),
}));
vi.mock("@features/basemap", () => ({ BasemapPicker: () => null }));
vi.mock("@features/feature-inspection", () => ({ FeatureInspectionPanel: () => null }));
vi.mock("@features/map-measurement", () => ({ MapMeasurementTools: () => null }));
vi.mock("@features/files", () => ({
  useGetUserFileQuery: (...args: unknown[]) => getFile(...args),
}));
vi.mock("@features/topology", async () => {
  const { useReviewIssueFocus, useOriginalGeometryOverlay } =
    await import("../../../features/topology/model/use-healed-review-map");
  return {
    useReviewIssueFocus,
    useOriginalGeometryOverlay,
    useTopologyResultsMap: vi.fn(),
    CadImportNotice: () => null,
    useLazyGetHealedOutputQuery: () => [loadOutput, { isFetching: false }],
    useLazyGetOriginalInputQuery: () => [loadOriginal, { isFetching: false }],
    TopologyForm: ({
      onHealingComplete,
    }: {
      onHealingComplete: (data: FeatureCollection) => Promise<void>;
    }) => <button onClick={() => void onHealingComplete(output)}>Apply repaired upload</button>,
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  sources.clear();
  layers.clear();
  getFile.mockReturnValue({ currentData: { data: { id: "saved", status: "completed", report } } });
  loadOutput.mockReturnValue({ unwrap: () => Promise.resolve(output) });
});
afterEach(cleanup);

describe("healed geometry rendering", () => {
  it("renders the completed upload geometry and preserves only genuine input points", async () => {
    render(
      <MemoryRouter initialEntries={["/map"]}>
        <MapWorkbench />
      </MemoryRouter>,
    );
    fireEvent.click(screen.getByRole("button", { name: "Apply repaired upload", hidden: true }));
    await waitFor(() => expect(sources.get("uploaded-file")?.data).toEqual(output));
    expect(sources.size).toBe(1);
    expect(
      sources.get("uploaded-file")?.data.features.map((feature) => feature.geometry?.type),
    ).toEqual(["Polygon", "Point"]);
    expect(layers.has("uploaded-file-fill")).toBe(true);
    expect(layers.has("uploaded-file-line")).toBe(true);
  });
  it("reopens saved healed geometry and focuses its full extent after preview without creating centroids", async () => {
    render(
      <MemoryRouter initialEntries={["/map?healedFile=saved&issue=42"]}>
        <MapWorkbench />
      </MemoryRouter>,
    );
    await waitFor(() => expect(sources.get("uploaded-file")?.data).toEqual(output));
    await waitFor(() =>
      expect(map.fitBounds).toHaveBeenLastCalledWith(
        [
          [51, 35],
          [52, 36],
        ],
        expect.objectContaining({ maxZoom: 17 }),
      ),
    );
    expect(loadOutput).toHaveBeenCalledWith("/heal/saved/output");
    expect(sources.size).toBe(1);
    expect(layers.size).toBe(3);
    expect(sources.has("snapgis-manual-review")).toBe(false);
  });
});
