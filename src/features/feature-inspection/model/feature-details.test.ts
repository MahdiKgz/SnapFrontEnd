import type { Feature, Polygon } from "geojson";
import { describe, expect, it } from "vitest";

import {
  featureDistance,
  featureSummary,
  isNeighborDistance,
  resolveFeature,
} from "./feature-details";

const polygon = (x: number, y: number, size = 0.001): Feature<Polygon> => ({
  type: "Feature",
  properties: {},
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [x, y],
        [x + size, y],
        [x + size, y + size],
        [x, y + size],
        [x, y],
      ],
    ],
  },
});
const point = (lng: number, lat: number): Feature => ({
  type: "Feature",
  properties: {},
  geometry: { type: "Point", coordinates: [lng, lat] },
});

describe("feature inspection geometry", () => {
  it("counts vertices once per ring, includes holes and all multipart components", () => {
    const outer = polygon(0, 0, 0.01),
      hole = polygon(0.002, 0.002);
    const withHole: Feature<Polygon> = {
      ...outer,
      geometry: {
        ...outer.geometry,
        coordinates: [...outer.geometry.coordinates, ...hole.geometry.coordinates],
      },
    };
    const summary = featureSummary(withHole);
    expect(summary.vertices).toHaveLength(8);
    expect(summary.squareMeters).toBeCloseTo(
      featureSummary(outer).squareMeters! - featureSummary(hole).squareMeters!,
      5,
    );
    expect(summary.perimeterKm).toBeCloseTo(
      featureSummary(outer).perimeterKm! + featureSummary(hole).perimeterKm!,
      8,
    );
    const multi: Feature = {
      ...outer,
      geometry: {
        type: "MultiPolygon",
        coordinates: [withHole.geometry.coordinates, polygon(1, 1).geometry.coordinates],
      },
    };
    expect(featureSummary(multi).vertices).toHaveLength(12);
    expect(new Set(featureSummary(multi).vertices.map((v) => v.path)).size).toBe(12);
  });

  it("uses segment interiors rather than centroids or only vertex distances", () => {
    const rectangle = polygon(0, 0, 0.01);
    const separation = featureDistance(rectangle, point(0.005, -0.001));
    expect(separation).toBeCloseTo(0.111195, 5);
    expect(featureDistance(point(0.005, -0.001), rectangle)).toBeCloseTo(separation, 8);
    expect(featureDistance(rectangle, polygon(0.01, 0))).toBe(0);
    expect(featureDistance(rectangle, point(0.005, 0.005))).toBe(0);
  });

  it("does not consider an exactly 1 km distance a neighbor", () => {
    const oneKmDegrees = ((1000 / 6371008.8) * 180) / Math.PI;
    const origin = point(0, 0);
    expect(featureDistance(origin, point(oneKmDegrees, 0))).toBeCloseTo(1, 12);
    expect(isNeighborDistance(featureDistance(origin, point(oneKmDegrees, 0)))).toBe(false);
    expect(isNeighborDistance(featureDistance(origin, point(oneKmDegrees * 0.999, 0)))).toBe(true);
    expect(isNeighborDistance(featureDistance(origin, point(oneKmDegrees * 1.001, 0)))).toBe(false);
    expect(isNeighborDistance(0)).toBe(true);
  });

  it("measures distances to hole boundaries and resolves the full feature", () => {
    const shape = polygon(0, 0, 0.01);
    shape.geometry.coordinates.push(polygon(0.002, 0.002, 0.004).geometry.coordinates[0]);
    expect(featureDistance(shape, point(0.004, 0.004))).toBeGreaterThan(0.22);
    const second = { ...polygon(0, 0, 0.02), id: "selected" };
    expect(resolveFeature([shape, second], { id: "selected" }, [0.001, 0.001], 0.0001)).toBe(1);
    expect(featureSummary(point(1, 1)).squareMeters).toBeNull();
  });
});
