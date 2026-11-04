export type PlanCode = "starter" | "pro" | "advanced";
export interface BusinessPlan {
  code: PlanCode;
  name: string;
  monthlyPrice: number;
  annualMonthlyPrice: number;
  employeeLimit: number;
  isCompany: boolean;
}
export interface Person {
  id: string;
  name: string;
  phone: string;
  createdAt: string;
}
export interface CompanyUsage {
  uploads: number;
  bytes: number;
  identifiedIssues: number;
  healedIssues: number;
}
export interface BusinessContext {
  plan: BusinessPlan;
  effectivePlan: BusinessPlan;
  company: {
    id: string;
    name: string;
    role: "owner" | "member";
    active: boolean;
    joinedAt: string;
  } | null;
  invitations: { id: string; companyName: string; managerName: string; expiresAt: string }[];
}
export interface CompanyDashboard {
  id: string;
  name: string;
  active: boolean;
  seats: { members: number; invitations: number; total: number; limit: number };
  usage: CompanyUsage & { storedFiles: number };
  members: {
    id: string;
    name: string;
    phone: string;
    role: "owner" | "member";
    joinedAt: string;
    usage: CompanyUsage;
  }[];
  invitations: { id: string; user: Person; expiresAt: string }[];
}
export interface PlanUsers {
  items: (Person & { plan: BusinessPlan; planCode: PlanCode; roles: string[] })[];
  pagination: { skip: number; limit: number; total: number };
}
export interface AdminUser extends Person {
  roles: string[];
  planCode: PlanCode;
  plan: BusinessPlan;
  usage: CompanyUsage;
  storedFiles: number;
}
export interface AdminUsers {
  items: AdminUser[];
  pagination: { skip: number; limit: number; total: number };
}
export interface AdminFile {
  id: string;
  name: string;
  originalName: string;
  healStatus: string;
  sizeInBytes: number;
  identifiedIssues: number;
  healedIssues: number;
  createdAt: string;
}
export interface AdminUserDetail {
  user: AdminUser;
  recentFiles: AdminFile[];
}
export interface SystemReports {
  range: { from: string; to: string; timeZone: "UTC" };
  summary: {
    users: number;
    newUsers: number;
    companies: number;
    activeCompanies: number;
    uploads: number;
    bytes: number;
    identifiedIssues: number;
    healedIssues: number;
    storedFiles: number;
    deletedFiles: number;
    completed: number;
    failed: number;
    processing: number;
  };
  plans: { code: PlanCode; name: string; count: number }[];
  statuses: { status: string; count: number }[];
  daily: {
    date: string;
    uploads: number;
    completed: number;
    failed: number;
    identifiedIssues: number;
    healedIssues: number;
    bytes: number;
  }[];
  recentFailures: (AdminFile & { user: { id: string; name: string } })[];
}
export const businessError = (error: unknown): string => {
  const message = (error as { data?: { message?: unknown } })?.data?.message;
  return typeof message === "string" ? message : "ارتباط با سرور برقرار نشد. دوباره تلاش کنید.";
};
export const count = (value: number) => value.toLocaleString("fa-IR");
