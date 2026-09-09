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
  items: (Person & { plan: BusinessPlan; planCode: PlanCode })[];
  pagination: { skip: number; limit: number; total: number };
}
export const businessError = (error: unknown): string => {
  const message = (error as { data?: { message?: unknown } })?.data?.message;
  return typeof message === "string" ? message : "ارتباط با سرور برقرار نشد. دوباره تلاش کنید.";
};
export const count = (value: number) => value.toLocaleString("fa-IR");
