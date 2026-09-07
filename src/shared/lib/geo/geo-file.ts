import type { FeatureCollection, Geometry } from "geojson";

export function getGeoJsonBounds(
  geoJson: FeatureCollection,
): [[number, number], [number, number]] | null {
  let west = Number.POSITIVE_INFINITY;
  let south = Number.POSITIVE_INFINITY;
  let east = Number.NEGATIVE_INFINITY;
  let north = Number.NEGATIVE_INFINITY;

  const visitCoordinates = (coordinates: unknown) => {
    if (!Array.isArray(coordinates)) return;

    if (
      coordinates.length >= 2 &&
      typeof coordinates[0] === "number" &&
      typeof coordinates[1] === "number"
    ) {
      west = Math.min(west, coordinates[0]);
      south = Math.min(south, coordinates[1]);
      east = Math.max(east, coordinates[0]);
      north = Math.max(north, coordinates[1]);
      return;
    }

    coordinates.forEach(visitCoordinates);
  };

  const visitGeometry = (geometry: Geometry | null) => {
    if (!geometry) return;

    if (geometry.type === "GeometryCollection") {
      geometry.geometries.forEach(visitGeometry);
      return;
    }

    visitCoordinates(geometry.coordinates);
  };

  geoJson.features.forEach((feature) => visitGeometry(feature.geometry));

  if (![west, south, east, north].every(Number.isFinite)) return null;

  return [
    [west, south],
    [east, north],
  ];
}
