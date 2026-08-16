import { useEffect, useRef, useState } from "react";

import maplibregl from "maplibre-gl";

export function useMapLibreMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      attributionControl: false,
      style: {
        version: 8,
        sources: {
          "osm-tiles": {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
          },
        },
        layers: [
          {
            id: "osm-tiles-layer",
            type: "raster",
            source: "osm-tiles",
            minzoom: 0,
            maxzoom: 24,
          },
        ],
      },
      center: [51.389, 35.689],
      zoom: 11,
      maxZoom: 28,
    });

    const markMapReady = () => setIsMapReady(true);
    map.once("load", markMapReady);

    map.addControl(new maplibregl.NavigationControl(), "top-left");
    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution:
          '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
      }),
      "bottom-left",
    );

    mapRef.current = map;

    return () => {
      map.off("load", markMapReady);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return { containerRef, isMapReady, mapRef };
}
