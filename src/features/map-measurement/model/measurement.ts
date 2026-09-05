import { area } from "@turf/area";
import { booleanPointInPolygon } from "@turf/boolean-point-in-polygon";
import { distance } from "@turf/distance";
import type { Feature, GeoJSON, Geometry, MultiPolygon, Position } from "geojson";

export type MeasurementTool = "distance" | "area" | "perimeter";
export type Coordinate = [number, number];
export type MeasuredPolygon = Feature<MultiPolygon>;

function closeRing(ring: Position[], referenceLongitude?: number): Position[] {
  if (ring.length < 3) throw new Error("Invalid polygon ring");
  let previousLongitude = referenceLongitude ?? ring[0][0];
  const normalized = ring.map(([longitude, latitude]) => {
    if (!Number.isFinite(longitude) || !Number.isFinite(latitude) || Math.abs(latitude) > 90) {
      throw new Error("Invalid polygon coordinate");
    }
    const unwrapped = longitude + 360 * Math.round((previousLongitude - longitude) / 360);
    previousLongitude = unwrapped;
    return [unwrapped, latitude];
  });
  const first = normalized[0];
  const last = normalized[normalized.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) normalized.push([...first]);
  return normalized;
}

function polygonCoordinates(geometry: Geometry | null): Position[][][] {
  if (!geometry) return [];
  if (geometry.type === "GeometryCollection")
    return geometry.geometries.flatMap(polygonCoordinates);
  if (geometry.type !== "Polygon" && geometry.type !== "MultiPolygon") return [];
  const polygons = geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;
  return polygons.map((rings) => {
    if (!rings.length) throw new Error("Empty polygon");
    const exterior = closeRing(rings[0]);
    return [exterior, ...rings.slice(1).map((ring) => closeRing(ring, exterior[0][0]))];
  });
}

/** Resolve the complete feature, rather than the clipped geometry returned by rendered tiles. */
export function findPolygonAtPoint(
  data: GeoJSON,
  coordinate: Coordinate,
  identity?: { id?: string | number; properties?: Record<string, unknown> | null },
): MeasuredPolygon | null {
  const features: Feature[] =
    data.type === "FeatureCollection"
      ? data.features
      : data.type === "Feature"
        ? [data]
        : [{ type: "Feature", geometry: data, properties: {} }];
  const ordered = [...features].reverse();
  const preferred = ordered.filter((feature) =>
    identity?.id !== undefined
      ? feature.id === identity.id
      : identity?.properties &&
        Object.keys(identity.properties).length > 0 &&
        Object.entries(identity.properties).every(
          ([key, value]) => feature.properties?.[key] === value,
        ),
  );

  for (const feature of [...preferred, ...ordered.filter((item) => !preferred.includes(item))]) {
    const coordinates = polygonCoordinates(feature.geometry);
    if (!coordinates.length) continue;
    const containsPoint = coordinates.some((rings) => {
      const longitude = coordinate[0] + 360 * Math.round((rings[0][0][0] - coordinate[0]) / 360);
      return booleanPointInPolygon([longitude, coordinate[1]], {
        type: "Polygon",
        coordinates: rings,
      });
    });
    if (containsPoint) {
      return { ...feature, geometry: { type: "MultiPolygon", coordinates } };
    }
  }
  return null;
}

export function measureDistance(from: Coordinate, to: Coordinate): number {
  return distance(from, to, { units: "kilometers" });
}

export function measurePolygon(feature: MeasuredPolygon) {
  const squareMeters = area(feature);
  let perimeterKm = 0;
  for (const polygon of feature.geometry.coordinates) {
    for (const ring of polygon) {
      for (let index = 1; index < ring.length; index++) {
        perimeterKm += distance(ring[index - 1], ring[index], { units: "kilometers" });
      }
    }
  }
  if (
    !Number.isFinite(squareMeters) ||
    !Number.isFinite(perimeterKm) ||
    squareMeters <= 0 ||
    perimeterKm <= 0
  ) {
    throw new Error("Polygon cannot be measured");
  }
  return { squareMeters, perimeterKm };
}
