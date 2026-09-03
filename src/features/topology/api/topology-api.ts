import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";

import type {
  TopologyHealResponse,
  TopologyHealStatusResponse,
  TopologyUploadResponse,
} from "../model/types";

interface StateWithAuth {
  auth: {
    accessToken: string | null;
  };
}

export const TOPOLOGY_API_BASE_URL =
  import.meta.env.VITE_TOPOLOGY_API_URL ??
  import.meta.env.VITE_API_BASE_URL ??
  "http://localhost:3000/api";

export const topologyApi = createApi({
  reducerPath: "topologyApi",
  baseQuery: fetchBaseQuery({
    baseUrl: TOPOLOGY_API_BASE_URL,
    credentials: "include",
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as StateWithAuth).auth.accessToken;

      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }

      return headers;
    },
  }),
  endpoints: (builder) => ({
    uploadTopology: builder.mutation<TopologyUploadResponse, FormData>({
      query: (formData) => ({
        url: "/upload",
        method: "POST",
        body: formData,
      }),
    }),
    healTopology: builder.mutation<TopologyHealResponse, string>({
      query: (path) => ({
        url: path,
        method: "POST",
      }),
    }),
    getHealStatus: builder.query<TopologyHealStatusResponse, string>({
      query: (jobId) => `/heal/${jobId}`,
    }),
    getHealedOutput: builder.query<FeatureCollection<Geometry, GeoJsonProperties>, string>({
      query: (path) => path,
    }),
  }),
});

export const {
  useGetHealStatusQuery,
  useHealTopologyMutation,
  useLazyGetHealedOutputQuery,
  useUploadTopologyMutation,
} = topologyApi;
