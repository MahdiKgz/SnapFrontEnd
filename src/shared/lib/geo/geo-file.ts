import { kml } from "@tmcw/togeojson";
import { strFromU8, unzipSync } from "fflate";
import type { Feature, FeatureCollection, GeoJsonObject, Geometry } from "geojson";

function parseKmlText(kmlText: string): FeatureCollection {
  const document = new DOMParser().parseFromString(kmlText, "application/xml");

  if (document.querySelector("parsererror")) {
    throw new Error("The KML document is not valid XML.");
  }

  return kml(document, { skipNullGeometry: true }) as FeatureCollection;
}

function normalizeGeoJson(value: unknown): FeatureCollection {
  if (!value || typeof value !== "object" || !("type" in value)) {
    throw new Error("The file does not contain valid GeoJSON.");
  }

  const geoJson = value as GeoJsonObject;

  if (geoJson.type === "FeatureCollection") {
    return geoJson as FeatureCollection;
  }

  if (geoJson.type === "Feature") {
    return {
      type: "FeatureCollection",
      features: [geoJson as Feature],
    };
  }

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: geoJson as Geometry,
      },
    ],
  };
}

export async function parseGeoFile(file: File): Promise<FeatureCollection> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "json" || extension === "geojson") {
    return normalizeGeoJson(JSON.parse(await file.text()) as unknown);
  }

  if (extension === "kml") {
    return parseKmlText(await file.text());
  }

  if (extension === "kmz") {
    const entries = unzipSync(new Uint8Array(await file.arrayBuffer()));
    const kmlEntry = Object.entries(entries).find(([name]) => name.toLowerCase().endsWith(".kml"));

    if (!kmlEntry) {
      throw new Error("The KMZ archive does not contain a KML file.");
    }

    return parseKmlText(strFromU8(kmlEntry[1]));
  }

  throw new Error("Unsupported geospatial file type.");
}

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
