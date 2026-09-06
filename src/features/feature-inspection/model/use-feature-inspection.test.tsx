// @vitest-environment jsdom
import {
  act,
  cleanup,
  fireEvent,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import type { Feature, FeatureCollection, Polygon } from "geojson";
import type { LayerSpecification, Map as MapLibreMap, MapMouseEvent } from "maplibre-gl";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FeatureInspectionPanel } from "../ui/feature-inspection-panel";
import { useFeatureInspection } from "./use-feature-inspection";

const { markers } = vi.hoisted(() => ({ markers: [] as FakeMarker[] }));
class FakeMarker {
  element: HTMLElement;
  constructor({ element }: { element: HTMLElement }) {
    this.element = element;
    markers.push(this);
  }
  setLngLat = vi.fn(() => this);
  addTo = vi.fn(() => {
    document.body.append(this.element);
    return this;
  });
  remove = vi.fn(() => this.element.remove());
}
vi.mock("maplibre-gl", () => ({
  Marker: vi.fn(function (options) {
    return new FakeMarker(options);
  }),
}));

const polygon = (x: number, id: string, size = 0.001): Feature<Polygon> => ({
  type: "Feature",
  id,
  properties: { name: id },
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [x, 0],
        [x + size, 0],
        [x + size, size],
        [x, size],
        [x, 0],
      ],
    ],
  },
});
const features = [polygon(0, "A"), polygon(0.002, "B", 0.002), polygon(0.05, "C")];
const dataset: FeatureCollection = { type: "FeatureCollection", features };
function fakeMap() {
  type Source = {
    type: string;
    data?: Feature | FeatureCollection;
    setData: ReturnType<typeof vi.fn>;
    getData?: ReturnType<typeof vi.fn>;
  };
  const sources = new Map<string, Source>();
  const layers = new Map<string, LayerSpecification>();
  const listeners = new Map<string, (event: MapMouseEvent) => void>();
  const source = { type: "geojson", getData: vi.fn(async () => dataset), setData: vi.fn() };
  sources.set("uploaded-file", source);
  const map = {
    on: vi.fn((event, listener) => listeners.set(event, listener)),
    off: vi.fn((event) => listeners.delete(event)),
    queryRenderedFeatures: vi.fn(({ x }: { x: number }) =>
      features[x] ? [{ ...features[x], source: "uploaded-file" }] : [],
    ),
    unproject: () => ({ lng: 0, lat: 0 }),
    getSource: vi.fn((id: string) => sources.get(id)),
    addSource: vi.fn((id: string, spec: { type: string; data: Feature | FeatureCollection }) => {
      const added: Source = {
        ...spec,
        setData: vi.fn((data) => {
          added.data = data;
        }),
      };
      sources.set(id, added);
    }),
    removeSource: vi.fn((id: string) => sources.delete(id)),
    getLayer: vi.fn((id: string) => layers.get(id)),
    addLayer: vi.fn((layer: LayerSpecification) => layers.set(layer.id, layer)),
    removeLayer: vi.fn((id: string) => layers.delete(id)),
    getStyle: () => ({
      layers: [{ id: "uploaded", source: "uploaded-file", type: "fill" }, ...layers.values()],
    }),
  };
  const mapRef = { current: map as unknown as MapLibreMap | null };
  const click = (index: number) => {
    const coordinate = features[index]?.geometry.coordinates[0][0] ?? [2, 2];
    act(() =>
      listeners.get("click")?.({
        point: { x: index, y: 0 },
        lngLat: { lng: coordinate[0] + 0.0002, lat: coordinate[1] + 0.0002 },
      } as MapMouseEvent),
    );
  };
  return { map, mapRef, source, sources, click };
}
function setup() {
  const map = fakeMap();
  const hook = renderHook(() =>
    useFeatureInspection({ mapRef: map.mapRef, isMapReady: true, enabled: true }),
  );
  return { ...map, ...hook };
}
afterEach(() => {
  cleanup();
  markers.length = 0;
});

