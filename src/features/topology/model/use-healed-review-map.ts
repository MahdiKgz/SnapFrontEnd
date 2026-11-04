import { useEffect } from "react";
import type { RefObject } from "react";

import { getGeoJsonBounds } from "@/shared/lib/geo";
import type { Feature, FeatureCollection, GeoJsonProperties, Geometry } from "geojson";
import type { Map as MapLibreMap } from "maplibre-gl";

import type { TopologyIssue } from "./types";

const ORIGINAL_SOURCE_ID = "snapgis-original-geometry";
const ORIGINAL_FILL_ID = "snapgis-original-fill";
const ORIGINAL_LINE_ID = "snapgis-original-line";
const ORIGINAL_POINT_ID = "snapgis-original-point";

const featureIndexes = new WeakMap<
  FeatureCollection<Geometry, GeoJsonProperties>,
  Map<number, Feature<Geometry, GeoJsonProperties>>
>();

function getIssueFeature(
  issue: TopologyIssue,
  source: FeatureCollection<Geometry, GeoJsonProperties>,
) {
  let indexes = featureIndexes.get(source);
  if (!indexes) {
    indexes = new Map(
      source.features.map((feature, index) => [
        (feature as typeof feature & { snapgisFeatureIndex?: number }).snapgisFeatureIndex ?? index,
        feature,
      ]),
    );
    featureIndexes.set(source, indexes);
  }
  return indexes.get(issue.featureIndex);
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
      // eslint-disable-next-line react-hooks/exhaustive-deps -- Check live map ownership, not a captured DOM ref.
      if (mapRef.current !== map) return;
      [ORIGINAL_POINT_ID, ORIGINAL_LINE_ID, ORIGINAL_FILL_ID].forEach((id) => {
        if (map.getLayer(id)) map.removeLayer(id);
      });
      if (map.getSource(ORIGINAL_SOURCE_ID)) map.removeSource(ORIGINAL_SOURCE_ID);
    };
  }, [data, isMapReady, mapRef, visible]);
}

export function useReviewIssueFocus({
  data,
  isMapReady,
  issues,
  mapRef,
  selectedIssueIndex,
}: {
  data: FeatureCollection<Geometry, GeoJsonProperties> | null;
  isMapReady: boolean;
  issues: TopologyIssue[];
  mapRef: RefObject<MapLibreMap | null>;
  selectedIssueIndex: number | null;
}) {
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady || !data || selectedIssueIndex === null) return;
    const issue = issues.find((item, index) => (item.issueIndex ?? index) === selectedIssueIndex);
    if (!issue) return;
    const feature = getIssueFeature(issue, data);
    if (!feature) return;
    const bounds = getGeoJsonBounds({ type: "FeatureCollection", features: [feature] });
    if (!bounds) return;
    // Review navigation moves the camera; only file geometries are rendered on the map.
    map.fitBounds(bounds, { padding: 140, maxZoom: 17, duration: 900 });
  }, [data, isMapReady, issues, mapRef, selectedIssueIndex]);
}
