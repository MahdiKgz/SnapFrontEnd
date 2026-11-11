import type { MultiPolygon, Polygon, Position } from "geojson";

export type ParcelGeometry = Polygon | MultiPolygon;
export interface ParcelVertex {
  polygon: number;
  ring: number;
  vertex: number;
}

export const parcelPolygons = (geometry: ParcelGeometry): Position[][][] =>
  geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;

const equalPosition = (a: Position, b: Position) =>
  a.length === b.length && a.every((value, index) => value === b[index]);

export function editableRings(geometry: ParcelGeometry) {
  const polygons = parcelPolygons(geometry);
  return (Array.isArray(polygons) ? polygons : []).map((polygon) =>
    (Array.isArray(polygon) ? polygon : []).map((ring) => {
      const positions = (Array.isArray(ring) ? ring : []).filter(
        (position) =>
          Array.isArray(position) &&
          position.length >= 2 &&
          position.every(Number.isFinite) &&
          Math.abs(position[0]) <= 180 &&
          Math.abs(position[1]) <= 90,
      );
      const last = positions.at(-1);
      return positions.length > 1 && last && equalPosition(positions[0], last)
        ? positions.slice(0, -1)
        : positions;
    }),
  );
}

export function closeParcelRings(
  type: ParcelGeometry["type"],
  polygons: Position[][][],
): ParcelGeometry {
  const closed = polygons.map((polygon) =>
    polygon.map((ring) => (ring.length ? [...ring, ring[0]] : ring)),
  );
  return type === "Polygon"
    ? { type, coordinates: closed[0] ?? [] }
    : { type, coordinates: closed };
}

export function updateParcelRing(
  polygons: Position[][][],
  address: ParcelVertex,
  update: (ring: Position[]) => Position[],
) {
  return polygons.map((polygon, index) =>
    index === address.polygon
      ? polygon.map((ring, index) => (index === address.ring ? update(ring) : ring))
      : polygon,
  );
}
