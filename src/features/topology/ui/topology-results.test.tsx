// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { TopologyUploadData } from "../model/types";
import { TopologyResults } from "./topology-results";

const { healTopology } = vi.hoisted(() => ({
  healTopology: vi.fn(),
}));

vi.mock("../api/topology-api", () => ({
  useHealTopologyMutation: () => [
    healTopology,
    {
      isError: false,
      isLoading: false,
      isSuccess: false,
    },
  ],
}));

const data: TopologyUploadData = {
  jobId: "job-123",
  status: "dry-run-complete",
  originalName: "parcels.geojson",
  sizeInBytes: 1024,
  appliedTolerance: 30,
  report: {
    mode: "dry-run",
    valid: true,
    summary: {
      featuresScanned: 1,
      checksRun: 12,
      issuesFound: 0,
      affectedFeatures: 0,
      autoRepairableIssues: 0,
      manualReviewIssues: 0,
    },
    affectedFeatureCollection: {
      type: "FeatureCollection",
      features: [],
    },
    appliedOptions: {
      toleranceMillimeters: 30,
      tinyAreaThresholdM2: 0.09,
      spikeBaseToleranceMeters: 0.03,
      maxCoordinateDecimalPlaces: 9,
    },
    issues: [],
    checks: {},
  },
  heal: {
    method: "POST",
    path: "/heal/job-123",
  },
};

describe("TopologyResults", () => {
  it("places the new-file action beside auto-repair and resets from the header", () => {
    const onReset = vi.fn();

    render(
      <TopologyResults
        data={data}
        onReset={onReset}
        onSelectFeature={vi.fn()}
        selectedFeatureIndex={null}
      />,
    );

    const newFileButton = screen.getByRole("button", { name: "بررسی فایل جدید" });
    const autoRepairButton = screen.getByRole("button", { name: "ترمیم خودکار" });

    expect(newFileButton.parentElement).toBe(autoRepairButton.parentElement);
    expect(screen.getByRole("tooltip", { name: "بررسی فایل جدید" })).toBeTruthy();

    fireEvent.click(newFileButton);
    expect(onReset).toHaveBeenCalledOnce();
  });
});
