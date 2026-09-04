import type {
  ManualReviewDecision,
  TopologyDryRunReport,
  TopologyHealResult,
} from "../../topology/model/types";

export type UserFileStatus =
  | "dry-run-complete"
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled"
  | "unavailable";

export interface UserFileSummary {
  id: string;
  name: string;
  originalName: string;
  sizeInBytes: number;
  uploadedAt: string;
  updatedAt: string;
  status: UserFileStatus;
  isHealed: boolean;
  issuesFound: number | null;
}

export interface UserFileDetail extends UserFileSummary {
  mimeType: string;
  report: TopologyDryRunReport | null;
  healing: {
    progress: number;
    queuedAt: string | null;
    startedAt: string | null;
    completedAt: string | null;
    failedAt: string | null;
    error: string | null;
    result: TopologyHealResult | null;
  };
  reviewDecisions: Record<string, ManualReviewDecision>;
}

export interface UserFilesPage {
  items: UserFileSummary[];
  pagination: {
    skip: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface UserFilesResponse {
  success: boolean;
  data: UserFilesPage;
}

export interface UserDashboardSummary {
  plan: {
    code: "free";
    name: string;
    expiresAt: null;
    remainingDays: null;
  };
  usage: {
    files: number;
    identifiedIssues: number;
    healedIssues: number;
  };
}

export interface UserDashboardSummaryResponse {
  success: boolean;
  data: UserDashboardSummary;
}

export interface UserFileResponse<T = UserFileDetail> {
  success: boolean;
  data: T;
}
