import { type RefObject, useEffect, useEffectEvent } from "react";

import type { Feature, FeatureCollection } from "geojson";
import type { ExpressionSpecification, GeoJSONSource, Map, MapMouseEvent } from "maplibre-gl";

import {
  type Mode,
  type Shape,
  type Vertex,
  equal,
  nearestOnSegment,
  orthogonalPoint,
  rectangle,
  shapeFeature,
} from "./cadastral-drawing";

const DRAWN = "cadastral-drawn";
const PREVIEW = "cadastral-preview";
const FILL = "cadastral-fill";
const STROKE = "cadastral-stroke";
const GUIDE = "cadastral-guide";
const POINTS = "cadastral-points";
const PREVIEW_FILL = "cadastral-preview-fill";
const hitLayers = [FILL, STROKE];
const layerIds = [FILL, STROKE, PREVIEW_FILL, GUIDE, POINTS];
const SNAP = 12;
const empty: FeatureCollection = { type: "FeatureCollection", features: [] };
const collection = (features: Feature[]): FeatureCollection => ({
  type: "FeatureCollection",
  features,
});
const pointFeature = (coordinates: Vertex, role: string): Feature => ({
  type: "Feature",
  properties: { role },
  geometry: { type: "Point", coordinates },
});
const lineFeature = (coordinates: Vertex[]): Feature => ({
  type: "Feature",
  properties: {},
  geometry: { type: "LineString", coordinates },
});
const polygonFeature = (vertices: Vertex[]): Feature => ({
  type: "Feature",
  properties: {},
  geometry: { type: "Polygon", coordinates: [[...vertices, vertices[0]]] },
});

const xy = ({ x, y }: { x: number; y: number }): Vertex => [x, y];
const project = (map: Map, point: Vertex): Vertex => xy(map.project(point));
const unproject = (map: Map, point: Vertex): Vertex => map.unproject(point).wrap().toArray();
const pixelDistance = (a: Vertex, b: Vertex) => Math.hypot(a[0] - b[0], a[1] - b[1]);

function pickIds(map: Map, [x, y]: Vertex, margin: number) {
  return new Set(
    map
      .queryRenderedFeatures(
        [
          [x - margin, y - margin],
          [x + margin, y + margin],
        ],
        {
          layers: hitLayers,
        },
      )
      .map(({ properties }) => properties.id as string),
  );
}

function snapCoordinate(
  map: Map,
  screen: Vertex,
  shapes: Shape[],
  extra: Vertex[],
  excluded?: string,
): { position: Vertex; snapped: boolean } {
  const near = pickIds(map, screen, SNAP);
  let vertex: { position: Vertex; distance: number } | undefined;
  let edge: { point: Vertex; distance: number } | undefined;
  const checkVertex = (position: Vertex, projected: Vertex) => {
    const distance = pixelDistance(screen, projected);
    if (distance <= SNAP && (!vertex || distance < vertex.distance))
      vertex = { position, distance };
  };
  extra.forEach((position) => checkVertex(position, project(map, position)));
  for (const shape of shapes) {
    if (shape.id === excluded || !near.has(shape.id)) continue;
    const projected = shape.vertices.map((position) => project(map, position));
    projected.forEach((start, index) => {
      checkVertex(shape.vertices[index], start);
      const end = projected[index + 1] ?? (shape.kind === "parcel" ? projected[0] : undefined);
      if (!end) return;
      const point = nearestOnSegment(screen, start, end);
      const distance = pixelDistance(screen, point);
      if (distance <= SNAP && (!edge || distance < edge.distance)) edge = { point, distance };
    });
  }
  if (vertex) return { position: vertex.position, snapped: true };
  if (edge) return { position: unproject(map, edge.point), snapped: true };
  return { position: unproject(map, screen), snapped: false };
}

function draftFeatures(
  mode: Mode,
  vertices: Vertex[],
  pointer?: Vertex,
  snapped = false,
): Feature[] {
  const points = vertices.map((vertex) => pointFeature(vertex, "vertex"));
  if (pointer && snapped) points.push(pointFeature(pointer, "snap"));
  if (!vertices.length) return points;
  const path =
    pointer && !equal(pointer, vertices[vertices.length - 1]) ? [...vertices, pointer] : vertices;
  if (path.length < 2) return points;
  if (mode === "rectangle") {
    const corners = rectangle(path[0], path[1]);
    if (corners[0][0] !== corners[2][0] && corners[0][1] !== corners[2][1])
      points.push(polygonFeature(corners));
    else points.push(lineFeature(path));
  } else if (mode === "parcel" && path.length >= 3) {
    points.push(polygonFeature(path));
  } else {
    points.push(lineFeature(path));
  }
  return points;
}

