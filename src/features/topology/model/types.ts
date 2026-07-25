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
  data?: unknown;
}
