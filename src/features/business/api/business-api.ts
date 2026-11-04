import { topologyApi } from "@/features/topology/api/topology-api";

import { type AuthState, setCredentials } from "@features/auth";

import type {
  AdminUser,
  AdminUserDetail,
  AdminUsers,
  BusinessContext,
  BusinessPlan,
  CompanyDashboard,
  Person,
  PlanCode,
  PlanUsers,
  SystemReports,
} from "../model/types";

type Envelope<T> = { success: boolean; data: T };
const syncCurrentUser = (
  userId: string,
  changes: Partial<Pick<NonNullable<AuthState["user"]>, "name" | "phone" | "roles">>,
  getState: () => unknown,
  dispatch: (action: ReturnType<typeof setCredentials>) => unknown,
) => {
  const { auth } = getState() as { auth: AuthState };
  if (auth.user?.id !== userId || !auth.accessToken) return;
  dispatch(setCredentials({ accessToken: auth.accessToken, user: { ...auth.user, ...changes } }));
};
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
    addColleague: builder.mutation<Envelope<{ mode: "invite"; id: string }>, { userId: string }>({
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
    getAdminUsers: builder.query<
      Envelope<AdminUsers>,
      { search: string; plan: string; role: string; skip: number; limit: number }
    >({
      query: (params) => ({ url: "/business/admin/users", params }),
      providesTags: [{ type: "Business", id: "ADMIN" }],
    }),
    getAdminUser: builder.query<Envelope<AdminUserDetail>, string>({
      query: (userId) => `/business/admin/users/${encodeURIComponent(userId)}`,
      providesTags: [{ type: "Business", id: "ADMIN" }],
    }),
    updateAdminUser: builder.mutation<
      Envelope<AdminUser>,
      { userId: string; name: string; phone: string }
    >({
      query: ({ userId, name, phone }) => ({
        url: `/business/admin/users/${encodeURIComponent(userId)}`,
        method: "PATCH",
        body: { name, phone },
      }),
      invalidatesTags: [
        { type: "Business", id: "ADMIN" },
        { type: "Business", id: "REPORTS" },
      ],
      async onQueryStarted(_args, { dispatch, getState, queryFulfilled }) {
        try {
          const { data: result } = await queryFulfilled;
          syncCurrentUser(
            result.data.id,
            { name: result.data.name, phone: result.data.phone },
            getState,
            dispatch,
          );
        } catch {
          // The mutation caller displays failures; session data stays unchanged.
        }
      },
    }),
    getSystemReports: builder.query<Envelope<SystemReports>, { from: string; to: string }>({
      query: (params) => ({ url: "/business/admin/reports", params }),
      providesTags: [{ type: "Business", id: "REPORTS" }],
    }),
    assignUserPlan: builder.mutation<unknown, { userId: string; planCode: PlanCode }>({
      query: ({ userId, planCode }) => ({
        url: `/business/admin/users/${userId}/plan`,
        method: "PATCH",
        body: { planCode },
      }),
      invalidatesTags: ["Business", { type: "Files", id: "SUMMARY" }],
    }),
    assignWriterRole: builder.mutation<
      Envelope<{ userId: string; roles: string[] }>,
      { userId: string; enabled: boolean }
    >({
      query: ({ userId, enabled }) => ({
        url: `/business/admin/users/${userId}/writer-role`,
        method: "PATCH",
        body: { enabled },
      }),
      invalidatesTags: [{ type: "Business", id: "ADMIN" }],
      async onQueryStarted(_args, { dispatch, getState, queryFulfilled }) {
        try {
          const { data: result } = await queryFulfilled;
          syncCurrentUser(result.data.userId, { roles: result.data.roles }, getState, dispatch);
        } catch {
          // Failed role changes must not change the current account's access.
        }
      },
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
  useGetAdminUsersQuery,
  useGetAdminUserQuery,
  useUpdateAdminUserMutation,
  useGetSystemReportsQuery,
  useAssignUserPlanMutation,
  useAssignWriterRoleMutation,
} = businessApi;
