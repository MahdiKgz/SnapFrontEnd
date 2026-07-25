import { useEffect } from "react";
import type { RefObject } from "react";

import { getGeoJsonBounds } from "@/shared/lib/geo";
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";

import { FEATURE_INDEX_PROPERTY, prepareAffectedFeatureCollection } from "./topology-report";
import type { AffectedFeatureCollection } from "./types";

const SOURCE_ID = "topology-affected-features";
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
        return;
      }

      map.addSource(SOURCE_ID, { type: "geojson", data });
      map.addLayer({
        id: FILL_LAYER_ID,
        type: "fill",
        source: SOURCE_ID,
        filter: ["==", "$type", "Polygon"],
        paint: {
          "fill-color": "#ef4444",
          "fill-opacity": 0.3,
        },
      });
      map.addLayer({
        id: LINE_LAYER_ID,
        type: "line",
        source: SOURCE_ID,
        filter: ["any", ["==", "$type", "LineString"], ["==", "$type", "Polygon"]],
        paint: {
          "line-color": "#dc2626",
          "line-width": 3,
          "line-opacity": 0.95,
        },
      });
      map.addLayer({
        id: SELECTED_FILL_LAYER_ID,
        type: "fill",
        source: SOURCE_ID,
        filter: ["==", ["get", FEATURE_INDEX_PROPERTY], -1],
        paint: {
          "fill-color": "#f87171",
          "fill-opacity": 0.58,
        },
      });
      map.addLayer({
        id: SELECTED_LINE_LAYER_ID,
        type: "line",
        source: SOURCE_ID,
        filter: ["==", ["get", FEATURE_INDEX_PROPERTY], -1],
        paint: {
          "line-color": "#ffffff",
          "line-width": 5,
          "line-opacity": 1,
        },
      });
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
    if (!map || !affectedFeatures || !map.getLayer(SELECTED_FILL_LAYER_ID)) return;

    const selectedFilter = [
      "==",
      ["get", FEATURE_INDEX_PROPERTY],
      selectedFeatureIndex ?? -1,
    ] as const;

    map.setFilter(SELECTED_FILL_LAYER_ID, selectedFilter);
    map.setFilter(SELECTED_LINE_LAYER_ID, selectedFilter);

    if (selectedFeatureIndex === null) return;

    const data = prepareAffectedFeatureCollection(affectedFeatures);
    const selectedFeature = data.features.find(
      (feature) => feature.properties?.[FEATURE_INDEX_PROPERTY] === selectedFeatureIndex,
    );

    if (!selectedFeature) return;

    const bounds = getGeoJsonBounds({
      type: "FeatureCollection",
      features: [selectedFeature],
    });

    if (bounds) {
      map.fitBounds(bounds, {
        padding: 140,
        duration: 700,
        maxZoom: 17,
      });
    }
  }, [affectedFeatures, mapRef, selectedFeatureIndex]);
}
