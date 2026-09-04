import { describe, expect, it } from "vitest";

import type { TopologyIssue } from "./types";
import { getIssueCoordinate } from "./use-healed-review-map";

const issue = (coordinatePath: number[] | null): TopologyIssue => ({
  check: "spikes",
  code: "SPIKE",
  featureIndex: 0,
  featureId: "parcel-1",
  geometryType: "Polygon",
  disposition: "ManualReview",
  details: {},
  location: {
    geometryCollectionPath: [],
    coordinatePath,
    relatedCoordinatePath: null,
    polygonPath: null,
    relatedPolygonPath: null,
  },
});

const source = {
  type: "FeatureCollection" as const,
  features: [
    {
      type: "Feature" as const,
      properties: {},
      geometry: {
        type: "Polygon" as const,
        coordinates: [
          [
            [51, 35],
            [52, 35],
            [52, 36],
            [51, 35],
          ],
        ],
      },
    },
  ],
};

describe("manual review coordinates", () => {
  it("uses the issue coordinate path and falls back to the feature extent", () => {
    expect(getIssueCoordinate(issue([0, 1]), source)).toEqual([52, 35]);
    expect(getIssueCoordinate(issue(null), source)).toEqual([51.5, 35.5]);
  });
});
