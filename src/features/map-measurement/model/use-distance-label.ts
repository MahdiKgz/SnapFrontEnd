import { useEffect } from "react";
import type { RefObject } from "react";

import { Marker } from "maplibre-gl";
import type { Map as MapLibreMap } from "maplibre-gl";

import type { Coordinate } from "./measurement";

export function useDistanceLabel({
  mapRef,
  points,
  label,
}: {
  mapRef: RefObject<MapLibreMap | null>;
  points: Coordinate[];
  label: string | null;
}) {
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !label || points.length !== 2) return;

    const element = document.createElement("div");
    element.textContent = label;
    element.dir = "ltr";
    element.className =
      "pointer-events-none whitespace-nowrap rounded-lg border border-border bg-card/95 px-3 py-1.5 text-sm font-bold text-foreground shadow-lg backdrop-blur";
    element.style.pointerEvents = "none";
    element.style.direction = "ltr";
    element.setAttribute("aria-label", `طول اندازه‌گیری‌شده: ${label}`);
    const marker = new Marker({ element, anchor: "bottom", offset: [0, -12] });

    // Follow the visible segment midpoint as zoom, bearing, and pitch change.
    const updatePosition = () => {
      if (mapRef.current !== map) return;
      const start = map.project(points[0]);
      const end = map.project(points[1]);
      marker.setLngLat(map.unproject([(start.x + end.x) / 2, (start.y + end.y) / 2]));
    };
    updatePosition();
    marker.addTo(map);
    map.on("move", updatePosition);
    return () => {
      map.off("move", updatePosition);
      marker.remove();
    };
  }, [label, mapRef, points]);
}
