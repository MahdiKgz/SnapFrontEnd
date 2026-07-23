import type { RefObject } from "react";

import "maplibre-gl/dist/maplibre-gl.css";

interface MapCanvasProps {
  containerRef: RefObject<HTMLDivElement | null>;
}

export function MapCanvas({ containerRef }: MapCanvasProps) {
  return <div ref={containerRef} className="absolute inset-0 h-full w-full" />;
}
