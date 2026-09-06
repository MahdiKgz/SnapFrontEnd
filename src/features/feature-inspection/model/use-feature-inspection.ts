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

export interface Inspection {
  key: string;
  slot: 0 | 1;
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
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [focusedKey, setFocusedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedVertex, setSelectedVertex] = useState<number | null>(null);
  const sessionRef = useRef<{ clear: () => void; remove: (key: string) => void } | null>(null);
  const vertexRef = useRef<Marker | null>(null);
  const clearVertex = useCallback(() => {
    vertexRef.current?.remove();
    vertexRef.current = null;
    setSelectedVertex(null);
  }, []);
  const close = useCallback(() => {
    sessionRef.current?.clear();
    clearVertex();
    setIsClosing(true);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(
      () => {
        setInspections([]);
        setFocusedKey(null);
        setError(null);
        setNotice(null);
        setLoading(false);
        closeTimer.current = null;
      },
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? 0 : 180,
    );
  }, [clearVertex]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady || !enabled) return;
    let active = true,
      hasOverlay = false,
      epoch = 0;
    let selected: Inspection[] = [];
    let queue = Promise.resolve();
    const yieldTimers = new Set<ReturnType<typeof setTimeout>>();
    const isCurrent = () => active && mapRef.current === map;
    const clearOverlay = () => {
      if (!isCurrent() || !hasOverlay) return;
      hasOverlay = false;
      LAYERS.forEach((id) => {
        if (map.getLayer(id)) map.removeLayer(id);
      });
      if (map.getSource(SOURCE)) map.removeSource(SOURCE);
    };
    const draw = () => {
      if (!isCurrent()) return;
      if (!selected.length) {
        clearOverlay();
        return;
      }
      const data = {
        type: "FeatureCollection" as const,
        features: selected.map((item) => ({
          ...item.entry.feature,
          properties: {
            ...item.entry.feature.properties,
            __inspectionColor: item.slot === 0 ? "#f97316" : "#0ea5e9",
          },
        })),
      };
      if (hasOverlay) {
        (map.getSource(SOURCE) as GeoJSONSource | undefined)?.setData(data);
        return;
      }
      map.addSource(SOURCE, { type: "geojson", data });
      hasOverlay = true;
      map.addLayer({
        id: LAYERS[0],
        type: "fill",
        source: SOURCE,
        filter: ["==", "$type", "Polygon"],
        paint: { "fill-color": ["get", "__inspectionColor"], "fill-opacity": 0.22 },
      });
      map.addLayer({
        id: LAYERS[1],
        type: "line",
        source: SOURCE,
        paint: { "line-color": ["get", "__inspectionColor"], "line-width": 3 },
      });
      map.addLayer({
        id: LAYERS[2],
        type: "circle",
        source: SOURCE,
        filter: ["==", "$type", "Point"],
        paint: {
          "circle-color": ["get", "__inspectionColor"],
          "circle-radius": 7,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });
    };
    const remove = (key: string) => {
      selected = selected.filter((item) => item.key !== key);
      if (!selected.length) {
        close();
        return;
      }
      setInspections(selected);
      setFocusedKey((focused) => (focused === key ? selected[0].key : focused));
      setNotice(null);
      clearVertex();
      draw();
    };
    const session = {
      remove,
      clear: () => {
        epoch++;
        queue = Promise.resolve();
        selected = [];
        clearOverlay();
      },
    };
    sessionRef.current = session;

    const inspect = async (event: MapMouseEvent, clickEpoch: number) => {
      const current = () => isCurrent() && epoch === clickEpoch;
      if (!current()) return;
      try {
        const hits = map
          .queryRenderedFeatures(event.point)
          .filter((hit) => inspectable(hit.source));
        if (!hits.length) return;
        if (closeTimer.current) clearTimeout(closeTimer.current);
        closeTimer.current = null;
        setIsClosing(false);
        setError(null);
        setNotice(null);
        setLoading(true);
        const datasets = new Map<string, ReturnType<typeof featuresOf>>();
        const load = async (id: string) => {
          if (datasets.has(id)) return datasets.get(id)!;
          if (!current()) return [];
          const source = map.getSource(id);
          if (!source || source.type !== "geojson") return [];
          const features = featuresOf(await (source as GeoJSONSource).getData());
          datasets.set(id, features);
          return features;
        };
        const point = [event.lngLat.lng, event.lngLat.lat];
        const nearby = map.unproject([event.point.x + 6, event.point.y]);
        const tolerance = Math.max(distance(point, [nearby.lng, nearby.lat]), 0.000001);
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
        if (!entry) return;
        const key = JSON.stringify([entry.source, entry.index]);
        if (selected.some((item) => item.key === key)) {
          remove(key);
          return;
        }
        if (selected.length === 2) {
          setNotice("حداکثر دو عارضه قابل مقایسه است؛ ابتدا یکی از انتخاب‌ها را حذف کنید.");
          return;
        }
        const summary = featureSummary(entry.feature);
        const result: Inspection = {
          key,
          slot: selected.some((item) => item.slot === 0) ? 1 : 0,
          entry,
          summary,
          neighbors: [],
          loadingNeighbors: true,
          skippedNeighbors: 0,
        };
        selected = [...selected, result];
        setInspections(selected);
        setFocusedKey(key);
        clearVertex();
        draw();
        // Neighbor work is independent, so rapid selection clicks can be processed in order.
        const findNeighbors = async () => {
          const present = () => current() && selected.some((item) => item.entry === result.entry);
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
            if (!present()) return;
            let features: ReturnType<typeof featuresOf>;
            try {
              features = await load(source);
            } catch {
              skippedNeighbors++;
              continue;
            }
            if (!present()) return;
            for (let index = 0; index < features.length; index++) {
              if (source === entry.source && index === entry.index) continue;
              if (++count % 20 === 0)
                await new Promise<void>((resolve) => {
                  const timer = setTimeout(() => {
                    yieldTimers.delete(timer);
                    resolve();
                  }, 0);
                  yieldTimers.add(timer);
                });
              if (!present()) return;
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
          if (present()) {
            selected = selected.map((item) =>
              item.entry === result.entry
                ? { ...item, neighbors, loadingNeighbors: false, skippedNeighbors }
                : item,
            );
            setInspections(selected);
          }
        };
        void findNeighbors().catch(() => {
          if (!current()) return;
          selected = selected.map((item) =>
            item.entry === result.entry
              ? { ...item, loadingNeighbors: false, skippedNeighbors: 1 }
              : item,
          );
          setInspections(selected);
        });
      } catch {
        if (current()) setError("خواندن اطلاعات عارضه ممکن نشد. هندسه آن را بررسی کنید.");
      } finally {
        if (current()) setLoading(false);
      }
    };
    const onClick = (event: MapMouseEvent) => {
      const clickEpoch = epoch;
      queue = queue.then(() => inspect(event, clickEpoch));
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) close();
    };
    map.on("click", onClick);
    window.addEventListener("keydown", onKey);
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
      closeTimer.current = null;
      yieldTimers.forEach(clearTimeout);
      map.off("click", onClick);
      window.removeEventListener("keydown", onKey);
      vertexRef.current?.remove();
      vertexRef.current = null;
      clearOverlay();
      active = false;
      if (sessionRef.current === session) sessionRef.current = null;
    };
  }, [clearVertex, close, enabled, isMapReady, mapRef]);

  const focusInspection = (key: string) => {
    setFocusedKey(key);
    clearVertex();
  };
  const inspection = inspections.find((item) => item.key === focusedKey) ?? inspections[0] ?? null;
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
  return {
    inspection,
    inspections,
    focusInspection,
    removeInspection: (key: string) => sessionRef.current?.remove(key),
    error,
    notice,
    loading,
    selectedVertex,
    selectVertex,
    close,
    isClosing,
  };
}