interface Options {
  mapRef: RefObject<Map | null>;
  active: boolean;
  mode: Mode;
  shapes: Shape[];
  vertices: Vertex[];
  intersection?: Vertex[];
  selected?: Shape;
  snapping: boolean;
  ortho: boolean;
  onPoint: (point: Vertex) => void;
  onSelect: (id?: string) => void;
  onMoveVertex: (id: string, index: number, point: Vertex) => void;
}

export function useCadastralMap(options: Options) {
  const { mapRef, active, shapes, selected, vertices, intersection, mode } = options;
  const current = useEffectEvent(() => options);
  useEffect(() => {
    const map = mapRef.current;
    if (!active || !map) return;
    map.addSource(DRAWN, { type: "geojson", data: empty, tolerance: 0, maxzoom: 24 });
    map.addSource(PREVIEW, { type: "geojson", data: empty, tolerance: 0, maxzoom: 24 });
    const color: ExpressionSpecification = [
      "case",
      ["boolean", ["get", "selected"], false],
      "#f59e0b",
      "#0ea5e9",
    ];
    map.addLayer({
      id: FILL,
      source: DRAWN,
      type: "fill",
      paint: { "fill-color": color, "fill-opacity": 0.22 },
    });
    map.addLayer({
      id: STROKE,
      source: DRAWN,
      type: "line",
      paint: { "line-color": color, "line-width": 3 },
    });
    map.addLayer({
      id: PREVIEW_FILL,
      source: PREVIEW,
      type: "fill",
      paint: { "fill-color": "#f59e0b", "fill-opacity": 0.18 },
    });
    map.addLayer({
      id: GUIDE,
      source: PREVIEW,
      type: "line",
      paint: { "line-color": "#fbbf24", "line-width": 3, "line-dasharray": [2, 1] },
    });
    map.addLayer({
      id: POINTS,
      source: PREVIEW,
      type: "circle",
      paint: {
        "circle-radius": ["case", ["==", ["get", "role"], "snap"], 8, 5],
        "circle-color": ["case", ["==", ["get", "role"], "snap"], "#22c55e", "#f59e0b"],
        "circle-stroke-color": "#fff",
        "circle-stroke-width": 2,
      },
    });

    const canvas = map.getCanvas();
    const surface = map.getCanvasContainer();
    const previousCursor = canvas.style.cursor;
    const doubleClickZoom = map.doubleClickZoom.isEnabled();
    if (doubleClickZoom) map.doubleClickZoom.disable();
    const preview = (features: Feature[]) =>
      map.getSource<GeoJSONSource>(PREVIEW)?.setData(collection(features));
    let drag:
      | { shape: Shape; index: number; pointerId: number; panEnabled: boolean; start: Vertex }
      | undefined;
    let frame = 0;
    let ignoreClickUntil = 0;

    const setOriginalVisible = (id?: string) => {
      for (const layer of hitLayers) map.setFilter(layer, id ? ["!=", ["get", "id"], id] : null);
    };
    const coordinate = (screen: Vertex, shift: boolean, excluded?: string) => {
      const state = current();
      const origin = state.vertices[state.vertices.length - 1];
      const extra =
        state.mode === "parcel" && state.vertices.length >= 3 ? [state.vertices[0]] : [];
      const target = state.snapping
        ? snapCoordinate(map, screen, state.shapes, extra, excluded)
        : { position: unproject(map, screen), snapped: false };
      if (
        target.snapped ||
        excluded ||
        !origin ||
        state.mode === "rectangle" ||
        !(state.ortho || shift)
      )
        return target;
      return {
        position: orthogonalPoint(origin, target.position, (point) => project(map, point)),
        snapped: false,
      };
    };
    const handles = (shape?: Shape) =>
      shape?.vertices.map((point) => pointFeature(point, "vertex")) ?? [];
    const click = (event: MapMouseEvent) => {
      if (drag || performance.now() < ignoreClickUntil) return;
      const state = current();
      if (state.intersection) return;
      if (state.mode === "select")
        state.onSelect(pickIds(map, xy(event.point), 6).values().next().value);
      else state.onPoint(coordinate(xy(event.point), event.originalEvent.shiftKey).position);
    };
    const move = (event: MapMouseEvent) => {
      if (drag) return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const state = current();
        if (state.intersection) return;
        if (state.mode === "select") {
          canvas.style.cursor = state.selected?.vertices.some(
            (vertex) => pixelDistance(project(map, vertex), xy(event.point)) <= 9,
          )
            ? "grab"
            : previousCursor;
          return;
        }
        canvas.style.cursor = "crosshair";
        const { position, snapped } = coordinate(xy(event.point), event.originalEvent.shiftKey);
        preview(draftFeatures(state.mode, state.vertices, position, snapped));
      });
    };
    const screenPoint = (event: PointerEvent): Vertex => {
      const rect = canvas.getBoundingClientRect();
      return [event.clientX - rect.left, event.clientY - rect.top];
    };
    const down = (event: PointerEvent) => {
      const state = current();
      if (event.button !== 0 || drag || state.mode !== "select" || !state.selected) return;
      const start = screenPoint(event);
      const index = state.selected.vertices.findIndex(
        (vertex) =>
          pixelDistance(start, project(map, vertex)) <= (event.pointerType === "touch" ? 16 : 9),
      );
      if (index < 0) return;
      event.preventDefault();
      event.stopPropagation();
      cancelAnimationFrame(frame);
      map.stop();
      const panEnabled = map.dragPan.isEnabled();
      if (panEnabled) map.dragPan.disable();
      drag = { shape: state.selected, index, pointerId: event.pointerId, panEnabled, start };
      surface.setPointerCapture(event.pointerId);
      canvas.style.cursor = "grabbing";
      setOriginalVisible(drag.shape.id);
    };
    const dragMove = (event: PointerEvent) => {
      if (drag?.pointerId !== event.pointerId) return;
      event.preventDefault();
      event.stopPropagation();
      const screen = screenPoint(event);
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (!drag) return;
        const { shape, index } = drag;
        const { position, snapped } = coordinate(screen, false, shape.id);
        const vertices = shape.vertices.map((vertex, i) => (i === index ? position : vertex));
        const geometry = shape.kind === "parcel" ? polygonFeature(vertices) : lineFeature(vertices);
        preview([
          geometry,
          ...handles({ ...shape, vertices }),
          ...(snapped ? [pointFeature(position, "snap")] : []),
        ]);
      });
    };
    const release = (event?: PointerEvent) => {
      if (!drag || (event && drag.pointerId !== event.pointerId)) return;
      const { shape, index, pointerId, start, panEnabled } = drag;
      drag = undefined;
      cancelAnimationFrame(frame);
      if (surface.hasPointerCapture(pointerId)) surface.releasePointerCapture(pointerId);
      if (panEnabled) map.dragPan.enable();
      canvas.style.cursor = previousCursor;
      if (mapRef.current !== map) return;
      setOriginalVisible();
      preview(handles(current().selected));
      if (event?.type === "pointerup") {
        ignoreClickUntil = performance.now() + 200;
        const screen = screenPoint(event);
        if (pixelDistance(start, screen) >= 2)
          current().onMoveVertex(shape.id, index, coordinate(screen, false, shape.id).position);
      }
    };
    const leave = () => {
      if (drag) return;
      cancelAnimationFrame(frame);
      const state = current();
      if (state.intersection) return;
      preview(
        state.mode === "select"
          ? handles(state.selected)
          : draftFeatures(state.mode, state.vertices),
      );
    };
    const escapeDrag = (event: KeyboardEvent) => {
      if (event.key === "Escape") release();
    };
    window.addEventListener("keydown", escapeDrag);
    map.on("click", click);
    map.on("mousemove", move);
    canvas.addEventListener("mouseleave", leave);
    surface.addEventListener("pointerdown", down, true);
    surface.addEventListener("pointermove", dragMove, true);
    surface.addEventListener("pointerup", release, true);
    surface.addEventListener("pointercancel", release, true);
    surface.addEventListener("lostpointercapture", release);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", escapeDrag);
      canvas.style.cursor = previousCursor;
      canvas.removeEventListener("mouseleave", leave);
      surface.removeEventListener("pointerdown", down, true);
      surface.removeEventListener("pointermove", dragMove, true);
      surface.removeEventListener("pointerup", release, true);
      surface.removeEventListener("pointercancel", release, true);
      surface.removeEventListener("lostpointercapture", release);
      release();
      if (mapRef.current !== map) return;
      if (doubleClickZoom) map.doubleClickZoom.enable();
      map.off("click", click);
      map.off("mousemove", move);
      for (const id of [...layerIds].reverse()) if (map.getLayer(id)) map.removeLayer(id);
      for (const id of [PREVIEW, DRAWN]) if (map.getSource(id)) map.removeSource(id);
    };
  }, [active, mapRef]);

  useEffect(() => {
    if (!active) return;
    const map = mapRef.current;
    map
      ?.getSource<GeoJSONSource>(DRAWN)
      ?.setData(collection(shapes.map((shape) => shapeFeature(shape, shape.id === selected?.id))));
    map
      ?.getSource<GeoJSONSource>(PREVIEW)
      ?.setData(
        collection(
          mode === "select"
            ? (selected?.vertices.map((vertex) => pointFeature(vertex, "vertex")) ?? [])
            : intersection
              ? [polygonFeature(intersection), pointFeature(intersection[0], "snap")]
              : draftFeatures(mode, vertices),
        ),
      );
    if (map) map.getCanvas().style.cursor = mode === "select" ? "" : "crosshair";
  }, [active, intersection, mapRef, mode, selected, shapes, vertices]);
}
