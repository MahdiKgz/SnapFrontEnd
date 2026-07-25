import type { Feature, FeatureCollection, GeoJsonProperties, Geometry } from "geojson";

import type { AffectedFeatureCollection, TopologyIssue, TopologyUploadData } from "./types";

export const FEATURE_INDEX_PROPERTY = "__snapgisFeatureIndex";

export interface TopologyFeatureReport {
  featureIndex: number;
  featureId: string;
  name: string;
  geometryType: string;
  issues: TopologyIssue[];
}

function getFeatureIndex(
  feature: AffectedFeatureCollection["features"][number],
  fallbackIndex: number,
) {
  if (typeof feature.snapgisFeatureIndex === "number") return feature.snapgisFeatureIndex;

  const propertyIndex = feature.properties?.snapgisFeatureIndex;
  return typeof propertyIndex === "number" ? propertyIndex : fallbackIndex;
}

export function buildFeatureReports(data: TopologyUploadData): TopologyFeatureReport[] {
  const issuesByFeature = new Map<number, TopologyIssue[]>();

  data.report.issues.forEach((issue) => {
    const issues = issuesByFeature.get(issue.featureIndex) ?? [];
    issues.push(issue);
    issuesByFeature.set(issue.featureIndex, issues);
  });

  return data.report.affectedFeatureCollection.features.map((feature, fallbackIndex) => {
    const featureIndex = getFeatureIndex(feature, fallbackIndex);
    const issues = issuesByFeature.get(featureIndex) ?? [];
    const featureId = feature.id ?? issues[0]?.featureId ?? featureIndex;
    const propertyName = feature.properties?.name;

    return {
      featureIndex,
      featureId: String(featureId),
      name: typeof propertyName === "string" ? propertyName : `عارضه ${featureIndex + 1}`,
      geometryType: feature.geometry?.type ?? issues[0]?.geometryType ?? "Unknown",
      issues,
    };
  });
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
  selectedFeatureIndex: number | null,
): FeatureCollection<Geometry, GeoJsonProperties> {
  const preparedFeatures = prepareAffectedFeatureCollection(featureCollection);

  if (selectedFeatureIndex === null) {
    return {
      type: "FeatureCollection",
      features: [],
    };
  }

  return {
    type: "FeatureCollection",
    features: preparedFeatures.features.filter(
      (feature) => feature.properties?.[FEATURE_INDEX_PROPERTY] === selectedFeatureIndex,
    ),
  };
}
