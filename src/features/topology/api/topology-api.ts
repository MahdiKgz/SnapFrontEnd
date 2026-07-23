import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

interface StateWithAuth {
  auth: {
    accessToken: string | null;
  };
}

export const topologyApi = createApi({
  reducerPath: "topologyApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:3000",
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as StateWithAuth).auth.accessToken;

      if (token) {
        headers.set("authorization", `Bearer ${token}`);
      }

      return headers;
    },
  }),
  endpoints: (builder) => ({
    uploadTopology: builder.mutation<unknown, FormData>({
      query: (formData) => ({
        url: "/upload",
        method: "POST",
        body: formData,
      }),
    }),
  }),
});

export const { useUploadTopologyMutation } = topologyApi;
