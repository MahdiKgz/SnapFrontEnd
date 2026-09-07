import { distance } from "@turf/distance";
import { pointToLineDistance } from "@turf/point-to-line-distance";
import type { Position } from "geojson";
import { describe, expect, it } from "vitest";

import { distanceIndex, nearestIndexed } from "./distance-index";

function verify(point: Position, lines: Position[][], isolated: Position[] = []) {
  const vertices = [...lines.flat(), ...isolated];
  const expected = Math.min(
    ...lines.map((coordinates) =>
      pointToLineDistance(point, { type: "LineString", coordinates }, { units: "kilometers" }),
    ),
    ...vertices.map((v) => distance(point, v)),
  );
  const index = distanceIndex(vertices, lines);
  expect(nearestIndexed(point, index, Infinity)).toBeCloseTo(expected, 7);
  expect(nearestIndexed(point, index, 1)).toBeCloseTo(Math.min(1, expected), 7);
}
describe("spherical distance index", () => {
  it("matches Turf at the date line, near poles, long arcs, repeated points and isolated components", () => {
    verify(
      [180, 45],
      [
        [
          [179, 44],
          [-179, 46],
        ],
      ],
    );
    verify(
      [90, 89.8],
      [
        [
          [0, 89],
          [180, 89],
        ],
      ],
    );
    verify(
      [20, 70],
      [
        [
          [-40, 55],
          [80, 55],
        ],
      ],
    );
    verify(
      [0.001, 0],
      [
        [
          [0, 0],
          [0, 0],
          [0, 0.01],
        ],
      ],
      [[0.0005, 0]],
    );
    verify(
      [20, 0],
      [
        [
          [0, 0],
          [180, 0],
        ],
      ],
    );
  });
  it("agrees with exhaustive Turf distance on deterministic global and CAD-sized samples", () => {
    let seed = 9123;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let i = 0; i < 60; i++) {
      const x = random() * 340 - 170,
        y = random() * 160 - 80;
      const line = Array.from({ length: 30 }, () => [x + random() * 0.04, y + random() * 0.04]);
      verify([x + random() * 0.08, y + random() * 0.08], [line]);
    }
  });
});
