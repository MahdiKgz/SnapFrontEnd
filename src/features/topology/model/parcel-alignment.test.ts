import { describe, expect, it } from "vitest";

import { alignmentSpan, snapAlignedMovement, suggestAlignment } from "./parcel-alignment";

describe("parcel alignment", () => {
  it("detects either axis automatically and releases it when the drag turns diagonal", () => {
    expect(suggestAlignment(3, 0, null)).toBeNull();
    expect(suggestAlignment(20, -4, null)).toBe("horizontal");
    expect(suggestAlignment(4, -20, null)).toBe("vertical");
    expect(suggestAlignment(20, 7, "horizontal")).toBe("horizontal");
    expect(suggestAlignment(20, 11, "horizontal")).toBeNull();
    expect(suggestAlignment(20, 20, null)).toBeNull();
  });

  it("uses vertical edges for horizontal movement and horizontal edges for vertical movement", () => {
    expect(alignmentSpan("horizontal", [10, 15], [10, 45])).toEqual({
      coordinate: 10,
      start: 15,
      end: 45,
    });
    expect(alignmentSpan("vertical", [15, 10], [45, 10])).toEqual({
      coordinate: 10,
      start: 15,
      end: 45,
    });
    expect(alignmentSpan("horizontal", [15, 10], [45, 10])).toBeNull();
    expect(alignmentSpan("vertical", [15, 10], [45, 22])).toBeNull();
  });

  it("snaps to the nearest overlapping edge and ignores a closer edge outside the dragged span", () => {
    const source = { coordinate: 20, start: 10, end: 25 };
    const target = { coordinate: 55, start: 15, end: 35 };
    const targets = [
      { coordinate: 51, start: 50, end: 60 },
      target,
      { coordinate: 58, start: 12, end: 40 },
    ];
    expect(snapAlignedMovement(31, [source], targets)).toEqual({
      distance: 35,
      target: { ...target, crossCoordinate: 20 },
    });
    expect(snapAlignedMovement(31, [source], targets, 20)).toEqual({
      distance: 35,
      target: { ...target, crossCoordinate: 32.5 },
    });
    expect(snapAlignedMovement(18, [source], targets)).toEqual({ distance: 18, target: undefined });
    expect(snapAlignedMovement(-4, [source], [])).toEqual({ distance: -4, target: undefined });
  });
});
