import { area } from "@turf/area";
import { booleanIntersects } from "@turf/boolean-intersects";
import { distance } from "@turf/distance";
import { pointToLineDistance } from "@turf/point-to-line-distance";
import type { Feature, GeoJSON, Geometry, Position } from "geojson";

export interface Vertex {
  coordinate: Position;
  path: string;
}
export interface FeatureEntry {
  feature: Feature;
  source: string;
  index: number;
}
export interface Neighbor {
  name: string;
  distanceKm: number;
}

export function featuresOf(data: GeoJSON): Feature[] {
  return data.type === "FeatureCollection"
    ? data.features
    : data.type === "Feature"
      ? [data]
      : [{ type: "Feature", properties: {}, geometry: data }];
}

export function geometryParts(
  geometry: Geometry | null,
  path = "1",
): { vertices: Vertex[]; lines: Position[][]; polygons: Geometry[] } {
  const vertices: Vertex[] = [];
  const lines: Position[][] = [];
  const polygons: Geometry[] = [];
  const add = (positions: Position[], name: string, ring = false) => {
    if (
      !positions.every(
        (p) => Number.isFinite(p[0]) && Number.isFinite(p[1]) && Math.abs(p[1]) <= 90,
      )
    )
      throw new Error("Invalid coordinates");
    const closed =
      ring &&
      positions.length > 1 &&
      positions[0][0] === positions.at(-1)![0] &&
      positions[0][1] === positions.at(-1)![1];
    const unique = closed ? positions.slice(0, -1) : positions;
    unique.forEach((coordinate, index) =>
      vertices.push({ coordinate, path: `${name}.${index + 1}` }),
    );
    if (positions.length > 1)
      lines.push(ring && !closed ? [...positions, positions[0]] : positions);
  };
  if (!geometry) return { vertices, lines, polygons };
  switch (geometry.type) {
    case "Point":
      add([geometry.coordinates], path);
      break;
    case "MultiPoint":
      geometry.coordinates.forEach((p, i) => add([p], `${path}.${i + 1}`));
      break;
    case "LineString":
      add(geometry.coordinates, path);
      break;
    case "MultiLineString":
      geometry.coordinates.forEach((line, i) => add(line, `${path}.${i + 1}`));
      break;
    case "Polygon":
      polygons.push(geometry);
      geometry.coordinates.forEach((ring, i) => add(ring, `${path}.${i + 1}`, true));
      break;
    case "MultiPolygon":
      polygons.push(geometry);
      geometry.coordinates.forEach((polygon, i) =>
        polygon.forEach((ring, j) => add(ring, `${path}.${i + 1}.${j + 1}`, true)),
      );
      break;
    case "GeometryCollection":
      geometry.geometries.forEach((part, i) => {
        const result = geometryParts(part, `${path}.${i + 1}`);
        vertices.push(...result.vertices);
        lines.push(...result.lines);
        polygons.push(...result.polygons);
      });
  }
  return { vertices, lines, polygons };
}

export function featureSummary(feature: Feature) {
  const parts = geometryParts(feature.geometry);
  let lengthKm = 0;
  for (const line of parts.lines)
    for (let i = 1; i < line.length; i++) lengthKm += distance(line[i - 1], line[i]);
  const squareMeters = parts.polygons.length
    ? parts.polygons.reduce((sum, polygon) => sum + area(polygon), 0)
    : null;
  return {
    vertices: parts.vertices,
    squareMeters,
    perimeterKm: parts.polygons.length ? lengthKm : null,
    lengthKm: parts.lines.length ? lengthKm : null,
  };
}

/** Minimum distance between actual geometries, including segment interiors and holes. */
export function featureDistance(a: Feature, b: Feature): number {
  if (!a.geometry || !b.geometry) return Infinity;
  const left = geometryParts(a.geometry),
    right = geometryParts(b.geometry);
  if (!left.vertices.length || !right.vertices.length) return Infinity;
  if (booleanIntersects(a, b)) return 0;
  let nearest = Infinity;
  const fromVertices = (vertices: Vertex[], target: ReturnType<typeof geometryParts>) => {
    for (const { coordinate } of vertices) {
      for (const line of target.lines)
        nearest = Math.min(
          nearest,
          pointToLineDistance(
            coordinate,
            { type: "LineString", coordinates: line },
            { units: "kilometers" },
          ),
        );
      // Isolated points in mixed geometries must also participate.
      for (const other of target.vertices)
        nearest = Math.min(nearest, distance(coordinate, other.coordinate));
    }
  };
  fromVertices(left.vertices, right);
  fromVertices(right.vertices, left);
  return nearest;
}

export function isNeighborDistance(km: number) {
  // A micrometre tolerance keeps an exactly 1 km distance out despite floating-point rounding.
  return Number.isFinite(km) && km >= 0 && km < 1 - 1e-9;
}

export function featureName(entry: FeatureEntry): string {
  const name =
    entry.feature.properties?.name ?? entry.feature.properties?.title ?? entry.feature.id;
  return name == null ? `عارضه ${(entry.index + 1).toLocaleString("fa-IR")}` : String(name);
}

export function resolveFeature(
  features: Feature[],
  hit: { id?: string | number; properties?: Record<string, unknown> | null },
  point: Position,
  toleranceKm: number,
): number {
  const matching = features
    .map((feature, index) => ({ feature, index }))
    .filter(({ feature }) =>
      hit.id !== undefined
        ? hit.id === feature.id
        : hit.properties &&
          Object.keys(hit.properties).length > 0 &&
          Object.entries(hit.properties).every(
            ([key, value]) => feature.properties?.[key] === value,
          ),
    );
  const candidates = matching.length
    ? matching
    : features.map((feature, index) => ({ feature, index })).reverse();
  const clicked: Feature = {
    type: "Feature",
    properties: {},
    geometry: { type: "Point", coordinates: point },
  };
  let selected = -1,
    nearest = Infinity;
  for (const { feature, index } of candidates) {
    try {
      const separation = featureDistance(clicked, feature);
      if (separation <= toleranceKm && separation < nearest) {
        selected = index;
        nearest = separation;
      }
      if (separation === 0) break;
    } catch {
      /* A malformed feature must not prevent selecting valid features. */
    }
  }
  return selected;
}