describe("two-feature inspection", () => {
  it("keeps two full features with distinct colors, rejects a third, and allows replacing a removed selection", async () => {
    const { click, result, sources } = setup();
    click(0);
    click(1);
    await waitFor(() => expect(result.current.inspections).toHaveLength(2));
    expect(result.current.inspections.map((item) => item.entry.feature.id)).toEqual(["A", "B"]);
    const data = sources.get("snapgis-feature-inspection")!.data as FeatureCollection;
    expect(data.features.map((feature) => feature.properties?.__inspectionColor)).toEqual([
      "#f97316",
      "#0ea5e9",
    ]);
    click(2);
    await waitFor(() => expect(result.current.notice).toContain("حداکثر دو"));
    expect(result.current.inspections.map((item) => item.entry.feature.id)).toEqual(["A", "B"]);
    act(() => result.current.removeInspection(result.current.inspections[0].key));
    click(2);
    await waitFor(() =>
      expect(result.current.inspections.map((item) => item.entry.feature.id)).toEqual(["B", "C"]),
    );
    expect(result.current.inspections.map((item) => item.slot)).toEqual([1, 0]);
  });

  it("toggles an already selected feature instead of adding a duplicate, and preserves selection on empty map clicks", async () => {
    const { click, result } = setup();
    click(0);
    click(1);
    await waitFor(() => expect(result.current.inspections).toHaveLength(2));
    click(0);
    await waitFor(() => expect(result.current.inspections).toHaveLength(1));
    expect(result.current.inspection?.entry.feature.id).toBe("B");
    click(-1);
    await act(async () => {});
    expect(result.current.inspections).toHaveLength(1);
  });

  it("preserves rapid clicks while source data is still loading", async () => {
    const { click, result, source } = setup();
    let resolve!: (data: FeatureCollection) => void;
    source.getData.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    click(0);
    click(1);
    click(2);
    await waitFor(() => expect(source.getData).toHaveBeenCalledOnce());
    await act(async () => resolve(dataset));
    await waitFor(() => expect(result.current.notice).toContain("حداکثر دو"));
    expect(result.current.inspections.map((item) => item.entry.feature.id)).toEqual(["A", "B"]);
  });

  it("does not restore a closed selection from a delayed request", async () => {
    const { click, result, source, map } = setup();
    let resolve!: (data: FeatureCollection) => void;
    source.getData.mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    click(0);
    await waitFor(() => expect(source.getData).toHaveBeenCalledOnce());
    act(() => result.current.close());
    await act(async () => resolve(dataset));
    expect(result.current.inspections).toHaveLength(0);
    expect(map.addSource).not.toHaveBeenCalled();
  });

  it("removes markers and overlays safely after the map owner has removed the map", async () => {
    const { click, result, mapRef, map, unmount } = setup();
    click(0);
    click(1);
    await waitFor(() => expect(result.current.inspections).toHaveLength(2));
    act(() => result.current.selectVertex(result.current.inspection!.summary.vertices[0], 0));
    mapRef.current = null;
    map.getLayer.mockImplementation(() => {
      throw new Error("map removed");
    });
    expect(unmount).not.toThrow();
    expect(markers[0].remove).toHaveBeenCalledOnce();
  });

  it("switches vertex details between the two selected features and keeps comparison units LTR", async () => {
    const { mapRef, click } = fakeMap();
    render(<FeatureInspectionPanel mapRef={mapRef} isMapReady />);
    click(0);
    click(1);
    const table = await screen.findByRole("table", { name: "مقایسه دو عارضه" });
    expect(table.textContent).toContain("m²");
    expect(Array.from(table.querySelectorAll("bdi")).every((el) => el.dir === "ltr")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: /مختصات رأس/ }));
    fireEvent.click(await screen.findByRole("button", { name: "نمایش رأس 1" }));
    expect(markers.at(-1)!.setLngLat).toHaveBeenLastCalledWith([0.002, 0]);
    fireEvent.click(screen.getByRole("button", { name: "جزئیات عارضه ۱: A" }));
    expect(markers.at(-1)!.remove).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: /مختصات رأس/ }));
    fireEvent.click(await screen.findByRole("button", { name: "نمایش رأس 1" }));
    expect(markers.at(-1)!.setLngLat).toHaveBeenLastCalledWith([0, 0]);
  });
});
