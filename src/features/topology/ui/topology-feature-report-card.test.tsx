// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { TopologyFeatureReport } from "../model/topology-report";
import { TopologyFeatureReportCard } from "./topology-feature-report-card";

const report: TopologyFeatureReport = {
  featureIndex: 6,
  featureId: "parcel-07",
  name: "Critical overlap",
  geometryType: "Polygon",
  issues: [
    {
      check: "zeroAreaPolygons",
      code: "ZERO_AREA_POLYGON",
      featureIndex: 6,
      featureId: "parcel-07",
      geometryType: "Polygon",
      location: {
        geometryCollectionPath: [],
        coordinatePath: null,
        relatedCoordinatePath: null,
        polygonPath: [],
        relatedPolygonPath: null,
      },
      disposition: "ManualReview",
      details: {},
    },
  ],
};

describe("TopologyFeatureReportCard", () => {
  it("exposes report metadata and selects the matching map feature", () => {
    const onSelect = vi.fn();
    const { rerender } = render(
      <TopologyFeatureReportCard report={report} isSelected={false} onSelect={onSelect} />,
    );

    const card = screen.getByRole("button");
    expect(card.getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByText("Critical overlap")).toBeTruthy();
    expect(screen.getByText("ZERO_AREA_POLYGON")).toBeTruthy();

    fireEvent.click(card);
    expect(onSelect).toHaveBeenCalledWith(6);

    rerender(<TopologyFeatureReportCard report={report} isSelected onSelect={onSelect} />);
    expect(card.getAttribute("aria-pressed")).toBe("true");
    expect(card.className).toContain("border-red-400");
  });
});
