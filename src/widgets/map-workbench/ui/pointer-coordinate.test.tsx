// @vitest-environment jsdom
import { createRef } from "react";

import { act, cleanup, render, screen } from "@testing-library/react";
import type { Map as MapLibreMap, MapMouseEvent } from "maplibre-gl";
import { afterEach, describe, expect, it, vi } from "vitest";

import { PointerCoordinate } from "./pointer-coordinate";

describe("PointerCoordinate", () => {
  afterEach(cleanup);

  it("shows the map center and tracks pointer coordinates and zoom", () => {
    const listeners = new Map<string, (...args: never[]) => void>();
    let zoom = 11;
    const map = {
      getCenter: () => ({ lng: 51.389, lat: 35.689 }),
      getZoom: () => zoom,
      on: vi.fn((event: string, listener: (...args: never[]) => void) => {
        listeners.set(event, listener);
      }),
      off: vi.fn((event: string) => {
        listeners.delete(event);
      }),
    } as unknown as MapLibreMap;
    const mapRef = createRef<MapLibreMap | null>();
    mapRef.current = map;

    const { unmount } = render(<PointerCoordinate isMapReady mapRef={mapRef} />);
    const widget = screen.getByLabelText("مختصات نشانگر نقشه");
    expect(widget.textContent).toContain("Lng 51.389000");
    expect(widget.textContent).toContain("Lat 35.689000");
    expect(widget.textContent).toContain("Zoom 11.00");

    act(() => {
      listeners.get("mousemove")?.({
        lngLat: { lng: 52.1234567, lat: 36.7654321 },
      } as MapMouseEvent & never);
    });
    expect(widget.textContent).toContain("Lng 52.123457");
    expect(widget.textContent).toContain("Lat 36.765432");

    zoom = 14.25;
    act(() => listeners.get("zoom")?.());
    expect(widget.textContent).toContain("Zoom 14.25");

    unmount();
    expect(map.off).toHaveBeenCalledWith("mousemove", expect.any(Function));
    expect(map.off).toHaveBeenCalledWith("zoom", expect.any(Function));
  });
});
