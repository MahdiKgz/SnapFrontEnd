import { createReauthenticatingBaseQuery } from "@/features/auth/api/auth-base-query";
import { createApi } from "@reduxjs/toolkit/query/react";
import type {
  FeatureCollection,
  GeoJsonProperties,
  Geometry,
  MultiPolygon,
  Polygon,
} from "geojson";

import type {
  ManualReviewAction,
  ManualReviewDecision,
  ParcelReview,
  TopologyHealResponse,
  TopologyHealStatusResponse,
  TopologyIssue,
  TopologyUploadResponse,
} from "../model/types";

export const TOPOLOGY_API_BASE_URL =
  import.meta.env.VITE_TOPOLOGY_API_URL ??
  import.meta.env.VITE_API_BASE_URL ??
  "http://localhost:3000/api";

const topologyBasePath = (() => {
  try {
    const path = new URL(TOPOLOGY_API_BASE_URL, "http://snapgis.local").pathname;
    return path === "/" ? "" : path.replace(/\/$/, "");
  } catch {
    return "";
  }
})();

export const normalizeTopologyApiPath = (path: string): string => {
  if (/^https?:\/\//i.test(path)) return path;
  if (topologyBasePath && (path === topologyBasePath || path.startsWith(`${topologyBasePath}/`))) {
    return path.slice(topologyBasePath.length) || "/";
  }
  return path;
};

export const buildTopologyApiUrl = (path: string): string => {
  const normalized = normalizeTopologyApiPath(path);
  if (/^https?:\/\//i.test(normalized)) return normalized;
  return `${TOPOLOGY_API_BASE_URL.replace(/\/$/, "")}/${normalized.replace(/^\//, "")}`;
};

export const topologyApi = createApi({
  reducerPath: "topologyApi",
  baseQuery: createReauthenticatingBaseQuery(TOPOLOGY_API_BASE_URL),
  tagTypes: ["Files"],
  endpoints: (builder) => ({
    uploadTopology: builder.mutation<TopologyUploadResponse, FormData>({
      query: (formData) => ({
        url: "/upload?report=compact",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: [
        { type: "Files", id: "LIST" },
        { type: "Files", id: "SUMMARY" },
      ],
    }),
    healTopology: builder.mutation<TopologyHealResponse, string>({
      query: (path) => ({
        url: normalizeTopologyApiPath(path),
        method: "POST",
      }),
    }),
    getAnalysisIssues: builder.query<
      {
        success: boolean;
        data: {
          items: Array<TopologyIssue & { issueIndex: number }>;
          total: number;
          page: number;
          limit: number;
        };
      },
      { jobId: string; page: number; code?: string }
    >({
      query: ({ jobId, ...params }) => ({
        url: `/heal/${encodeURIComponent(jobId)}/issues`,
        params: { ...params, limit: 25 },
      }),
      keepUnusedDataFor: 10,
    }),
    getHealStatus: builder.query<TopologyHealStatusResponse, string>({
      query: (jobId) => `/heal/${jobId}`,
    }),
    getHealedOutput: builder.query<FeatureCollection<Geometry, GeoJsonProperties>, string>({
      query: (path) => ({ url: normalizeTopologyApiPath(path), cache: "no-store" }),
    }),
    getOriginalInput: builder.query<FeatureCollection<Geometry, GeoJsonProperties>, string>({
      query: (jobId) => `/heal/${jobId}/original`,
    }),
    cancelHealing: builder.mutation<TopologyHealResponse, string>({
      query: (jobId) => ({ url: `/heal/${jobId}/cancel`, method: "POST" }),
      invalidatesTags: (_result, _error, jobId) => [
        { type: "Files", id: jobId },
        { type: "Files", id: "LIST" },
      ],
    }),
    getParcelReviewGroup: builder.query<
      {
        data: Array<
          Omit<ParcelReview, "revision"> & {
            featureIndex: number;
            revision: string | null;
            outputIndex?: number;
            unavailable?: boolean;
          }
        >;
      },
      { jobId: string; groupId: string }
    >({
      query: ({ jobId, groupId }) => ({
        url: `/heal/${encodeURIComponent(jobId)}/review-groups/${encodeURIComponent(groupId)}`,
        cache: "no-store",
      }),
      keepUnusedDataFor: 0,
    }),
    updateParcelReviewGroup: builder.mutation<
      { data: { featureIndexes: number[] } },
      {
        jobId: string;
        groupId: string;
        edits: Array<{ featureIndex: number; revision: string; geometry: Polygon | MultiPolygon }>;
      }
    >({
      query: ({ jobId, groupId, edits }) => ({
        url: `/heal/${encodeURIComponent(jobId)}/review-groups/${encodeURIComponent(groupId)}`,
        method: "PATCH",
        body: { edits },
      }),
      invalidatesTags: (result, _error, { jobId }) =>
        result ? [{ type: "Files", id: jobId }] : [],
    }),
    getParcelReview: builder.query<{ data: ParcelReview }, { jobId: string; issueIndex: number }>({
      query: ({ jobId, issueIndex }) => ({
        url: `/heal/${encodeURIComponent(jobId)}/reviews/${issueIndex}`,
        cache: "no-store",
      }),
      keepUnusedDataFor: 0,
    }),
    updateManualReview: builder.mutation<
      { success: boolean; data: { issueIndex: number; decision: ManualReviewDecision } },
      | { jobId: string; issueIndex: number; action: Exclude<ManualReviewAction, "manual-edit"> }
      | {
          jobId: string;
          issueIndex: number;
          action: "manual-edit";
          geometry: Polygon | MultiPolygon;
          revision: string;
        }
    >({
      query: ({ jobId, issueIndex, ...body }) => ({
        url: `/heal/${encodeURIComponent(jobId)}/reviews/${issueIndex}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { jobId }) => [{ type: "Files", id: jobId }],
    }),
  }),
});

export const {
  useGetAnalysisIssuesQuery,
  useGetParcelReviewQuery,
  useGetParcelReviewGroupQuery,
  useUpdateParcelReviewGroupMutation,
  useGetHealStatusQuery,
  useCancelHealingMutation,
  useHealTopologyMutation,
  useLazyGetOriginalInputQuery,
  useLazyGetHealedOutputQuery,
  useUpdateManualReviewMutation,
  useUploadTopologyMutation,
} = topologyApi;
