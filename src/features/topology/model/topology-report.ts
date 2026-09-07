import type { Feature, FeatureCollection, GeoJsonProperties, Geometry } from "geojson";

import type { AffectedFeatureCollection } from "./types";

export const FEATURE_INDEX_PROPERTY = "__snapgisFeatureIndex";

function getFeatureIndex(
  feature: AffectedFeatureCollection["features"][number],
  fallbackIndex: number,
) {
  if (typeof feature.snapgisFeatureIndex === "number") return feature.snapgisFeatureIndex;

  const propertyIndex = feature.properties?.snapgisFeatureIndex;
  return typeof propertyIndex === "number" ? propertyIndex : fallbackIndex;
}

const preparedCollections = new WeakMap<
  AffectedFeatureCollection,
  FeatureCollection<Geometry, GeoJsonProperties>
>();
export function prepareAffectedFeatureCollection(
  featureCollection: AffectedFeatureCollection,
): FeatureCollection<Geometry, GeoJsonProperties> {
  const cached = preparedCollections.get(featureCollection);
  if (cached) return cached;
  const prepared: FeatureCollection<Geometry, GeoJsonProperties> = {
    type: "FeatureCollection",
    features: featureCollection.features.map((feature, fallbackIndex) => {
      const normalizedFeature: Feature<Geometry, GeoJsonProperties> = {
        type: "Feature",
        geometry: feature.geometry,
        properties: {
          ...(feature.properties ?? {}),
          [FEATURE_INDEX_PROPERTY]: getFeatureIndex(feature, fallbackIndex),
        },
      };

      if (feature.id !== undefined) normalizedFeature.id = feature.id;
      if (feature.bbox !== undefined) normalizedFeature.bbox = feature.bbox;

      return normalizedFeature;
    }),
  };
  preparedCollections.set(featureCollection, prepared);
  return prepared;
}

export function getSelectedFeatureCollection(
  featureCollection: AffectedFeatureCollection,
  selectedFeatureIndexes: number[],
): FeatureCollection<Geometry, GeoJsonProperties> {
  if (selectedFeatureIndexes.length === 0) {
    return {
      type: "FeatureCollection",
      features: [],
    };
  }

  const preparedFeatures = prepareAffectedFeatureCollection(featureCollection);
  const selectedIndexes = new Set(selectedFeatureIndexes);

  return {
    type: "FeatureCollection",
    features: preparedFeatures.features.filter((feature) =>
      selectedIndexes.has(Number(feature.properties?.[FEATURE_INDEX_PROPERTY])),
    ),
  };
}
