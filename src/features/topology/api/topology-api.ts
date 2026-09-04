import { createReauthenticatingBaseQuery } from "@/features/auth/api/auth-base-query";
import { createApi } from "@reduxjs/toolkit/query/react";
import type { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";

import type {
  ManualReviewAction,
  ManualReviewDecision,
  TopologyHealResponse,
  TopologyHealStatusResponse,
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
        url: "/upload",
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
    getHealStatus: builder.query<TopologyHealStatusResponse, string>({
      query: (jobId) => `/heal/${jobId}`,
    }),
    getHealedOutput: builder.query<FeatureCollection<Geometry, GeoJsonProperties>, string>({
      query: (path) => normalizeTopologyApiPath(path),
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
    updateManualReview: builder.mutation<
      { success: boolean; data: { issueIndex: number; decision: ManualReviewDecision } },
      { jobId: string; issueIndex: number; action: ManualReviewAction }
    >({
      query: ({ jobId, issueIndex, action }) => ({
        url: `/heal/${jobId}/reviews/${issueIndex}`,
        method: "PATCH",
        body: { action },
      }),
      invalidatesTags: (_result, _error, { jobId }) => [{ type: "Files", id: jobId }],
    }),
  }),
});

export const {
  useGetHealStatusQuery,
  useCancelHealingMutation,
  useHealTopologyMutation,
  useLazyGetOriginalInputQuery,
  useLazyGetHealedOutputQuery,
  useUpdateManualReviewMutation,
  useUploadTopologyMutation,
} = topologyApi;
