import { describe, expect, it } from "vitest";

import {
  FEATURE_INDEX_PROPERTY,
  buildFeatureReports,
  getSelectedFeatureCollection,
  prepareAffectedFeatureCollection,
} from "./topology-report";
import type { TopologyIssue, TopologyUploadData } from "./types";

function createIssue(featureIndex: number, code: string): TopologyIssue {
  return {
    check: "coordinatePrecision",
    code,
    featureIndex,
    featureId: `parcel-${featureIndex}`,
    geometryType: "Polygon",
    location: {
      geometryCollectionPath: [],
      coordinatePath: [0, 1],
      relatedCoordinatePath: null,
      polygonPath: null,
      relatedPolygonPath: null,
    },
    disposition: "ManualReview",
    details: {},
  };
}

function createUploadData(): TopologyUploadData {
  return {
    jobId: "job-123",
    status: "dry-run-complete",
    originalName: "parcels.geojson",
    sizeInBytes: 1024,
    appliedTolerance: 30,
    report: {
      mode: "dry-run",
      valid: false,
      summary: {
        featuresScanned: 8,
        checksRun: 12,
        issuesFound: 3,
        affectedFeatures: 2,
        autoRepairableIssues: 0,
        manualReviewIssues: 3,
      },
      affectedFeatureCollection: {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            id: "parcel-five",
            properties: { name: "Parcel Five" },
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [51, 35],
                  [52, 35],
                  [52, 36],
                  [51, 35],
                ],
              ],
            },
            snapgisFeatureIndex: 5,
          },
          {
            type: "Feature",
            id: "parcel-seven",
            properties: { name: "Parcel Seven" },
            geometry: {
              type: "Polygon",
              coordinates: [
                [
                  [53, 35],
                  [54, 35],
                  [54, 36],
                  [53, 35],
                ],
              ],
            },
            snapgisFeatureIndex: 7,
          },
        ],
      },
      appliedOptions: {
        toleranceMillimeters: 30,
        tinyAreaThresholdM2: 0.09,
        spikeBaseToleranceMeters: 0.03,
        maxCoordinateDecimalPlaces: 9,
      },
      issues: [
        createIssue(5, "EXCESSIVE_COORDINATE_PRECISION"),
        createIssue(5, "RING_ORIENTATION"),
        createIssue(7, "ZERO_AREA_POLYGON"),
      ],
      checks: {},
    },
    heal: {
      method: "POST",
      path: "/heal/job-123",
    },
  };
}

describe("topology report model", () => {
  it("groups issue metadata by the stable SnapGIS feature index", () => {
    const reports = buildFeatureReports(createUploadData());

    expect(reports).toHaveLength(2);
    expect(reports[0]).toMatchObject({
      featureIndex: 5,
      featureId: "parcel-five",
      name: "Parcel Five",
      geometryType: "Polygon",
    });
    expect(reports[0].issues.map((issue) => issue.code)).toEqual([
      "EXCESSIVE_COORDINATE_PRECISION",
      "RING_ORIENTATION",
    ]);
    expect(reports[1].issues[0].code).toBe("ZERO_AREA_POLYGON");
  });

  it("moves the top-level feature index into MapLibre-readable properties", () => {
    const sourceData = prepareAffectedFeatureCollection(
      createUploadData().report.affectedFeatureCollection,
    );

    expect(sourceData.features[0].properties?.[FEATURE_INDEX_PROPERTY]).toBe(5);
    expect(sourceData.features[1].properties?.[FEATURE_INDEX_PROPERTY]).toBe(7);
    expect(sourceData.features[0].id).toBe("parcel-five");
  });

  it("builds an isolated map source for the card-selected feature", () => {
    const selectedData = getSelectedFeatureCollection(
      createUploadData().report.affectedFeatureCollection,
      7,
    );

    expect(selectedData.features).toHaveLength(1);
    expect(selectedData.features[0].id).toBe("parcel-seven");
    expect(selectedData.features[0].properties?.[FEATURE_INDEX_PROPERTY]).toBe(7);
  });
});
