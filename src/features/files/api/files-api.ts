import { topologyApi } from "../../topology/api/topology-api";
import type {
  UserFileDetail,
  UserFileResponse,
  UserFileSummary,
  UserFilesResponse,
} from "../model/types";

export const DEFAULT_FILES_LIMIT = 10;

export const filesApi = topologyApi.injectEndpoints({
  endpoints: (builder) => ({
    getUserFiles: builder.query<UserFilesResponse, { skip?: number; limit?: number } | void>({
      query: (pagination) => ({
        url: "/files",
        params: {
          skip: pagination?.skip ?? 0,
          limit: pagination?.limit ?? DEFAULT_FILES_LIMIT,
        },
      }),
      providesTags: (result) => [
        { type: "Files", id: "LIST" },
        ...(result?.data.items.map((file) => ({ type: "Files" as const, id: file.id })) ?? []),
      ],
    }),
    getUserFile: builder.query<UserFileResponse<UserFileDetail>, string>({
      query: (id) => `/files/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Files", id }],
    }),
    renameUserFile: builder.mutation<
      UserFileResponse<UserFileSummary>,
      { id: string; name: string }
    >({
      query: ({ id, name }) => ({
        url: `/files/${id}`,
        method: "PATCH",
        body: { name },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: "Files", id },
        { type: "Files", id: "LIST" },
      ],
    }),
    deleteUserFile: builder.mutation<void, string>({
      query: (id) => ({ url: `/files/${id}`, method: "DELETE" }),
      invalidatesTags: (_result, _error, id) => [
        { type: "Files", id },
        { type: "Files", id: "LIST" },
      ],
    }),
  }),
});

export const {
  useDeleteUserFileMutation,
  useGetUserFileQuery,
  useGetUserFilesQuery,
  useRenameUserFileMutation,
} = filesApi;
