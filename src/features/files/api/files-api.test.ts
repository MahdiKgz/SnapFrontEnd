import authReducer from "@/features/auth/model/auth-slice";
import { configureStore } from "@reduxjs/toolkit";
import { afterEach, expect, it, vi } from "vitest";

import { filesApi } from "./files-api";

afterEach(() => vi.unstubAllGlobals());
it("sends filters and pagination to /files, including an explicit false boolean", async () => {
  let url = "";
  vi.stubGlobal(
    "fetch",
    vi.fn(async (request: Request) => {
      url = request.url;
      return new Response(
        JSON.stringify({
          success: true,
          data: { items: [], pagination: { skip: 20, limit: 10, total: 23, hasMore: true } },
        }),
        { headers: { "content-type": "application/json" } },
      );
    }),
  );
  const store = configureStore({
    reducer: { auth: authReducer, [filesApi.reducerPath]: filesApi.reducer },
    middleware: (getDefault) => getDefault().concat(filesApi.middleware),
  });
  const query = store.dispatch(
    filesApi.endpoints.getUserFiles.initiate({
      skip: 20,
      limit: 10,
      search: "قطعه ۱",
      fileType: "geojson",
      hasIssues: false,
      uploadedFrom: "2026-09-01T00:00:00.000Z",
    }),
  );
  try {
    const response = await query.unwrap();
    expect(Object.fromEntries(new URL(url).searchParams)).toEqual({
      skip: "20",
      limit: "10",
      search: "قطعه ۱",
      fileType: "geojson",
      hasIssues: "false",
      uploadedFrom: "2026-09-01T00:00:00.000Z",
    });
    expect(response.data.pagination.total).toBe(23);
  } finally {
    query.unsubscribe();
    store.dispatch(filesApi.util.resetApiState());
  }
});
