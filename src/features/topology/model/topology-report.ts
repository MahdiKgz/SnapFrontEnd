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

export function prepareAffectedFeatureCollection(
  featureCollection: AffectedFeatureCollection,
): FeatureCollection<Geometry, GeoJsonProperties> {
  return {
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
}

export function getSelectedFeatureCollection(
  featureCollection: AffectedFeatureCollection,
  selectedFeatureIndexes: number[],
): FeatureCollection<Geometry, GeoJsonProperties> {
  const preparedFeatures = prepareAffectedFeatureCollection(featureCollection);

  if (selectedFeatureIndexes.length === 0) {
    return {
      type: "FeatureCollection",
      features: [],
    };
  }

  const selectedIndexes = new Set(selectedFeatureIndexes);

  return {
    type: "FeatureCollection",
    features: preparedFeatures.features.filter((feature) =>
      selectedIndexes.has(Number(feature.properties?.[FEATURE_INDEX_PROPERTY])),
    ),
  };
}
