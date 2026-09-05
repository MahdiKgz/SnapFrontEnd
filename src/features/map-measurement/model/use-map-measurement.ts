import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

import type { FeatureCollection } from "geojson";
import { Marker } from "maplibre-gl";
import type { GeoJSONSource, Map as MapLibreMap, MapMouseEvent } from "maplibre-gl";

import { findPolygonAtPoint, measureDistance, measurePolygon } from "./measurement";
import type { Coordinate, MeasurementTool } from "./measurement";

const SOURCE_ID = "snapgis-measurement";
const FILL_ID = "snapgis-measurement-fill";
const LINE_ID = "snapgis-measurement-line";
const emptyData = (): FeatureCollection => ({ type: "FeatureCollection", features: [] });

interface MeasurementState {
  points: Coordinate[];
  result: { value: number; unit: "km" | "m²"; name?: string } | null;
  error: string | null;
  isLoading: boolean;
}

const initialState: MeasurementState = { points: [], result: null, error: null, isLoading: false };

export function useMapMeasurement({
  mapRef,
  isMapReady,
  onActiveChange,
}: {
  mapRef: RefObject<MapLibreMap | null>;
  isMapReady: boolean;
  onActiveChange: (active: boolean) => void;
}) {
  const [tool, setTool] = useState<MeasurementTool | null>(null);
  const [state, setState] = useState(initialState);
  const sessionRef = useRef<{ clear: () => void } | null>(null);

  const reset = useCallback(() => {
    sessionRef.current?.clear();
    setState(initialState);
  }, []);

  const changeTool = useCallback(
    (next: MeasurementTool | null) => {
      reset();
      setTool(next);
      onActiveChange(next !== null);
    },
    [onActiveChange, reset],
  );

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady || !tool) return;
    let active = true;
    let request = 0;
    let points: Coordinate[] = [];
    const markers: Marker[] = [];
    const canvas = map.getCanvas();
    const previousCursor = canvas.style.cursor;
    const zoomOnDoubleClick = map.doubleClickZoom.isEnabled();
    canvas.style.cursor = "crosshair";
    map.doubleClickZoom.disable();
    map.addSource(SOURCE_ID, { type: "geojson", data: emptyData() });
    map.addLayer({
      id: FILL_ID,
      type: "fill",
      source: SOURCE_ID,
      filter: ["==", "$type", "Polygon"],
      paint: { "fill-color": "#0ea5e9", "fill-opacity": 0.22 },
    });
    map.addLayer({
      id: LINE_ID,
      type: "line",
      source: SOURCE_ID,
      paint: {
        "line-color": "#0284c7",
        "line-width": 3,
        ...(tool === "distance" ? { "line-dasharray": [2, 2] } : {}),
      },
    });

    const isCurrent = () => active && mapRef.current === map;
    const draw = (data: FeatureCollection) => {
      if (isCurrent()) (map.getSource(SOURCE_ID) as GeoJSONSource | undefined)?.setData(data);
    };
    const clear = () => {
      request++;
      points = [];
      markers.splice(0).forEach((marker) => marker.remove());
      draw(emptyData());
    };
    const session = { clear };
    sessionRef.current = session;

    const addMarker = (coordinate: Coordinate, label: string) => {
      const marker = new Marker({ color: "#0284c7" }).setLngLat(coordinate).addTo(map);
      const element = marker.getElement();
      element.style.pointerEvents = "none";
      element.setAttribute("role", "img");
      element.setAttribute("aria-label", label);
      markers.push(marker);
    };

    const selectPolygon = async (event: MapMouseEvent, coordinate: Coordinate) => {
      clear();
      const selection = request;
      setState({ ...initialState, isLoading: true });
      try {
        const hits = map
          .queryRenderedFeatures(event.point)
          .filter(
            (hit) =>
              hit.source !== SOURCE_ID &&
              (hit.geometry.type === "Polygon" || hit.geometry.type === "MultiPolygon"),
          );
        const loaded = new Map<string, Awaited<ReturnType<GeoJSONSource["getData"]>>>();
        for (const hit of hits) {
          if (!isCurrent() || request !== selection) return;
          const source = map.getSource(hit.source);
          if (!source || source.type !== "geojson") continue;
          let data = loaded.get(hit.source);
          if (!data) {
            data = await (source as GeoJSONSource).getData();
            loaded.set(hit.source, data);
          }
          if (!isCurrent() || request !== selection) return;
          const polygon = findPolygonAtPoint(data, coordinate, hit);
          if (!polygon) continue;
          const { squareMeters, perimeterKm } = measurePolygon(polygon);
          draw({ type: "FeatureCollection", features: [polygon] });
          addMarker(coordinate, "محل انتخاب عارضه برای اندازه‌گیری");
          const name = polygon.properties?.name;
          setState({
            points: [coordinate],
            error: null,
            isLoading: false,
            result: {
              value: tool === "area" ? squareMeters : perimeterKm,
              unit: tool === "area" ? "m²" : "km",
              name: typeof name === "string" ? name : undefined,
            },
          });
          return;
        }
        if (isCurrent() && request === selection)
          setState({
            ...initialState,
            error:
              "در این نقطه عارضه سطحی پیدا نشد. روی یک عارضه در لایه‌های بارگذاری‌شده کلیک کنید.",
          });
      } catch {
        if (isCurrent() && request === selection)
          setState({
            ...initialState,
            error:
              "اندازه‌گیری این عارضه ممکن نشد. هندسه آن را بررسی کنید یا عارضه دیگری انتخاب کنید.",
          });
      }
    };

    const onClick = (event: MapMouseEvent) => {
      if (!isCurrent()) return;
      const coordinate: Coordinate = [event.lngLat.lng, event.lngLat.lat];
      if (tool !== "distance") {
        void selectPolygon(event, coordinate);
        return;
      }
      if (points.length === 2) clear();
      points.push(coordinate);
      addMarker(
        coordinate,
        points.length === 1 ? "نقطه آغاز اندازه‌گیری" : "نقطه پایان اندازه‌گیری",
      );
      if (points.length === 1) {
        setState({ ...initialState, points: [...points] });
        return;
      }
      draw({
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            properties: {},
            geometry: { type: "LineString", coordinates: points },
          },
        ],
      });
      setState({
        ...initialState,
        points: [...points],
        result: { value: measureDistance(points[0], points[1]), unit: "km" },
      });
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.defaultPrevented) changeTool(null);
    };
    map.on("click", onClick);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      active = false;
      request++;
      map.off("click", onClick);
      window.removeEventListener("keydown", onKeyDown);
      markers.forEach((marker) => marker.remove());
      if (sessionRef.current === session) sessionRef.current = null;
      canvas.style.cursor = previousCursor;
      // eslint-disable-next-line react-hooks/exhaustive-deps -- The current map may already have been removed by its owner.
      if (mapRef.current !== map) return;
      if (zoomOnDoubleClick) map.doubleClickZoom.enable();
      if (map.getLayer(LINE_ID)) map.removeLayer(LINE_ID);
      if (map.getLayer(FILL_ID)) map.removeLayer(FILL_ID);
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
    };
  }, [changeTool, isMapReady, mapRef, tool]);

  return { tool, state, changeTool, reset };
}
