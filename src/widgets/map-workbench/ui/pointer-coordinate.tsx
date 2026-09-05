import { useEffect, useState } from "react";
import type { RefObject } from "react";

import { Crosshair } from "lucide-react";
import type { Map as MapLibreMap, MapMouseEvent } from "maplibre-gl";

interface PointerCoordinateProps {
  isMapReady: boolean;
  mapRef: RefObject<MapLibreMap | null>;
}

interface MapPosition {
  latitude: number;
  longitude: number;
  zoom: number;
}

const formatCoordinate = (value: number) => value.toFixed(6);
const formatZoom = (value: number) => value.toFixed(2);

export function PointerCoordinate({ isMapReady, mapRef }: PointerCoordinateProps) {
  const [position, setPosition] = useState<MapPosition | null>(null);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady) return;

    const center = map.getCenter();
    setPosition({
      longitude: center.lng,
      latitude: center.lat,
      zoom: map.getZoom(),
    });

    const updatePointer = (event: MapMouseEvent) => {
      setPosition({
        longitude: event.lngLat.lng,
        latitude: event.lngLat.lat,
        zoom: map.getZoom(),
      });
    };
    const updateZoom = () => {
      setPosition((current) => {
        const nextCenter = current ?? {
          longitude: map.getCenter().lng,
          latitude: map.getCenter().lat,
          zoom: map.getZoom(),
        };
        return { ...nextCenter, zoom: map.getZoom() };
      });
    };

    map.on("mousemove", updatePointer);
    map.on("zoom", updateZoom);
    return () => {
      map.off("mousemove", updatePointer);
      map.off("zoom", updateZoom);
    };
  }, [isMapReady, mapRef]);

  if (!position) return null;

  return (
    <output
      aria-label="مختصات نشانگر نقشه"
      className="pointer-events-none absolute top-6 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-xl border border-border/70 bg-background/90 px-2.5 py-2 font-mono text-[10px] text-foreground shadow-xl backdrop-blur-md sm:gap-2 sm:px-3 sm:text-[11px]"
      dir="ltr"
    >
      <Crosshair className="size-3.5 shrink-0 text-emerald-700 dark:text-emerald-400" />
      <span>
        <span className="text-muted-foreground">Lng</span> {formatCoordinate(position.longitude)}
      </span>
      <span className="h-3 w-px bg-border" />
      <span>
        <span className="text-muted-foreground">Lat</span> {formatCoordinate(position.latitude)}
      </span>
      <span className="h-3 w-px bg-border" />
      <span>
        <span className="text-muted-foreground">Zoom</span> {formatZoom(position.zoom)}
      </span>
    </output>
  );
}
