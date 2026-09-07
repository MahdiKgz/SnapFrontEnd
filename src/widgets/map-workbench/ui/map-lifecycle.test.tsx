// @vitest-environment jsdom
import { useState } from "react";

import { useMapLibreMap } from "@/entities/map/model/use-maplibre-map";
import type { AffectedFeatureCollection } from "@/features/topology/model/types";
import {
  useManualReviewMarkers,
  useOriginalGeometryOverlay,
} from "@/features/topology/model/use-healed-review-map";
import { useTopologyResultsMap } from "@/features/topology/model/use-topology-results-map";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { maps } = vi.hoisted(() => ({ maps: [] as FakeMap[] }));

class FakeMap {
  layers = new Set<string>();
  sources = new Map<string, { setData: ReturnType<typeof vi.fn> }>();
  listeners = new Map<string, () => void>();
  removed = false;

  constructor() {
    maps.push(this);
  }

  addControl = vi.fn();
  on = vi.fn();
  off = vi.fn((event: string) => this.listeners.delete(event));
  once = vi.fn((event: string, callback: () => void) => this.listeners.set(event, callback));
  getLayer = vi.fn((id: string) => {
    if (this.removed) throw new Error("Cannot read properties of undefined (reading 'getLayer')");
    return this.layers.has(id) ? { id } : undefined;
  });
  getSource = vi.fn((id: string) => {
    if (this.removed) throw new Error("Cannot read properties of undefined (reading 'getSource')");
    return this.sources.get(id);
  });
  setPaintProperty = vi.fn();
  addLayer = vi.fn(({ id }: { id: string }) => this.layers.add(id));
  addSource = vi.fn((id: string) => this.sources.set(id, { setData: vi.fn() }));
  removeLayer = vi.fn((id: string) => this.layers.delete(id));
  removeSource = vi.fn((id: string) => this.sources.delete(id));
  remove = vi.fn(() => {
    this.removed = true;
    this.layers.clear();
    this.sources.clear();
  });
}

vi.mock("maplibre-gl", () => ({
  default: {
    Map: vi.fn(function () {
      return new FakeMap();
    }),
    NavigationControl: class {},
    AttributionControl: class {},
  },
}));

const data: AffectedFeatureCollection = { type: "FeatureCollection", features: [] };
const issues: [] = [];
const selectedFeatureIndexes: number[] = [];
const onSelectIssue = vi.fn();

function MapWithOverlays() {
  const { containerRef, isMapReady, mapRef } = useMapLibreMap();
  const [visible, setVisible] = useState(true);
  useTopologyResultsMap({
    affectedFeatures: visible ? data : null,
    isMapReady,
    mapRef,
    selectedFeatureIndexes,
  });
  useOriginalGeometryOverlay({ data, isMapReady, mapRef, visible });
  useManualReviewMarkers({
    data: visible ? data : null,
    isMapReady,
    mapRef,
    issues,
    onSelectIssue,
    selectedIssueIndex: null,
  });

  return (
    <>
      <div ref={containerRef} />
      <button type="button" onClick={() => setVisible((value) => !value)}>
        Toggle overlays
      </button>
      <Link to="/dashboard">Dashboard</Link>
    </>
  );
}

function renderMapRoute() {
  return render(
    <MemoryRouter initialEntries={["/map"]}>
      <Routes>
        <Route path="/map" element={<MapWithOverlays />} />
        <Route path="/dashboard" element={<Link to="/map">Return to map</Link>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("map overlay lifecycle", () => {
  beforeEach(() => {
    maps.length = 0;
  });
  afterEach(cleanup);

  it("navigates to the dashboard and back without accessing a removed map", () => {
    renderMapRoute();
    const firstMap = maps[0];
    act(() => firstMap.listeners.get("load")?.());
    expect(firstMap.layers.size).toBe(10);

    fireEvent.click(screen.getByRole("link", { name: "Dashboard" }));
    expect(screen.getByRole("link", { name: "Return to map" })).toBeTruthy();
    expect(firstMap.remove).toHaveBeenCalledOnce();
    expect(firstMap.removeLayer).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("link", { name: "Return to map" }));
    const secondMap = maps[1];
    act(() => secondMap.listeners.get("load")?.());
    expect(secondMap.layers.size).toBe(10);
    expect(secondMap.removed).toBe(false);
  });

  it("still removes overlays and sources when the current map is alive", () => {
    renderMapRoute();
    const map = maps[0];
    act(() => map.listeners.get("load")?.());
    expect(map.layers.size).toBe(10);

    fireEvent.click(screen.getByRole("button", { name: "Toggle overlays" }));
    expect(map.layers.size).toBe(0);
    expect(map.sources.size).toBe(0);
    expect(map.removeLayer).toHaveBeenCalledTimes(10);
    expect(map.removeSource).toHaveBeenCalledTimes(4);
    expect(map.remove).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Toggle overlays" }));
    expect(map.layers.size).toBe(10);
    expect(map.sources.size).toBe(4);
  });
});
