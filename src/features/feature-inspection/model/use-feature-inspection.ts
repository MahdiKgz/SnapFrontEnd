import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

import { distance } from "@turf/distance";
import { Marker } from "maplibre-gl";
import type { GeoJSONSource, Map as MapLibreMap, MapMouseEvent } from "maplibre-gl";

import {
  featureDistance,
  featureName,
  featureSummary,
  featuresOf,
  isNeighborDistance,
  resolveFeature,
} from "./feature-details";
import type { FeatureEntry, Neighbor, Vertex } from "./feature-details";

interface Inspection {
  entry: FeatureEntry;
  summary: ReturnType<typeof featureSummary>;
  neighbors: Neighbor[];
  loadingNeighbors: boolean;
  skippedNeighbors: number;
}
const SOURCE = "snapgis-feature-inspection";
const LAYERS = [SOURCE + "-fill", SOURCE + "-line", SOURCE + "-point"];
const canonicalSource = (source: string) =>
  source === "topology-selected-feature" ? "topology-affected-features" : source;
const inspectable = (source: string) =>
  ![SOURCE, "snapgis-measurement", "snapgis-manual-review"].includes(source);

export function useFeatureInspection({
  mapRef,
  isMapReady,
  enabled,
}: {
  mapRef: RefObject<MapLibreMap | null>;
  isMapReady: boolean;
  enabled: boolean;
}) {
  const [isClosing, setIsClosing] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedVertex, setSelectedVertex] = useState<number | null>(null);
  const requestRef = useRef(0);
  const clearRef = useRef<(() => void) | null>(null);
  const vertexRef = useRef<Marker | null>(null);
  const close = useCallback(() => {
    requestRef.current++;
    clearRef.current?.();
    vertexRef.current?.remove();
    vertexRef.current = null;
    setIsClosing(true);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(
      () => {
        setInspection(null);
        setError(null);
        setLoading(false);
        setSelectedVertex(null);
        closeTimer.current = null;
      },
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? 0 : 180,
    );
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady || !enabled) return;
    let active = true;
    let hasOverlay = false;
    const clear = () => {
      if (mapRef.current !== map || !hasOverlay) return;
      hasOverlay = false;
      LAYERS.forEach((id) => {
        if (map.getLayer(id)) map.removeLayer(id);
      });
      if (map.getSource(SOURCE)) map.removeSource(SOURCE);
    };
    clearRef.current = clear;
    const onClick = async (event: MapMouseEvent) => {
      close();
      if (closeTimer.current) clearTimeout(closeTimer.current);
      closeTimer.current = null;
      setIsClosing(false);
      setInspection(null);
      setError(null);
      setLoading(false);
      setSelectedVertex(null);
      const request = requestRef.current;
      const current = () => active && mapRef.current === map && requestRef.current === request;
      const hits = map.queryRenderedFeatures(event.point).filter((hit) => inspectable(hit.source));
      if (!hits.length) return;
      setLoading(true);
      try {
        const point = [event.lngLat.lng, event.lngLat.lat];
        const nearby = map.unproject([event.point.x + 6, event.point.y]);
        const tolerance = Math.max(distance(point, [nearby.lng, nearby.lat]), 0.000001);
        const datasets = new Map<string, ReturnType<typeof featuresOf>>();
        const load = async (id: string) => {
          if (datasets.has(id)) return datasets.get(id)!;
          const source = map.getSource(id);
          if (!source || source.type !== "geojson") return [];
          const features = featuresOf(await (source as GeoJSONSource).getData());
          datasets.set(id, features);
          return features;
        };
        let entry: FeatureEntry | null = null;
        for (const hit of hits) {
          const source = canonicalSource(hit.source);
          const features = await load(source);
          if (!current()) return;
          const index = resolveFeature(features, hit, point, tolerance);
          if (index >= 0) {
            entry = { source, feature: features[index], index };
            break;
          }
        }
        if (!entry) {
          if (current()) setLoading(false);
          return;
        }
        const summary = featureSummary(entry.feature);
        const result: Inspection = {
          entry,
          summary,
          neighbors: [],
          loadingNeighbors: true,
          skippedNeighbors: 0,
        };
        setInspection(result);
        setLoading(false);
        map.addSource(SOURCE, { type: "geojson", data: entry.feature });
        hasOverlay = true;
        map.addLayer({
          id: LAYERS[0],
          type: "fill",
          source: SOURCE,
          filter: ["==", "$type", "Polygon"],
          paint: { "fill-color": "#f97316", "fill-opacity": 0.18 },
        });
        map.addLayer({
          id: LAYERS[1],
          type: "line",
          source: SOURCE,
          paint: { "line-color": "#ea580c", "line-width": 3 },
        });
        map.addLayer({
          id: LAYERS[2],
          type: "circle",
          source: SOURCE,
          filter: ["==", "$type", "Point"],
          paint: {
            "circle-color": "#f97316",
            "circle-radius": 7,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
        });

        const visibleSources = new Set<string>([entry.source]);
        for (const layer of map.getStyle().layers ?? [])
          if (
            "source" in layer &&
            typeof layer.source === "string" &&
            layer.layout?.visibility !== "none" &&
            inspectable(layer.source)
          )
            visibleSources.add(canonicalSource(layer.source));
        const neighbors: Neighbor[] = [];
        let skippedNeighbors = 0,
          count = 0;
        for (const source of visibleSources) {
          if (!current()) return;
          let features: ReturnType<typeof featuresOf>;
          try {
            features = await load(source);
          } catch {
            skippedNeighbors++;
            continue;
          }
          if (!current()) return;
          for (let index = 0; index < features.length; index++) {
            if (source === entry.source && index === entry.index) continue;
            if (++count % 20 === 0) await new Promise<void>((resolve) => setTimeout(resolve, 0));
            if (!current()) return;
            try {
              const distanceKm = featureDistance(entry.feature, features[index]);
              if (isNeighborDistance(distanceKm))
                neighbors.push({
                  name: featureName({ feature: features[index], source, index }),
                  distanceKm,
                });
            } catch {
              skippedNeighbors++;
            }
          }
        }
        neighbors.sort((a, b) => a.distanceKm - b.distanceKm);
        if (current())
          setInspection({ ...result, neighbors, loadingNeighbors: false, skippedNeighbors });
      } catch {
        if (current()) {
          clear();
          setInspection(null);
          setLoading(false);
          setError("خواندن اطلاعات عارضه ممکن نشد. هندسه آن را بررسی کنید.");
        }
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) close();
    };
    map.on("click", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      active = false;
      if (closeTimer.current) clearTimeout(closeTimer.current);
      closeTimer.current = null;
      requestRef.current++;
      map.off("click", onClick);
      window.removeEventListener("keydown", onKey);
      vertexRef.current?.remove();
      vertexRef.current = null;
      clear();
      if (clearRef.current === clear) clearRef.current = null;
    };
  }, [close, enabled, isMapReady, mapRef]);

  const selectVertex = (vertex: Vertex, index: number) => {
    const map = mapRef.current;
    if (!map || !enabled) return;
    vertexRef.current?.remove();
    const element = document.createElement("div");
    element.className = "size-4 rounded-full border-2 border-white bg-orange-500 shadow-lg";
    element.style.pointerEvents = "none";
    element.setAttribute("role", "img");
    element.setAttribute("aria-label", `رأس ${(index + 1).toLocaleString("fa-IR")}`);
    vertexRef.current = new Marker({ element })
      .setLngLat([vertex.coordinate[0], vertex.coordinate[1]])
      .addTo(map);
    setSelectedVertex(index);
  };
  return { inspection, error, loading, selectedVertex, selectVertex, close, isClosing };
}
