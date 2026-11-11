import { useCallback, useRef, useState } from "react";
import type { RefObject } from "react";

import { getGeoJsonBounds } from "@/shared/lib/geo";
import type { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";
import { type GeoJSONSource, type Map as MapLibreMap } from "maplibre-gl";

const SOURCE_ID = "uploaded-file";
const FILL_LAYER_ID = "uploaded-file-fill";
const LINE_LAYER_ID = "uploaded-file-line";
const POINT_LAYER_ID = "uploaded-file-points";

export function useMapPreview(mapRef: RefObject<MapLibreMap | null>, isMapReady: boolean) {
  const [previewError, setPreviewError] = useState("");
  const [isPreviewing, setIsPreviewing] = useState(false);

  const previewData = useRef<FeatureCollection | null>(null);
  const hiddenIndexes = useRef<ReadonlySet<number>>(new Set());
  const visiblePreview = useCallback((data: FeatureCollection) => {
    if (!hiddenIndexes.current.size) return data;
    return {
      ...data,
      features: data.features.filter((_, index) => !hiddenIndexes.current.has(index)),
    };
  }, []);
  const setPreviewMask = useCallback(
    (indexes: number[]) => {
      hiddenIndexes.current = new Set(indexes);
      const source = mapRef.current?.getSource<GeoJSONSource>(SOURCE_ID);
      if (source && previewData.current) source.setData(visiblePreview(previewData.current));
    },
    [mapRef, visiblePreview],
  );

  const removePreview = useCallback(() => {
    previewData.current = null;
    const map = mapRef.current;
    if (!map) return;

    [POINT_LAYER_ID, LINE_LAYER_ID, FILL_LAYER_ID].forEach((layerId) => {
      if (map?.getLayer(layerId)) map.removeLayer(layerId);
    });

    if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
  }, [mapRef]);

  const displayGeoJson = useCallback(
    async (geoJson: FeatureCollection<Geometry, GeoJsonProperties>, fitToFile: boolean) => {
      const map = mapRef.current;

      if (!map) {
        throw new Error("Map is not available.");
      }

      if (!isMapReady && !map.isStyleLoaded()) {
        await new Promise<void>((resolve) => {
          const finishWaiting = () => {
            map.off("load", finishWaiting);
            map.off("idle", finishWaiting);
            resolve();
          };

          map.once("load", finishWaiting);
          map.once("idle", finishWaiting);
        });
      }

      previewData.current = geoJson;
      const visible = visiblePreview(geoJson);
      const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;

      if (source) {
        source.setData(visible);
      } else {
        map.addSource(SOURCE_ID, {
          type: "geojson",
          data: visible,
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

      if (!fitToFile) return;
      const bounds = getGeoJsonBounds(geoJson);
      if (!bounds) {
        throw new Error("The file does not contain displayable coordinates.");
      }

      map.fitBounds(bounds, {
        padding: 80,
        duration: 1200,
        maxZoom: 16,
      });
    },
    [isMapReady, mapRef, visiblePreview],
  );

  const previewGeoJson = useCallback(
    async (geoJson: FeatureCollection<Geometry, GeoJsonProperties>, fitToFile = true) => {
      setPreviewError("");
      setIsPreviewing(true);
      try {
        await displayGeoJson(geoJson, fitToFile);
      } catch (error) {
        setPreviewError("نمایش فایل روی نقشه انجام نشد. ساختار داده مکانی را بررسی کنید.");
        throw error;
      } finally {
        setIsPreviewing(false);
      }
    },
    [displayGeoJson],
  );

  return {
    clearPreviewError: () => setPreviewError(""),
    isPreviewing,
    previewError,
    previewGeoJson,
    setPreviewMask,
    removePreview,
  };
}
