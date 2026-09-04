import { useEffect } from "react";
import type { RefObject } from "react";

import { getGeoJsonBounds } from "@/shared/lib/geo";
import type {
  Feature,
  FeatureCollection,
  GeoJsonProperties,
  Geometry,
  Point,
  Position,
} from "geojson";
import type { MapLayerMouseEvent, Map as MapLibreMap } from "maplibre-gl";

import type { TopologyIssue } from "./types";

const ORIGINAL_SOURCE_ID = "snapgis-original-geometry";
const ORIGINAL_FILL_ID = "snapgis-original-fill";
const ORIGINAL_LINE_ID = "snapgis-original-line";
const ORIGINAL_POINT_ID = "snapgis-original-point";
const REVIEW_SOURCE_ID = "snapgis-manual-review";
const REVIEW_LAYER_ID = "snapgis-manual-review-markers";

export function getIssueCoordinate(
  issue: TopologyIssue,
  source: FeatureCollection<Geometry, GeoJsonProperties>,
): Position | null {
  const feature = source.features[issue.featureIndex];
  if (!feature?.geometry) return null;
  let cursor: unknown = "coordinates" in feature.geometry ? feature.geometry.coordinates : null;
  for (const segment of issue.location.coordinatePath ?? []) {
    if (!Array.isArray(cursor) || !Number.isInteger(segment)) {
      cursor = null;
      break;
    }
    cursor = cursor[segment];
  }
  if (
    Array.isArray(cursor) &&
    cursor.length >= 2 &&
    typeof cursor[0] === "number" &&
    typeof cursor[1] === "number"
  ) {
    return [cursor[0], cursor[1]];
  }

  const featureCollection: FeatureCollection<Geometry, GeoJsonProperties> = {
    type: "FeatureCollection",
    features: [feature],
  };
  const bounds = getGeoJsonBounds(featureCollection);
  return bounds ? [(bounds[0][0] + bounds[1][0]) / 2, (bounds[0][1] + bounds[1][1]) / 2] : null;
}

export function useOriginalGeometryOverlay({
  data,
  isMapReady,
  mapRef,
  visible,
}: {
  data: FeatureCollection<Geometry, GeoJsonProperties> | null;
  isMapReady: boolean;
  mapRef: RefObject<MapLibreMap | null>;
  visible: boolean;
}) {
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady || !data || !visible) return;
    map.addSource(ORIGINAL_SOURCE_ID, { type: "geojson", data });
    map.addLayer({
      id: ORIGINAL_FILL_ID,
      type: "fill",
      source: ORIGINAL_SOURCE_ID,
      filter: ["==", "$type", "Polygon"],
      paint: { "fill-color": "#f59e0b", "fill-opacity": 0.08 },
    });
    map.addLayer({
      id: ORIGINAL_LINE_ID,
      type: "line",
      source: ORIGINAL_SOURCE_ID,
      filter: ["any", ["==", "$type", "LineString"], ["==", "$type", "Polygon"]],
      paint: {
        "line-color": "#f59e0b",
        "line-width": 2,
        "line-opacity": 0.95,
        "line-dasharray": [2, 2],
      },
    });
    map.addLayer({
      id: ORIGINAL_POINT_ID,
      type: "circle",
      source: ORIGINAL_SOURCE_ID,
      filter: ["==", "$type", "Point"],
      paint: {
        "circle-color": "#f59e0b",
        "circle-radius": 5,
        "circle-stroke-color": "#fff7ed",
        "circle-stroke-width": 1,
      },
    });

    return () => {
      [ORIGINAL_POINT_ID, ORIGINAL_LINE_ID, ORIGINAL_FILL_ID].forEach((id) => {
        if (map.getLayer(id)) map.removeLayer(id);
      });
      if (map.getSource(ORIGINAL_SOURCE_ID)) map.removeSource(ORIGINAL_SOURCE_ID);
    };
  }, [data, isMapReady, mapRef, visible]);
}

export function useManualReviewMarkers({
  data,
  isMapReady,
  issues,
  mapRef,
  onSelectIssue,
  selectedIssueIndex,
}: {
  data: FeatureCollection<Geometry, GeoJsonProperties> | null;
  isMapReady: boolean;
  issues: TopologyIssue[];
  mapRef: RefObject<MapLibreMap | null>;
  onSelectIssue: (issueIndex: number) => void;
  selectedIssueIndex: number | null;
}) {
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady || !data) return;
    const features = issues.flatMap<Feature<Point, GeoJsonProperties>>((issue, issueIndex) => {
      if (issue.disposition !== "ManualReview") return [];
      const coordinate = getIssueCoordinate(issue, data);
      return coordinate
        ? [
            {
              type: "Feature",
              geometry: { type: "Point", coordinates: coordinate },
              properties: { issueIndex, code: issue.code },
            },
          ]
        : [];
    });
    map.addSource(REVIEW_SOURCE_ID, {
      type: "geojson",
      data: { type: "FeatureCollection", features },
    });
    map.addLayer({
      id: REVIEW_LAYER_ID,
      type: "circle",
      source: REVIEW_SOURCE_ID,
      paint: {
        "circle-color": [
          "case",
          ["==", ["get", "issueIndex"], selectedIssueIndex ?? -1],
          "#ef4444",
          "#f59e0b",
        ],
        "circle-radius": ["case", ["==", ["get", "issueIndex"], selectedIssueIndex ?? -1], 9, 7],
        "circle-stroke-color": "#ffffff",
        "circle-stroke-width": 2,
      },
    });
    const selectMarker = (event: MapLayerMouseEvent) => {
      const issueIndex = Number(event.features?.[0]?.properties?.issueIndex);
      if (Number.isSafeInteger(issueIndex)) onSelectIssue(issueIndex);
    };
    const showPointer = () => {
      map.getCanvas().style.cursor = "pointer";
    };
    const hidePointer = () => {
      map.getCanvas().style.cursor = "";
    };
    map.on("click", REVIEW_LAYER_ID, selectMarker);
    map.on("mouseenter", REVIEW_LAYER_ID, showPointer);
    map.on("mouseleave", REVIEW_LAYER_ID, hidePointer);

    return () => {
      map.off("click", REVIEW_LAYER_ID, selectMarker);
      map.off("mouseenter", REVIEW_LAYER_ID, showPointer);
      map.off("mouseleave", REVIEW_LAYER_ID, hidePointer);
      if (map.getLayer(REVIEW_LAYER_ID)) map.removeLayer(REVIEW_LAYER_ID);
      if (map.getSource(REVIEW_SOURCE_ID)) map.removeSource(REVIEW_SOURCE_ID);
    };
  }, [data, isMapReady, issues, mapRef, onSelectIssue, selectedIssueIndex]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !data || selectedIssueIndex === null) return;
    const issue = issues[selectedIssueIndex];
    if (!issue) return;
    const coordinate = getIssueCoordinate(issue, data);
    if (!coordinate) return;
    map.flyTo({ center: [coordinate[0]!, coordinate[1]!], zoom: 17, duration: 900 });
  }, [data, issues, mapRef, selectedIssueIndex]);
}
