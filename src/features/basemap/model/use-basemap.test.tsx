// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import type { Map } from "maplibre-gl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useBasemap } from "./use-basemap";

const style = {
  version: 8,
  glyphs: "https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf",
  sprite: "https://tiles.openfreemap.org/sprites/example",
  sources: { tiles: { type: "vector", url: "https://tiles.openfreemap.org/planet" } },
  layers: [
    { id: "background", type: "background" },
    { id: "roads", type: "line", source: "tiles", "source-layer": "transportation" },
  ],
};
const response = () => ({ ok: true, json: async () => style }) as Response;

function setup() {
  const layers = new Set(["osm-tiles-layer", "uploaded-polygon", "measurement-line"]);
  const sources = new Set(["osm-tiles", "uploaded-data", "measurement-data"]);
  const listeners = new globalThis.Map<string, (event?: unknown) => void>();
  const map = {
    getStyle: () => ({ version: 8, sources: {}, layers: [] }),
    setGlyphs: vi.fn(),
    setSprite: vi.fn(),
    addSource: vi.fn((id: string) => sources.add(id)),
    addLayer: vi.fn(({ id }: { id: string }) => layers.add(id)),
    getLayer: vi.fn((id: string) => layers.has(id)),
    getSource: vi.fn((id: string) => sources.has(id)),
    removeLayer: vi.fn((id: string) => layers.delete(id)),
    removeSource: vi.fn((id: string) => sources.delete(id)),
    setLayoutProperty: vi.fn(),
    on: vi.fn((event: string, callback: () => void) => listeners.set(event, callback)),
    off: vi.fn((event: string) => listeners.delete(event)),
  };
  const mapRef = { current: map as unknown as Map | null };
  const hook = renderHook(() => useBasemap(mapRef, true));
  const finishLoading = async () => {
    await waitFor(() => expect(layers.has("openfreemap-basemap-roads")).toBe(true));
    act(() => listeners.get("idle")?.());
  };
  return { ...hook, map, mapRef, layers, sources, listeners, finishLoading };
}

beforeEach(() => vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response())));
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("free basemap switching", () => {
  it("keeps OSM as default without contacting another provider", () => {
    const { result } = setup();
    expect(result.current.active).toBe("osm");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("waits for tiles, switches both ways without removing overlays, and reuses the style", async () => {
    const { result, map, layers, sources, finishLoading } = setup();
    act(() => result.current.select("openfreemap"));
    expect(result.current.active).toBe("osm");
    expect(result.current.loading).toBe(true);
    await finishLoading();
    expect(result.current.active).toBe("openfreemap");
    expect(fetch).toHaveBeenCalledWith(
      "https://tiles.openfreemap.org/styles/liberty",
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
    expect(map.addLayer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "openfreemap-basemap-roads",
        source: "openfreemap-basemap-tiles",
      }),
      "osm-tiles-layer",
    );
    expect(map.setLayoutProperty).toHaveBeenCalledWith("osm-tiles-layer", "visibility", "none");
    act(() => result.current.select("osm"));
    expect([...layers]).toEqual(["osm-tiles-layer", "uploaded-polygon", "measurement-line"]);
    expect([...sources]).toEqual(["osm-tiles", "uploaded-data", "measurement-data"]);
    expect(map.setLayoutProperty).toHaveBeenLastCalledWith(
      "osm-tiles-layer",
      "visibility",
      "visible",
    );
    expect(map.setGlyphs).toHaveBeenLastCalledWith(undefined);
    act(() => result.current.select("openfreemap"));
    await finishLoading();
    expect(result.current.active).toBe("openfreemap");
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("keeps OSM on style request failure and allows retry", async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error("network"));
    const { result, map, finishLoading } = setup();
    act(() => result.current.select("openfreemap"));
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.active).toBe("osm");
    expect(map.addLayer).not.toHaveBeenCalled();
    act(() => result.current.select("openfreemap"));
    await finishLoading();
    expect(result.current.active).toBe("openfreemap");
  });

  it("ignores an in-flight request after switching back to OSM", async () => {
    let resolve: (value: Response) => void = () => {};
    vi.mocked(fetch).mockImplementationOnce(
      () =>
        new Promise<Response>((done) => {
          resolve = done;
        }),
    );
    const { result, map } = setup();
    act(() => result.current.select("openfreemap"));
    act(() => result.current.select("osm"));
    await act(async () => resolve(response()));
    expect(result.current.active).toBe("osm");
    expect(map.addLayer).not.toHaveBeenCalled();
  });

  it("does not query a destroyed map during cleanup", async () => {
    const { result, map, mapRef, unmount, finishLoading } = setup();
    act(() => result.current.select("openfreemap"));
    await finishLoading();
    mapRef.current = null;
    map.getLayer.mockImplementation(() => {
      throw new Error("Map destroyed");
    });
    expect(() => unmount()).not.toThrow();
    expect(map.removeLayer).not.toHaveBeenCalled();
  });

  it("falls back for provider errors while ignoring unrelated overlay errors", async () => {
    const { result, listeners, layers, finishLoading } = setup();
    act(() => result.current.select("openfreemap"));
    await finishLoading();
    act(() => listeners.get("error")?.({ sourceId: "uploaded-data" }));
    expect(result.current.active).toBe("openfreemap");
    act(() => listeners.get("error")?.({ sourceId: "openfreemap-basemap-tiles" }));
    expect(result.current.active).toBe("osm");
    expect(result.current.error).toBeTruthy();
    expect(layers.has("openfreemap-basemap-roads")).toBe(false);
    expect(layers.has("uploaded-polygon")).toBe(true);
  });

  it("rolls back partially installed layers if adding a layer fails", async () => {
    const { result, map, layers, sources } = setup();
    map.addLayer
      .mockImplementationOnce(({ id }) => layers.add(id))
      .mockImplementationOnce(() => {
        throw new Error("Invalid layer");
      });
    act(() => result.current.select("openfreemap"));
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect([...layers]).toEqual(["osm-tiles-layer", "uploaded-polygon", "measurement-line"]);
    expect([...sources]).toEqual(["osm-tiles", "uploaded-data", "measurement-data"]);
  });

  it("cancels stalled requests after the loading timeout", async () => {
    vi.useFakeTimers();
    vi.mocked(fetch).mockImplementationOnce(() => new Promise(() => {}));
    const { result } = setup();
    act(() => result.current.select("openfreemap"));
    await act(async () => vi.advanceTimersByTimeAsync(20000));
    expect(result.current.active).toBe("osm");
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeTruthy();
    expect((vi.mocked(fetch).mock.calls[0][1]?.signal as AbortSignal).aborted).toBe(true);
  });
});
