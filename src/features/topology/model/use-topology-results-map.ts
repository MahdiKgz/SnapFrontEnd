import { useEffect } from "react";
import type { RefObject } from "react";

import { getGeoJsonBounds } from "@/shared/lib/geo";
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";

import { getSelectedFeatureCollection, prepareAffectedFeatureCollection } from "./topology-report";
import type { AffectedFeatureCollection } from "./types";

const SOURCE_ID = "topology-affected-features";
const SELECTED_SOURCE_ID = "topology-selected-feature";
const FILL_LAYER_ID = "topology-affected-fill";
const LINE_LAYER_ID = "topology-affected-line";
const SELECTED_FILL_LAYER_ID = "topology-selected-fill";
const SELECTED_LINE_LAYER_ID = "topology-selected-line";
const LAYER_IDS = [
  SELECTED_LINE_LAYER_ID,
  SELECTED_FILL_LAYER_ID,
  LINE_LAYER_ID,
  FILL_LAYER_ID,
] as const;

interface UseTopologyResultsMapOptions {
  affectedFeatures: AffectedFeatureCollection | null;
  mapRef: RefObject<MapLibreMap | null>;
  selectedFeatureIndex: number | null;
}

function removeResultsLayers(map: MapLibreMap) {
  LAYER_IDS.forEach((layerId) => {
    if (map.getLayer(layerId)) map.removeLayer(layerId);
  });

  if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
  if (map.getSource(SELECTED_SOURCE_ID)) map.removeSource(SELECTED_SOURCE_ID);
}

function flyToFeature(
  map: MapLibreMap,
  selectedData: ReturnType<typeof getSelectedFeatureCollection>,
) {
  if (selectedData.features.length === 0) return;

  const bounds = getGeoJsonBounds(selectedData);
  if (!bounds) return;

  const camera = map.cameraForBounds(bounds, {
    padding: 140,
    maxZoom: 17,
  });

  if (camera) {
    map.flyTo({
      ...camera,
      duration: 900,
      essential: true,
    });
    return;
  }

  map.flyTo({
    center: [(bounds[0][0] + bounds[1][0]) / 2, (bounds[0][1] + bounds[1][1]) / 2],
    zoom: Math.min(map.getZoom() + 2, 17),
    duration: 900,
    essential: true,
  });
}

export function useTopologyResultsMap({
  affectedFeatures,
  mapRef,
  selectedFeatureIndex,
}: UseTopologyResultsMapOptions) {
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !affectedFeatures) return;

    const data = prepareAffectedFeatureCollection(affectedFeatures);

    const showResults = () => {
      const source = map.getSource(SOURCE_ID) as GeoJSONSource | undefined;

      if (source) {
        source.setData(data);
      } else {
        map.addSource(SOURCE_ID, { type: "geojson", data });
      }

      if (!map.getLayer(FILL_LAYER_ID)) {
        map.addLayer({
          id: FILL_LAYER_ID,
          type: "fill",
          source: SOURCE_ID,
          paint: {
            "fill-color": "#ef4444",
            "fill-opacity": 0.34,
          },
        });
      }

      if (!map.getLayer(LINE_LAYER_ID)) {
        map.addLayer({
          id: LINE_LAYER_ID,
          type: "line",
          source: SOURCE_ID,
          paint: {
            "line-color": "#dc2626",
            "line-width": 3,
            "line-opacity": 0.95,
          },
        });
      }

      if (!map.getSource(SELECTED_SOURCE_ID)) {
        map.addSource(SELECTED_SOURCE_ID, {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [],
          },
        });
      }

      if (!map.getLayer(SELECTED_FILL_LAYER_ID)) {
        map.addLayer({
          id: SELECTED_FILL_LAYER_ID,
          type: "fill",
          source: SELECTED_SOURCE_ID,
          paint: {
            "fill-color": "#ef4444",
            "fill-opacity": 0.72,
          },
        });
      }

      if (!map.getLayer(SELECTED_LINE_LAYER_ID)) {
        map.addLayer({
          id: SELECTED_LINE_LAYER_ID,
          type: "line",
          source: SELECTED_SOURCE_ID,
          paint: {
            "line-color": "#ffffff",
            "line-width": 5,
            "line-opacity": 1,
          },
        });
      }
    };

    if (map.isStyleLoaded()) {
      showResults();
    } else {
      map.once("load", showResults);
    }

    return () => {
      map.off("load", showResults);
      removeResultsLayers(map);
    };
  }, [affectedFeatures, mapRef]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !affectedFeatures) return;

    const selectedData = getSelectedFeatureCollection(affectedFeatures, selectedFeatureIndex);

    const applySelection = () => {
      const source = map.getSource(SELECTED_SOURCE_ID) as GeoJSONSource | undefined;
      if (!source) return false;

      source.setData(selectedData);
      if (selectedFeatureIndex !== null) flyToFeature(map, selectedData);
      return true;
    };

    if (applySelection()) return;

    const applyWhenReady = () => {
      if (!applySelection()) return;
      map.off("load", applyWhenReady);
      map.off("idle", applyWhenReady);
    };

    map.once("load", applyWhenReady);
    map.once("idle", applyWhenReady);

    return () => {
      map.off("load", applyWhenReady);
      map.off("idle", applyWhenReady);
    };
  }, [affectedFeatures, mapRef, selectedFeatureIndex]);
}
