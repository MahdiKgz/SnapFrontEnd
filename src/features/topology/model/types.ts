import type { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";

export interface TopologyIssueLocation {
  geometryCollectionPath: number[];
  coordinatePath: number[] | null;
  relatedCoordinatePath: number[] | null;
  polygonPath: number[] | null;
  relatedPolygonPath: number[] | null;
}

export interface TopologyIssue {
  check: string;
  code: string;
  featureIndex: number;
  featureId: string | number | null;
  geometryType: string;
  location: TopologyIssueLocation;
  disposition: string;
  details: Record<string, unknown>;
}

export interface TopologyReportSummary {
  featuresScanned: number;
  checksRun: number;
  issuesFound: number;
  issueGroups: number;
  affectedFeatures: number;
  autoRepairableIssues: number;
  manualReviewIssues: number;
}

export interface TopologyIssueGroup {
  groupId: string;
  check: string;
  code: string;
  issueCount: number;
  affectedFeatureCount: number;
  affectedFeatureIndexes: number[];
  affectedFeatureIds: Array<string | number>;
  geometryTypes: string[];
  disposition: string;
}

export type AffectedFeatureCollection = FeatureCollection<Geometry, GeoJsonProperties> & {
  features: Array<
    FeatureCollection<Geometry, GeoJsonProperties>["features"][number] & {
      snapgisFeatureIndex?: number;
    }
  >;
};

export interface TopologyDryRunReport {
  mode: "dry-run";
  valid: boolean;
  summary: TopologyReportSummary;
  issueGroups: TopologyIssueGroup[];
  affectedFeatureCollection: AffectedFeatureCollection;
  appliedOptions: {
    toleranceMillimeters: number;
    tinyAreaThresholdM2: number;
    spikeBaseToleranceMeters: number;
    maxCoordinateDecimalPlaces: number;
  };
  issues: TopologyIssue[];
  checks: Record<string, unknown>;
}

export interface TopologyUploadData {
  jobId: string;
  userId: string;
  name: string;
  status: "dry-run-complete" | string;
  originalName: string;
  sizeInBytes: number;
  appliedTolerance: number;
  report: TopologyDryRunReport;
  heal: {
    method: "POST";
    path: string;
  };
}

export interface TopologyUploadResponse {
  success: boolean;
  message: string;
  data: TopologyUploadData;
}

export interface TopologyHealResponse {
  success: boolean;
  message: string;
  data: TopologyHealStatusData;
}

export type TopologyHealStatus =
  | "dry-run-complete"
  | "queued"
  | "processing"
  | "completed"
  | "failed";

export interface TopologyHealOutputLinks {
  fileName: string;
  previewPath: string;
  downloadPath: string;
}

export interface TopologyHealResult {
  repairsApplied: number;
  repairs: Record<string, number>;
  originalSizeInBytes: number;
  optimizedSizeInBytes: number;
  output: TopologyHealOutputLinks | null;
}

export interface TopologyHealStatusData {
  jobId: string;
  dryRunJobId: string;
  status: TopologyHealStatus;
  progress: number;
  queuedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
  error: string | null;
  result: TopologyHealResult | null;
  links: {
    status: string;
    output: string;
    download: string;
  };
}

export interface TopologyHealStatusResponse {
  success: boolean;
  data: TopologyHealStatusData;
}
