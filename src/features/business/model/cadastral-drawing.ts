import { area } from "@turf/area";
import { distance } from "@turf/distance";
import { kinks } from "@turf/kinks";
import type { Feature, FeatureCollection, LineString, Polygon } from "geojson";
import { MercatorCoordinate } from "maplibre-gl";

export type Vertex = [number, number];
export type Shape = { id: string; kind: "line" | "parcel"; vertices: Vertex[] };
export type Drawing = { revision: number; features: Shape[] };
export type Mode = "select" | "line" | "parcel" | "rectangle";

export const equal = ([x, y]: Vertex, [otherX, otherY]: Vertex) => x === otherX && y === otherY;
export const MIN_VERTICES = { line: 2, parcel: 3 };
export const MAX_SHAPES = 500;
export const MAX_SHAPE_VERTICES = 1000;
export const MAX_DRAWING_VERTICES = 8000;

export const rectangle = ([x, y]: Vertex, [endX, endY]: Vertex): Vertex[] => [
  [x, y],
  [endX, y],
  [endX, endY],
  [x, endY],
];

export function signedArea(vertices: Vertex[]) {
  const [originX, originY] = vertices[0];
  return vertices.reduce((sum, [x, y], index) => {
    const [nextX, nextY] = vertices[(index + 1) % vertices.length];
    return sum + (x - originX) * (nextY - originY) - (y - originY) * (nextX - originX);
  }, 0);
}

export function shapeFeature(shape: Shape, selected?: boolean): Feature<Polygon | LineString> {
  const { id, kind, vertices } = shape;
  const ring = kind === "parcel" && signedArea(vertices) < 0 ? [...vertices].reverse() : vertices;
  return {
    type: "Feature",
    id,
    properties: { id, kind, ...(selected === undefined ? {} : { selected }) },
    geometry:
      kind === "parcel"
        ? { type: "Polygon", coordinates: [[...ring, ring[0]]] }
        : { type: "LineString", coordinates: vertices },
  };
}

export function validShape(shape: Shape) {
  const { kind, vertices } = shape;
  if (
    vertices.length < MIN_VERTICES[kind] ||
    vertices.length > MAX_SHAPE_VERTICES ||
    new Set(vertices.map((position) => position.join(","))).size !== vertices.length ||
    vertices.some(
      ([x, y]) =>
        !Number.isFinite(x) || !Number.isFinite(y) || Math.abs(x) > 180 || Math.abs(y) > 85.051129,
    )
  )
    return false;
  return (
    kind === "line" || (signedArea(vertices) !== 0 && !kinks(shapeFeature(shape)).features.length)
  );
}

export function drawingGeoJson(shapes: Shape[]): FeatureCollection<Polygon | LineString> {
  return { type: "FeatureCollection", features: shapes.map((shape) => shapeFeature(shape)) };
}

export function dimensions(shape: Shape) {
  const feature = shapeFeature(shape);
  const points =
    feature.geometry.type === "Polygon"
      ? feature.geometry.coordinates[0]
      : feature.geometry.coordinates;
  const meters = points
    .slice(1)
    .reduce(
      (total, point, index) => total + distance(points[index], point, { units: "meters" }),
      0,
    );
  return { meters, squareMeters: shape.kind === "parcel" ? area(feature) : undefined };
}

export function nearestOnSegment(point: Vertex, start: Vertex, end: Vertex): Vertex {
  const dx = end[0] - start[0],
    dy = end[1] - start[1];
  const lengthSquared = dx * dx + dy * dy;
  if (!lengthSquared) return start;
  const along = Math.max(
    0,
    Math.min(1, ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) / lengthSquared),
  );
  return [start[0] + along * dx, start[1] + along * dy];
}

export function orthogonalPoint(
  origin: Vertex,
  point: Vertex,
  project: (coordinate: Vertex) => Vertex,
): Vertex {
  const horizontal: Vertex = [point[0], origin[1]];
  const vertical: Vertex = [origin[0], point[1]];
  const [px, py] = project(point);
  const [hx, hy] = project(horizontal);
  const [vx, vy] = project(vertical);
  return Math.hypot(px - hx, py - hy) <= Math.hypot(px - vx, py - vy) ? horizontal : vertical;
}

const vector = (from: Vertex, to: Vertex): Vertex => [to[0] - from[0], to[1] - from[1]];
const cross = ([x, y]: Vertex, [otherX, otherY]: Vertex) => x * otherY - y * otherX;
const mercator = (point: Vertex): Vertex => {
  const { x, y } = MercatorCoordinate.fromLngLat(point);
  return [x, y];
};

export function completeAtIntersection(vertices: Vertex[]): Vertex[] | undefined {
  if (vertices.length < 4) return undefined;
  const [first, second] = vertices;
  const [penultimate, last] = vertices.slice(-2);
  // Extend the two free ends away from the vertices that must remain in the parcel.
  const start = mercator(second);
  const end = mercator(penultimate);
  const firstDirection = vector(start, mercator(first));
  const lastDirection = vector(end, mercator(last));
  const determinant = cross(firstDirection, lastDirection);
  const scale = Math.hypot(...firstDirection) * Math.hypot(...lastDirection);
  if (!scale || Math.abs(determinant) < Math.sin(Math.PI / 180) * scale) return undefined;
  const delta = vector(start, end);
  const alongFirst = cross(delta, lastDirection) / determinant;
  const alongLast = cross(delta, firstDirection) / determinant;
  // A corner can trim either end, or extend it by up to two edge lengths.
  if (alongFirst <= 0 || alongLast <= 0 || alongFirst > 3 || alongLast > 3) return undefined;
  const corner = new MercatorCoordinate(
    start[0] + alongFirst * firstDirection[0],
    start[1] + alongFirst * firstDirection[1],
    0,
  )
    .toLngLat()
    .toArray();
  const completed = [corner, ...vertices.slice(1, -1)];
  return validShape({ id: "intersection-preview", kind: "parcel", vertices: completed })
    ? completed
    : undefined;
}
