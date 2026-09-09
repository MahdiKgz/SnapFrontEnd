// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { AddColleagueDialog } from "./add-colleague-dialog";
import AdminPlansPage from "./admin-plans-page";
import CompanyPage from "./company-page";

const mocks = vi.hoisted(() => ({
  lookup: vi.fn(),
  add: vi.fn(),
  respond: vi.fn(),
  assign: vi.fn(),
  remove: vi.fn(),
  context: vi.fn(),
  company: vi.fn(),
  users: vi.fn(),
  plans: vi.fn(),
  abort: vi.fn(),
}));
vi.mock("@/app/store/hooks", () => ({
  useAppSelector: (select: (state: unknown) => unknown) =>
    select({ auth: { user: { id: "member" } } }),
}));
vi.mock("../api/business-api", () => ({
  useLookupColleagueMutation: () => [mocks.lookup, { isLoading: false }],
  useAddColleagueMutation: () => [mocks.add, { isLoading: false }],
  useRespondCompanyInvitationMutation: () => [mocks.respond, { isLoading: false }],
  useAssignUserPlanMutation: () => [mocks.assign, { isLoading: false }],
  useRemoveColleagueMutation: () => [mocks.remove, { isLoading: false }],
  useRenameCompanyMutation: () => [vi.fn(), { isLoading: false }],
  useRevokeCompanyInvitationMutation: () => [vi.fn(), { isLoading: false }],
  useGetBusinessContextQuery: mocks.context,
  useGetCompanyQuery: mocks.company,
  useGetPlanUsersQuery: mocks.users,
  useGetBusinessPlansQuery: mocks.plans,
}));
const starter = {
  code: "starter",
  name: "پایه",
  monthlyPrice: 490000,
  employeeLimit: 0,
  isCompany: false,
};
const advanced = {
  code: "advanced",
  name: "شرکتی",
  monthlyPrice: 1990000,
  employeeLimit: 3,
  isCompany: true,
};
const person = {
  id: "member",
  name: "همکار نمونه",
  phone: "09123456789",
  createdAt: "2026-09-01T00:00:00Z",
};
const companyInfo = {
  id: "company",
  name: "شرکت نمونه",
  role: "owner",
  active: true,
  joinedAt: person.createdAt,
};
const usage = {
  uploads: 12,
  bytes: 1048576,
  identifiedIssues: 7,
  healedIssues: 5,
  storedFiles: 10,
};
beforeEach(() => {
  mocks.lookup.mockReturnValue({ unwrap: async () => ({ data: person }), abort: mocks.abort });
  for (const mutation of [mocks.add, mocks.respond, mocks.assign, mocks.remove])
    mutation.mockReturnValue({ unwrap: async () => ({ success: true }) });
  mocks.context.mockReturnValue({
    data: { data: { plan: starter, effectivePlan: starter, company: null, invitations: [] } },
    refetch: vi.fn(),
  });
  mocks.company.mockReturnValue({
    data: {
      data: {
        ...companyInfo,
        seats: { limit: 3, total: 3, members: 2, invitations: 1 },
        usage,
        members: [{ ...person, role: "owner", usage }],
        invitations: [],
      },
    },
  });
  mocks.plans.mockReturnValue({ data: { data: [starter, advanced] } });
  mocks.users.mockReturnValue({
    currentData: {
      data: {
        items: [{ ...person, planCode: "starter", plan: starter }],
        pagination: { total: 1, skip: 0, limit: 10 },
      },
    },
    refetch: vi.fn(),
  });
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
async function lookupPerson() {
  fireEvent.click(screen.getByRole("button", { name: "افزودن همکار" }));
  fireEvent.change(await screen.findByLabelText("شماره تلفن همکار"), {
    target: { value: person.phone },
  });
  fireEvent.click(screen.getByRole("button", { name: "بررسی" }));
  await screen.findByRole("article", { name: "مشخصات همکار" });
}
it("reviews identity and sends only an invitation without a direct-add option", async () => {
  const success = vi.fn();
  render(<AddColleagueDialog disabled={false} onSuccess={success} />);
  await lookupPerson();
  expect(mocks.lookup).toHaveBeenCalledWith(person.phone);
  expect(mocks.add).not.toHaveBeenCalled();
  expect(screen.queryByText("افزودن مستقیم")).toBeNull();
  expect(screen.queryByRole("radio")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "تأیید مشخصات و ارسال دعوت" }));
  await waitFor(() => expect(mocks.add).toHaveBeenCalledWith({ userId: person.id }));
  await waitFor(() =>
    expect(success).toHaveBeenCalledWith("دعوت در حساب همکار ثبت شد و در انتظار پاسخ است."),
  );
});
it("invalidates the reviewed identity when the phone changes", async () => {
  render(<AddColleagueDialog disabled={false} onSuccess={vi.fn()} />);
  await lookupPerson();
  fireEvent.change(screen.getByLabelText("شماره تلفن همکار"), { target: { value: "09121111111" } });
  expect(screen.queryByRole("article")).toBeNull();
  expect(screen.queryByRole("button", { name: "تأیید مشخصات و ارسال دعوت" })).toBeNull();
  expect(mocks.abort).toHaveBeenCalled();
});
it("surfaces server seat conflicts without claiming the colleague was added", async () => {
  mocks.add.mockReturnValue({
    unwrap: async () => {
      throw { data: { message: "ظرفیت شرکت تکمیل است" } };
    },
  });
  const success = vi.fn();
  render(<AddColleagueDialog disabled={false} onSuccess={success} />);
  await lookupPerson();
  fireEvent.click(screen.getByRole("button", { name: "تأیید مشخصات و ارسال دعوت" }));
  expect((await screen.findByRole("alert")).textContent).toContain("ظرفیت شرکت تکمیل است");
  expect(success).not.toHaveBeenCalled();
});
it.each(["accept", "decline"])("lets an invited colleague %s the invitation", async (action) => {
  mocks.context.mockReturnValue({
    data: {
      data: {
        plan: starter,
        company: null,
        invitations: [
          { id: "invite", companyName: "شرکت نقشه", managerName: "مدیر", expiresAt: "2026-09-20" },
        ],
      },
    },
  });
  render(<CompanyPage />);
  fireEvent.click(
    screen.getByRole("button", { name: action === "accept" ? "پذیرش دعوت" : "رد دعوت" }),
  );
  await waitFor(() => expect(mocks.respond).toHaveBeenCalledWith({ id: "invite", action }));
});
it("disables adding at capacity and renders company statistics for the owner", () => {
  mocks.context.mockReturnValue({
    data: { data: { plan: advanced, company: companyInfo, invitations: [] } },
  });
  render(<CompanyPage />);
  expect((screen.getByRole("button", { name: "افزودن همکار" }) as HTMLButtonElement).disabled).toBe(
    true,
  );
  expect(screen.getByText("کل آپلودهای شرکت")).toBeTruthy();
});
it("members can leave after confirmation and do not see company administration", async () => {
  mocks.context.mockReturnValue({
    data: { data: { plan: starter, company: { ...companyInfo, role: "member" }, invitations: [] } },
  });
  render(<CompanyPage />);
  expect(screen.queryByRole("button", { name: "افزودن همکار" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "خروج از شرکت" }));
  expect(mocks.remove).not.toHaveBeenCalled();
  fireEvent.click(await screen.findByRole("button", { name: "تأیید" }));
  await waitFor(() => expect(mocks.remove).toHaveBeenCalledWith("member"));
});
it("requires admin confirmation before sending a new plan to the server", async () => {
  render(<AdminPlansPage />);
  fireEvent.change(screen.getByLabelText(`تغییر پلن ${person.name}`), {
    target: { value: "advanced" },
  });
  expect(mocks.assign).not.toHaveBeenCalled();
  fireEvent.click(await screen.findByRole("button", { name: "تأیید" }));
  await waitFor(() =>
    expect(mocks.assign).toHaveBeenCalledWith({ userId: person.id, planCode: "advanced" }),
  );
});
it("sends quick search, plan filtering and page size to the server", async () => {
  render(<AdminPlansPage />);
  fireEvent.change(screen.getByLabelText("جستجوی کاربران"), { target: { value: "0912" } });
  await waitFor(() =>
    expect(mocks.users).toHaveBeenLastCalledWith(
      { search: "0912", plan: "", skip: 0, limit: 10 },
      expect.anything(),
    ),
  );
  fireEvent.change(screen.getByLabelText("فیلتر پلن"), { target: { value: "advanced" } });
  fireEvent.change(screen.getByLabelText("تعداد کاربران در صفحه"), { target: { value: "25" } });
  expect(mocks.users).toHaveBeenLastCalledWith(
    { search: "0912", plan: "advanced", skip: 0, limit: 25 },
    expect.anything(),
  );
});
