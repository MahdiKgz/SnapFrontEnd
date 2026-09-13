import { topologyApi } from "@/features/topology/api/topology-api";

import type { ArticleDetail, ArticleInput, ArticleSummary, Envelope } from "../model/types";

const api = topologyApi.enhanceEndpoints({ addTagTypes: ["Articles"] });
export const articlesApi = api.injectEndpoints({
  endpoints: (builder) => ({
    listPublishedArticles: builder.query<
      Envelope<{ items: ArticleSummary[]; nextCursor: string | null }>,
      { search?: string; category?: string; keyword?: string; cursor?: string; limit?: number }
    >({
      query: (params) => ({ url: "/articles", params }),
      providesTags: [{ type: "Articles", id: "PUBLIC" }],
    }),
    getArticleCategories: builder.query<Envelope<{ name: string; count: number }[]>, void>({
      query: () => "/articles/categories",
      providesTags: [{ type: "Articles", id: "CATEGORIES" }],
    }),
    getPublishedArticle: builder.query<Envelope<ArticleDetail>, string>({
      query: (slug) => `/articles/${encodeURIComponent(slug)}`,
    }),
    getMyArticles: builder.query<
      Envelope<{
        items: ArticleSummary[];
        pagination: { skip: number; limit: number; total: number; hasMore: boolean };
      }>,
      {
        search: string;
        status: string;
        category: string;
        keyword: string;
        skip: number;
        limit: number;
      }
    >({
      query: (params) => ({ url: "/articles/writer/mine", params }),
      providesTags: [{ type: "Articles", id: "MINE" }],
    }),
    getMyArticle: builder.query<Envelope<ArticleDetail>, string>({
      query: (id) => `/articles/writer/mine/${id}`,
    }),
    createArticle: builder.mutation<Envelope<ArticleSummary>, ArticleInput>({
      query: (body) => ({ url: "/articles/writer/mine", method: "POST", body }),
      invalidatesTags: ["Articles"],
    }),
    updateArticle: builder.mutation<Envelope<ArticleSummary>, { id: string; body: ArticleInput }>({
      query: ({ id, body }) => ({ url: `/articles/writer/mine/${id}`, method: "PUT", body }),
      invalidatesTags: ["Articles"],
    }),
    deleteArticle: builder.mutation<void, string>({
      query: (id) => ({ url: `/articles/writer/mine/${id}`, method: "DELETE" }),
      invalidatesTags: ["Articles"],
    }),
  }),
});

export const {
  useLazyListPublishedArticlesQuery,
  useGetArticleCategoriesQuery,
  useGetPublishedArticleQuery,
  useGetMyArticlesQuery,
  useCreateArticleMutation,
  useLazyGetMyArticleQuery,
  useUpdateArticleMutation,
  useDeleteArticleMutation,
} = articlesApi;
