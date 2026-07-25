// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { TopologyIssueGroup } from "../model/types";
import { TopologyIssueGroupCard } from "./topology-issue-group-card";

const group: TopologyIssueGroup = {
  groupId: "coordinatePrecision:EXCESSIVE_COORDINATE_PRECISION",
  check: "coordinatePrecision",
  code: "EXCESSIVE_COORDINATE_PRECISION",
  issueCount: 10,
  affectedFeatureCount: 4,
  affectedFeatureIndexes: [0, 1, 5, 6],
  affectedFeatureIds: ["parcel-01", "parcel-02", "parcel-06", "parcel-07"],
  geometryTypes: ["Polygon"],
  disposition: "ManualReview",
};

describe("TopologyIssueGroupCard", () => {
  it("exposes group metadata and selects all matching map features", () => {
    const onSelect = vi.fn();
    const { rerender } = render(
      <TopologyIssueGroupCard group={group} isSelected={false} onSelect={onSelect} />,
    );

    const card = screen.getByRole("button");
    expect(card.getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByText("EXCESSIVE_COORDINATE_PRECISION")).toBeTruthy();
    expect(screen.getByText("parcel-07")).toBeTruthy();
    expect(screen.getByText("ManualReview")).toBeTruthy();

    fireEvent.click(card);
    expect(onSelect).toHaveBeenCalledWith(group);

    rerender(<TopologyIssueGroupCard group={group} isSelected onSelect={onSelect} />);
    expect(card.getAttribute("aria-pressed")).toBe("true");
    expect(card.className).toContain("border-red-400");
  });
});
