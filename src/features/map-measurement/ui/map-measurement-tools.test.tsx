// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Map as MapLibreMap } from "maplibre-gl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MapMeasurementTools } from "./map-measurement-tools";

const { markers } = vi.hoisted(() => ({ markers: [] as FakeMarker[] }));
class FakeMarker {
  element: HTMLElement;
  constructor(options: { element?: HTMLElement }) {
    this.element = options.element ?? document.createElement("div");
    markers.push(this);
  }
  setLngLat = vi.fn(() => this);
  addTo = vi.fn(() => {
    document.body.append(this.element);
    return this;
  });
  getElement = () => this.element;
  remove = vi.fn(() => this.element.remove());
}
vi.mock("maplibre-gl", () => ({
  Marker: vi.fn(function (options) {
    return new FakeMarker(options);
  }),
}));

function setup() {
  const listeners = new Map<string, Set<(...args: any[]) => void>>();
  const sources = new Map<string, any>();
  const layers = new Map<string, any>();
  const canvas = document.createElement("canvas");
  const map = {
    getCanvas: () => canvas,
    doubleClickZoom: { isEnabled: () => true, disable: vi.fn(), enable: vi.fn() },
    addSource: vi.fn((id, source) => sources.set(id, { ...source, setData: vi.fn() })),
    getSource: vi.fn((id) => sources.get(id)),
    removeSource: vi.fn((id) => sources.delete(id)),
    addLayer: vi.fn((layer) => layers.set(layer.id, layer)),
    getLayer: vi.fn((id) => layers.get(id)),
    removeLayer: vi.fn((id) => layers.delete(id)),
    on: vi.fn((event, handler) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(handler);
    }),
    off: vi.fn((event, handler) => listeners.get(event)?.delete(handler)),
    project: vi.fn(([lng, lat]) => ({ x: lng * 10, y: lat * 10 })),
    unproject: vi.fn(([x, y]) => ({ lng: x / 10, lat: y / 10 })),
    queryRenderedFeatures: vi.fn(() => [] as any[]),
  };
  const mapRef = { current: map as unknown as MapLibreMap | null };
  const view = render(<MapMeasurementTools mapRef={mapRef} isMapReady onActiveChange={vi.fn()} />);
  const emit = (event: string, value?: unknown) =>
    act(() => {
      listeners.get(event)?.forEach((handler) => handler(value));
    });
  const click = (lng: number, lat: number) =>
    emit("click", { lngLat: { lng, lat }, point: { x: lng, y: lat } });
  return { ...view, map, mapRef, click, emit, sources, layers, listeners };
}

describe("map measurement tools", () => {
  beforeEach(() => {
    markers.length = 0;
  });
  afterEach(cleanup);

  it("converts the current result and HTML label without resetting the dashed measurement", async () => {
    const { click, map, layers, emit } = setup();
    fireEvent.click(screen.getByRole("button", { name: "اندازه‌گیری طول" }));
    click(0, 0);
    click(1, 0);
    expect(layers.get("snapgis-measurement-line").paint["line-dasharray"]).toEqual([2, 2]);
    expect(screen.getByRole("status").textContent).toContain("۱۱۱٫۱۹۵ km");
    const label = markers.find((marker) => marker.element.textContent.includes("km"))!;
    expect(label.setLngLat).toHaveBeenLastCalledWith({ lng: 0.5, lat: 0 });
    emit("move");
    expect(label.setLngLat).toHaveBeenCalledTimes(2);

    fireEvent.click(screen.getByRole("button", { name: "تنظیم واحد اندازه‌گیری" }));
    const length = await screen.findByRole("combobox", { name: "طول و محیط" });
    fireEvent.change(length, { target: { value: "m" } });
    expect(screen.getByRole("status").textContent).toContain("۱۱۱٬۱۹۵ m");
    expect(document.querySelector('[aria-label="طول اندازه‌گیری‌شده: ۱۱۱٬۱۹۵ m"]')).toBeTruthy();
    expect(map.addSource).toHaveBeenCalledTimes(1);
    expect(label.remove).toHaveBeenCalledOnce();
    expect(markers[0].remove).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "بستن تنظیمات" }));
    fireEvent.click(screen.getByRole("button", { name: "شروع دوباره" }));
    expect(document.querySelector('[aria-label^="طول اندازه‌گیری‌شده:"]')).toBeNull();
    expect(markers.every((marker) => marker.remove.mock.calls.length > 0)).toBe(true);
  });

  it("applies area units to a full feature and shares length units with perimeter", async () => {
    const { click, map, sources } = setup();
    fireEvent.click(screen.getByRole("button", { name: "تنظیم واحد اندازه‌گیری" }));
    fireEvent.change(await screen.findByRole("combobox", { name: "مساحت" }), {
      target: { value: "ha" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "طول و محیط" }), {
      target: { value: "ft" },
    });
    fireEvent.click(screen.getByRole("button", { name: "بستن تنظیمات" }));
    const feature = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
            [0, 0],
          ],
        ],
      },
    };
    sources.set("uploaded-file", { type: "geojson", getData: async () => feature });
    map.queryRenderedFeatures.mockReturnValue([{ ...feature, source: "uploaded-file" }]);
    fireEvent.click(screen.getByRole("button", { name: "اندازه‌گیری مساحت" }));
    click(0.5, 0.5);
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("ha"));
    expect(screen.getByRole("img", { name: "محل انتخاب عارضه برای اندازه‌گیری" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "اندازه‌گیری محیط" }));
    click(0.5, 0.5);
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("ft"));
    expect(document.querySelector('[aria-label^="طول اندازه‌گیری‌شده:"]')).toBeNull();
  });

  it("cleans up the label when the map owner has already removed the map", () => {
    const { click, map, mapRef, unmount, listeners } = setup();
    fireEvent.click(screen.getByRole("button", { name: "اندازه‌گیری طول" }));
    click(0, 0);
    click(1, 0);
    mapRef.current = null;
    map.getLayer.mockImplementation(() => {
      throw new Error("map removed");
    });
    expect(unmount).not.toThrow();
    expect(markers.every((marker) => marker.remove.mock.calls.length > 0)).toBe(true);
    expect(listeners.get("move")?.size).toBe(0);
    expect(listeners.get("click")?.size).toBe(0);
  });
});
