import { useCallback, useState } from "react";
import type { RefObject } from "react";

import { getGeoJsonBounds, parseGeoFile } from "@/shared/lib/geo";
import { type GeoJSONSource, type Map as MapLibreMap } from "maplibre-gl";

const SOURCE_ID = "uploaded-file";
const FILL_LAYER_ID = "uploaded-file-fill";
const LINE_LAYER_ID = "uploaded-file-line";
const POINT_LAYER_ID = "uploaded-file-points";

export function useMapPreview(mapRef: RefObject<MapLibreMap | null>) {
  const [previewError, setPreviewError] = useState("");
  const [isPreviewing, setIsPreviewing] = useState(false);

  const removePreview = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    [POINT_LAYER_ID, LINE_LAYER_ID, FILL_LAYER_ID].forEach((layerId) => {
      if (map.getLayer(layerId)) map.removeLayer(layerId);
    });

    if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
  }, [mapRef]);

  const previewFile = useCallback(
    async (file: File) => {
      setPreviewError("");
      setIsPreviewing(true);

      try {
        const geoJson = await parseGeoFile(file);
        const map = mapRef.current;

        if (!map) {
          throw new Error("Map is not available.");
        }

        if (!map.isStyleLoaded()) {
          await new Promise<void>((resolve) => map.once("load", () => resolve()));
        }

        const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;

        if (source) {
          source.setData(geoJson);
        } else {
          map.addSource(SOURCE_ID, {
            type: "geojson",
            data: geoJson,
          });

          map.addLayer({
            id: FILL_LAYER_ID,
            type: "fill",
            source: SOURCE_ID,
            filter: ["==", "$type", "Polygon"],
            paint: {
              "fill-color": "#10b981",
              "fill-opacity": 0.24,
            },
          });

          map.addLayer({
            id: LINE_LAYER_ID,
            type: "line",
            source: SOURCE_ID,
            filter: ["any", ["==", "$type", "LineString"], ["==", "$type", "Polygon"]],
            paint: {
              "line-color": "#059669",
              "line-width": 3,
              "line-opacity": 0.9,
            },
          });

          map.addLayer({
            id: POINT_LAYER_ID,
            type: "circle",
            source: SOURCE_ID,
            filter: ["==", "$type", "Point"],
            paint: {
              "circle-color": "#10b981",
              "circle-radius": 6,
              "circle-stroke-color": "#ffffff",
              "circle-stroke-width": 2,
            },
          });
        }

        const bounds = getGeoJsonBounds(geoJson);
        if (!bounds) {
          throw new Error("The file does not contain displayable coordinates.");
        }

        map.fitBounds(bounds, {
          padding: 80,
          duration: 1200,
          maxZoom: 16,
        });
      } catch {
        setPreviewError("نمایش فایل روی نقشه انجام نشد. ساختار داده مکانی را بررسی کنید.");
      } finally {
        setIsPreviewing(false);
      }
    },
    [mapRef],
  );

  return {
    clearPreviewError: () => setPreviewError(""),
    isPreviewing,
    previewError,
    previewFile,
    removePreview,
  };
}
