// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { TopologyUploadData } from "../model/types";
import { TopologyResults } from "./topology-results";

const { healTopology, loadHealedOutput } = vi.hoisted(() => ({
  healTopology: vi.fn(),
  loadHealedOutput: vi.fn(),
}));

vi.mock("../api/topology-api", () => ({
  TOPOLOGY_API_BASE_URL: "http://localhost:3000",
  buildTopologyApiUrl: (path: string) => `http://localhost:3000${path}`,
  useGetHealStatusQuery: (_jobId: string, options: { skip: boolean }) =>
    options.skip
      ? { data: undefined, isError: false }
      : {
          data: {
            success: true,
            data: completedLifecycle,
          },
          isError: false,
        },
  useHealTopologyMutation: () => [
    healTopology,
    {
      isLoading: false,
    },
  ],
  useLazyGetHealedOutputQuery: () => [loadHealedOutput, { isError: false, isFetching: false }],
}));

const baseLifecycle = {
  jobId: "job-123",
  dryRunJobId: "job-123",
  progress: 0,
  queuedAt: "2026-08-15T10:00:00.000Z",
  startedAt: null,
  completedAt: null,
  failedAt: null,
  error: null,
  result: null,
  links: {
    status: "/heal/job-123",
    output: "/heal/job-123/output",
    download: "/heal/job-123/download",
  },
} as const;

const queuedLifecycle = {
  ...baseLifecycle,
  status: "queued" as const,
};

const completedLifecycle = {
  ...baseLifecycle,
  status: "completed" as const,
  progress: 100,
  startedAt: "2026-08-15T10:00:01.000Z",
  completedAt: "2026-08-15T10:00:02.000Z",
  result: {
    repairsApplied: 3,
    repairs: { gapsClosed: 3 },
    originalSizeInBytes: 1024,
    optimizedSizeInBytes: 900,
    output: {
      fileName: "cleaned-parcels.geojson",
      previewPath: "/heal/job-123/output",
      downloadPath: "/heal/job-123/download",
    },
  },
};

const data: TopologyUploadData = {
  jobId: "job-123",
  userId: "6c2d5ee6-9852-4ddd-86db-f62582ef93de",
  name: "Parcel boundaries",
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
      issuesFound: 2,
      issueGroups: 1,
      affectedFeatures: 1,
      autoRepairableIssues: 0,
      manualReviewIssues: 2,
    },
    issueGroups: [
      {
        groupId: "coordinatePrecision:EXCESSIVE_COORDINATE_PRECISION",
        check: "coordinatePrecision",
        code: "EXCESSIVE_COORDINATE_PRECISION",
        issueCount: 2,
        affectedFeatureCount: 1,
        affectedFeatureIndexes: [5],
        affectedFeatureIds: ["parcel-five"],
        geometryTypes: ["Polygon"],
        disposition: "ManualReview",
      },
    ],
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
  afterEach(cleanup);

  beforeEach(() => {
    healTopology.mockReset();
    loadHealedOutput.mockReset();
    healTopology.mockReturnValue({
      unwrap: () => Promise.resolve({ success: true, message: "queued", data: queuedLifecycle }),
    });
    loadHealedOutput.mockReturnValue({
      unwrap: () =>
        Promise.resolve({
          type: "FeatureCollection",
          features: [],
        }),
    });
  });

  it("places the new-file action beside auto-repair and resets from the header", () => {
    const onReset = vi.fn();
    const onSelectFeatures = vi.fn();

    render(
      <TopologyResults
        data={data}
        onHealingComplete={vi.fn()}
        onReset={onReset}
        onSelectFeatures={onSelectFeatures}
      />,
    );

    const newFileButton = screen.getByRole("button", { name: "بررسی فایل جدید" });
    const autoRepairButton = screen.getByRole("button", { name: "ترمیم خودکار" });

    expect(newFileButton.parentElement).toBe(autoRepairButton.parentElement);
    expect(screen.getByRole("tooltip", { name: "بررسی فایل جدید" })).toBeTruthy();

    fireEvent.click(newFileButton);
    expect(onReset).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole("button", { name: /EXCESSIVE_COORDINATE_PRECISION/ }));
    expect(onSelectFeatures).toHaveBeenCalledWith([5]);
  });

  it("notifies, previews, and exposes download after worker completion", async () => {
    const onHealingComplete = vi.fn();
    render(
      <TopologyResults
        data={data}
        onHealingComplete={onHealingComplete}
        onReset={vi.fn()}
        onSelectFeatures={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "ترمیم خودکار" }));

    await waitFor(() => expect(onHealingComplete).toHaveBeenCalledOnce());
    expect(loadHealedOutput).toHaveBeenCalledWith("/heal/job-123/output");
    expect(screen.getByText("ترمیم فایل با موفقیت کامل شد.")).toBeTruthy();
    const download = screen.getByRole("link", { name: "دانلود فایل ترمیم‌شده" });
    expect(download.getAttribute("href")).toBe("http://localhost:3000/heal/job-123/download");
  });
});
