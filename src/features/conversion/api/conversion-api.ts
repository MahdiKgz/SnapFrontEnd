import {
  AUTH_API_BASE_URL,
  createReauthenticatingBaseQuery,
} from "@/features/auth/api/auth-base-query";
import { createApi } from "@reduxjs/toolkit/query/react";

import type { ConversionDownload, ConversionJobResponse, ConversionReport } from "../model/types";

export async function readConversionResponse(response: Response) {
  if (!response.ok || response.status === 202) return response.json();
  const report = JSON.parse(
    decodeURIComponent(response.headers.get("X-Conversion-Result") ?? "{}"),
  ) as ConversionReport;
  if (
    !Number.isInteger(report.features) ||
    !Array.isArray(report.warnings) ||
    typeof report.sourceCRS !== "string" ||
    typeof report.targetCRS !== "string"
  )
    throw new Error("Invalid conversion report");
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const name =
    disposition.match(/filename="?(converted\.(?:geojson|zip|dxf))"?/i)?.[1] ?? "converted.geojson";
  const blob = await response.blob();
  return {
    kind: "download",
    url: URL.createObjectURL(blob),
    filename: name,
    report,
  } satisfies ConversionDownload;
}
export const conversionApi = createApi({
  reducerPath: "conversionApi",
  baseQuery: createReauthenticatingBaseQuery(AUTH_API_BASE_URL),
  endpoints: (builder) => ({
    convertFile: builder.mutation<ConversionDownload | ConversionJobResponse, FormData>({
      query: (body) => ({
        url: "/convert",
        method: "POST",
        body,
        responseHandler: readConversionResponse,
      }),
    }),
    getConversionStatus: builder.query<ConversionJobResponse, string>({
      query: (id) => `/convert/${encodeURIComponent(id)}`,
      keepUnusedDataFor: 0,
    }),
    downloadConversion: builder.mutation<ConversionDownload, string>({
      query: (id) => ({
        url: `/convert/${encodeURIComponent(id)}/download`,
        responseHandler: readConversionResponse,
      }),
    }),
  }),
});
export const {
  useConvertFileMutation,
  useGetConversionStatusQuery,
  useDownloadConversionMutation,
} = conversionApi;

export function useConversionJobStatus(jobId: string | null) {
  const state = conversionApi.endpoints.getConversionStatus.useQueryState(jobId ?? "", {
    skip: !jobId,
  });
  const finished =
    state.currentData?.data.status === "completed" ||
    state.currentData?.data.status === "failed" ||
    state.isError;
  return useGetConversionStatusQuery(jobId ?? "", {
    skip: !jobId,
    pollingInterval: finished ? 0 : 2000,
  });
}
