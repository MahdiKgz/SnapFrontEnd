import { describe, expect, it } from "vitest";

import {
  type Shape,
  completeAtIntersection,
  dimensions,
  drawingGeoJson,
  nearestOnSegment,
  orthogonalPoint,
  rectangle,
  signedArea,
  validShape,
} from "./cadastral-drawing";

describe("cadastral geometry", () => {
  it("closes and counter-clockwise orients a rectangle without changing editable vertices", () => {
    const shape: Shape = { id: "a", kind: "parcel", vertices: rectangle([51, 36], [52, 35]) };
    const [{ geometry }] = drawingGeoJson([shape]).features;
    expect(geometry.type).toBe("Polygon");
    if (geometry.type !== "Polygon") throw new Error("Expected polygon");
    const [ring] = geometry.coordinates;
    expect(ring[0]).toEqual(ring.at(-1));
    expect(signedArea(ring.slice(0, -1) as Shape["vertices"])).toBeGreaterThan(0);
    expect(shape.vertices).toHaveLength(4);
    expect(dimensions(shape).squareMeters).toBeGreaterThan(0);
  });

  it("rejects crossings and zero-width rectangles", () => {
    expect(
      validShape({
        id: "a",
        kind: "parcel",
        vertices: [
          [51, 35],
          [52, 36],
          [51, 36],
          [53, 35],
        ],
      }),
    ).toBe(false);
    expect(validShape({ id: "b", kind: "parcel", vertices: rectangle([51, 35], [51, 36]) })).toBe(
      false,
    );
  });

  it("projects onto a bounded segment and chooses the closest orthogonal axis", () => {
    expect(nearestOnSegment([12, 3], [0, 0], [10, 0])).toEqual([10, 0]);
    expect(nearestOnSegment([4, 3], [0, 0], [10, 0])).toEqual([4, 0]);
    expect(orthogonalPoint([0, 0], [2, 5], (point) => point)).toEqual([0, 5]);
    expect(orthogonalPoint([0, 0], [8, 2], (point) => point)).toEqual([8, 0]);
  });

  it("extends the two free ends to the missing corner and preserves the interior vertices", () => {
    const vertices: Shape["vertices"] = [
      [51.001, 35.01],
      [51.004, 35.01],
      [51.004, 35],
      [51, 35],
      [51, 35.004],
      [51, 35.008],
    ];
    const completed = completeAtIntersection(vertices);
    expect(completed?.[0][0]).toBeCloseTo(51, 10);
    expect(completed?.[0][1]).toBeCloseTo(35.01, 10);
    expect(completed?.slice(1)).toEqual(vertices.slice(1, -1));
  });

  it("trims overshooting ends and rejects parallel or distant intersections", () => {
    const trimmed = completeAtIntersection([
      [50.998, 35.01],
      [51.004, 35.01],
      [51.004, 35],
      [51, 35],
      [51, 35.011],
    ]);
    expect(trimmed?.[0][0]).toBeCloseTo(51, 10);
    expect(trimmed?.[0][1]).toBeCloseTo(35.01, 10);
    expect(
      completeAtIntersection([
        [51, 35],
        [52, 35],
        [52, 36],
        [51, 36],
      ]),
    ).toBeUndefined();
    expect(
      completeAtIntersection([
        [51.0039, 35.01],
        [51.004, 35.01],
        [51.004, 35],
        [51, 35],
        [51, 35.008],
      ]),
    ).toBeUndefined();
  });
});
