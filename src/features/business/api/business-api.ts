import { topologyApi } from "@/features/topology/api/topology-api";

import type {
  BusinessContext,
  BusinessPlan,
  CompanyDashboard,
  Person,
  PlanCode,
  PlanUsers,
} from "../model/types";

type Envelope<T> = { success: boolean; data: T };
const enhanced = topologyApi.enhanceEndpoints({ addTagTypes: ["Business"] });
export const businessApi = enhanced.injectEndpoints({
  endpoints: (builder) => ({
    getBusinessPlans: builder.query<Envelope<BusinessPlan[]>, void>({
      query: () => "/business/plans",
    }),
    getBusinessContext: builder.query<Envelope<BusinessContext>, void>({
      query: () => "/business/me",
      providesTags: [{ type: "Business", id: "CONTEXT" }],
    }),
    getCompany: builder.query<Envelope<CompanyDashboard>, void>({
      query: () => "/business/company",
      providesTags: [
        { type: "Business", id: "COMPANY" },
        { type: "Files", id: "SUMMARY" },
      ],
    }),
    lookupColleague: builder.mutation<Envelope<Person>, string>({
      query: (phone) => ({ url: "/business/company/lookup", method: "POST", body: { phone } }),
    }),
    addColleague: builder.mutation<
      Envelope<{ mode: string; id: string }>,
      { userId: string; mode: "direct" | "invite" }
    >({
      query: (body) => ({ url: "/business/company/members", method: "POST", body }),
      invalidatesTags: ["Business"],
    }),
    removeColleague: builder.mutation<unknown, string>({
      query: (id) => ({ url: `/business/company/members/${id}`, method: "DELETE" }),
      invalidatesTags: ["Business"],
    }),
    revokeCompanyInvitation: builder.mutation<unknown, string>({
      query: (id) => ({ url: `/business/company/invitations/${id}`, method: "DELETE" }),
      invalidatesTags: ["Business"],
    }),
    respondCompanyInvitation: builder.mutation<
      unknown,
      { id: string; action: "accept" | "decline" }
    >({
      query: ({ id, action }) => ({
        url: `/business/invitations/${id}/respond`,
        method: "POST",
        body: { action },
      }),
      invalidatesTags: ["Business", { type: "Files", id: "SUMMARY" }],
    }),
    renameCompany: builder.mutation<unknown, string>({
      query: (name) => ({ url: "/business/company", method: "PATCH", body: { name } }),
      invalidatesTags: ["Business"],
    }),
    getPlanUsers: builder.query<
      Envelope<PlanUsers>,
      { search: string; plan: string; skip: number; limit: number }
    >({
      query: (params) => ({ url: "/business/admin/users", params }),
      providesTags: [{ type: "Business", id: "ADMIN" }],
    }),
    assignUserPlan: builder.mutation<unknown, { userId: string; planCode: PlanCode }>({
      query: ({ userId, planCode }) => ({
        url: `/business/admin/users/${userId}/plan`,
        method: "PATCH",
        body: { planCode },
      }),
      invalidatesTags: ["Business", { type: "Files", id: "SUMMARY" }],
    }),
  }),
});
export const {
  useGetBusinessPlansQuery,
  useGetBusinessContextQuery,
  useGetCompanyQuery,
  useLookupColleagueMutation,
  useAddColleagueMutation,
  useRemoveColleagueMutation,
  useRevokeCompanyInvitationMutation,
  useRespondCompanyInvitationMutation,
  useRenameCompanyMutation,
  useGetPlanUsersQuery,
  useAssignUserPlanMutation,
} = businessApi;
