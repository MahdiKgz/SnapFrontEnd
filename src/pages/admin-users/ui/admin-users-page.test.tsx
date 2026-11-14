// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import type * as Business from "@features/business";

import AdminUsersPage from "./admin-users-page";

const mocks = vi.hoisted(() => ({
  users: vi.fn(),
  detail: vi.fn(),
  plans: vi.fn(),
  update: vi.fn(),
  writer: vi.fn(),
  refetch: vi.fn(),
}));
vi.mock("@features/business", async (importOriginal) => ({
  ...(await importOriginal<typeof Business>()),
  useGetAdminUsersQuery: mocks.users,
  useGetAdminUserQuery: mocks.detail,
  useGetBusinessPlansQuery: mocks.plans,
  useUpdateAdminUserMutation: () => [mocks.update, { isLoading: false }],
  useAssignWriterRoleMutation: () => [mocks.writer, { isLoading: false }],
}));
const plan = { code: "starter", name: "پایه" };
const user = {
  id: "person",
  name: "کاربر نمونه",
  phone: "09123456789",
  roles: ["user"],
  planCode: "starter",
  plan,
  createdAt: "2026-10-01T00:00:00Z",
  usage: { uploads: 8, bytes: 2097152, identifiedIssues: 15, healedIssues: 12 },
  storedFiles: 3,
};
const list = { items: [user], pagination: { skip: 0, limit: 10, total: 21 } };
const file = {
  id: "file",
  name: "نقشه نمونه.geojson",
  originalName: "map.geojson",
  healStatus: "completed",
  sizeInBytes: 1024,
  identifiedIssues: 5,
  healedIssues: 4,
  createdAt: user.createdAt,
};
const mount = () =>
  render(
    <MemoryRouter>
      <AdminUsersPage />
    </MemoryRouter>,
  );
const chooseOption = async (label: string, option: string) => {
  fireEvent.click(screen.getByRole("combobox", { name: label }));
  const item = await screen.findByRole("option", { name: option });
  fireEvent.pointerDown(item, { pointerType: "mouse" });
  fireEvent.click(item);
};

beforeEach(() => {
  mocks.users.mockReturnValue({ currentData: { data: list }, refetch: mocks.refetch });
  mocks.detail.mockReturnValue({
    currentData: { data: { user, recentFiles: [file] } },
    refetch: mocks.refetch,
  });
  mocks.plans.mockReturnValue({
    data: { data: [plan, { code: "pro", name: "حرفه‌ای" }] },
    refetch: mocks.refetch,
  });
  mocks.update.mockReturnValue({ unwrap: async () => ({ success: true }) });
  mocks.writer.mockReturnValue({ unwrap: async () => ({ success: true }) });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
});

it("shows real account metadata and routes plan changes to the existing plan manager", () => {
  mount();
  expect(screen.getByRole("heading", { name: "مدیریت کاربران" })).toBeTruthy();
  expect(screen.getByRole("cell", { name: /کاربر نمونه/ }).textContent).toContain(user.phone);
  expect(screen.getByRole("link", { name: "مدیریت پلن‌ها" }).getAttribute("href")).toBe(
    "/dashboard/admin/plans",
  );
  expect(screen.queryByRole("button", { name: /حذف|مسدود|ساخت حساب/ })).toBeNull();
});

it("debounces server search and resets pagination for filters and page size", async () => {
  mount();
  fireEvent.click(screen.getByRole("button", { name: "بعدی" }));
  expect(mocks.users).toHaveBeenLastCalledWith(
    { search: "", plan: "", role: "", skip: 10, limit: 10 },
    expect.anything(),
  );
  fireEvent.change(screen.getByLabelText("جستجوی کاربران"), { target: { value: " 0912 " } });
  expect(mocks.users).toHaveBeenLastCalledWith(
    { search: "", plan: "", role: "", skip: 10, limit: 10 },
    expect.anything(),
  );
  await waitFor(() =>
    expect(mocks.users).toHaveBeenLastCalledWith(
      { search: "0912", plan: "", role: "", skip: 0, limit: 10 },
      expect.anything(),
    ),
  );
  fireEvent.click(screen.getByRole("button", { name: "بعدی" }));
  await chooseOption("فیلتر نقش", "نویسنده");
  await chooseOption("فیلتر پلن", "حرفه‌ای");
  await chooseOption("تعداد کاربران در صفحه", "۲۵");
  expect(mocks.users).toHaveBeenLastCalledWith(
    { search: "0912", plan: "pro", role: "writer", skip: 0, limit: 25 },
    expect.anything(),
  );
});

it("keeps early pagination stable and resets it only when the effective search changes", () => {
  vi.useFakeTimers();
  mount();
  fireEvent.click(screen.getByRole("button", { name: "بعدی" }));
  act(() => vi.advanceTimersByTime(350));
  expect(mocks.users).toHaveBeenLastCalledWith(
    { search: "", plan: "", role: "", skip: 10, limit: 10 },
    expect.anything(),
  );
  fireEvent.change(screen.getByLabelText("جستجوی کاربران"), { target: { value: "0912" } });
  act(() => vi.advanceTimersByTime(349));
  expect(mocks.users).toHaveBeenLastCalledWith(
    { search: "", plan: "", role: "", skip: 10, limit: 10 },
    expect.anything(),
  );
  act(() => vi.advanceTimersByTime(1));
  expect(mocks.users).toHaveBeenLastCalledWith(
    { search: "0912", plan: "", role: "", skip: 0, limit: 10 },
    expect.anything(),
  );
  fireEvent.click(screen.getByRole("button", { name: "بعدی" }));
  fireEvent.change(screen.getByLabelText("جستجوی کاربران"), { target: { value: " 0912 " } });
  act(() => vi.advanceTimersByTime(350));
  expect(mocks.users).toHaveBeenLastCalledWith(
    { search: "0912", plan: "", role: "", skip: 10, limit: 10 },
    expect.anything(),
  );
});

it("submits only reviewed profile fields and disables unchanged saves", async () => {
  mount();
  fireEvent.click(screen.getByRole("button", { name: `ویرایش ${user.name}` }));
  const dialog = await screen.findByRole("dialog");
  expect(
    (within(dialog).getByRole("button", { name: "ذخیره تغییرات" }) as HTMLButtonElement).disabled,
  ).toBe(true);
  fireEvent.change(within(dialog).getByLabelText("نام و نام خانوادگی"), {
    target: { value: "نام جدید" },
  });
  fireEvent.change(within(dialog).getByLabelText("شماره تلفن"), {
    target: { value: "09121111111" },
  });
  fireEvent.click(within(dialog).getByRole("button", { name: "ذخیره تغییرات" }));
  await waitFor(() =>
    expect(mocks.update).toHaveBeenCalledWith({
      userId: "person",
      name: "نام جدید",
      phone: "09121111111",
    }),
  );
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(screen.getByRole("status").textContent).toContain("به‌روزرسانی شد");
});

it("keeps the editor open and exposes server validation failures", async () => {
  mocks.update.mockReturnValue({
    unwrap: async () => {
      throw { data: { message: "شماره تلفن تکراری است" } };
    },
  });
  mount();
  fireEvent.click(screen.getByRole("button", { name: `ویرایش ${user.name}` }));
  fireEvent.change(await screen.findByLabelText("شماره تلفن"), {
    target: { value: "09121111111" },
  });
  fireEvent.click(screen.getByRole("button", { name: "ذخیره تغییرات" }));
  expect((await screen.findByRole("alert")).textContent).toContain("شماره تلفن تکراری است");
  expect(screen.getByRole("dialog")).toBeTruthy();
});

it.each(["۰۹۱۲۱۱۱۱۱۱۱", "٠٩١٢١١١١١١١"])(
  "normalizes a localized phone number before submitting (%s)",
  async (phone) => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: `ویرایش ${user.name}` }));
    fireEvent.change(await screen.findByLabelText("شماره تلفن"), { target: { value: phone } });
    fireEvent.click(screen.getByRole("button", { name: "ذخیره تغییرات" }));
    await waitFor(() =>
      expect(mocks.update).toHaveBeenCalledWith({
        userId: user.id,
        name: user.name,
        phone: "09121111111",
      }),
    );
  },
);

it.each([false, true])(
  "requires confirmation before changing writer access (currently %s)",
  async (enabled) => {
    mocks.users.mockReturnValue({
      currentData: {
        data: { ...list, items: [{ ...user, roles: enabled ? ["user", "writer"] : ["user"] }] },
      },
    });
    mount();
    fireEvent.click(
      screen.getByRole("button", { name: `${enabled ? "لغو" : "اعطای"} نقش نویسنده ${user.name}` }),
    );
    expect(mocks.writer).not.toHaveBeenCalled();
    fireEvent.click(await screen.findByRole("button", { name: "تأیید" }));
    await waitFor(() =>
      expect(mocks.writer).toHaveBeenCalledWith({ userId: user.id, enabled: !enabled }),
    );
  },
);

it("loads activity on demand and shows usage and recent file metadata", async () => {
  mount();
  expect(mocks.detail).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: `فعالیت ${user.name}` }));
  const dialog = await screen.findByRole("dialog");
  expect(mocks.detail).toHaveBeenCalledWith(user.id, expect.anything());
  expect(within(dialog).getByText("نقشه نمونه.geojson")).toBeTruthy();
  expect(within(dialog).getByText("ترمیم‌شده")).toBeTruthy();
  expect(within(dialog).getByText("آپلودها")).toBeTruthy();
  expect(within(dialog).queryByRole("link")).toBeNull();
});

it("opens a report user deep link as activity without opening profile editing", async () => {
  mocks.users.mockReturnValue({ currentData: { data: { ...list, items: [] } } });
  render(
    <MemoryRouter initialEntries={["/dashboard/admin/users?user=person"]}>
      <AdminUsersPage />
    </MemoryRouter>,
  );
  const dialog = await screen.findByRole("dialog");
  expect(mocks.detail).toHaveBeenCalledWith(user.id, expect.anything());
  expect(within(dialog).getByRole("heading", { name: `فعالیت ${user.name}` })).toBeTruthy();
  expect(within(dialog).getByText(file.name)).toBeTruthy();
  expect(within(dialog).queryByLabelText("شماره تلفن")).toBeNull();
  expect(mocks.update).not.toHaveBeenCalled();
  fireEvent.click(within(dialog).getByRole("button", { name: "بستن فعالیت" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
});

it("waits for the selected deep-linked user instead of showing previous query data", async () => {
  mocks.detail.mockReturnValue({ data: { data: { user, recentFiles: [file] } }, isFetching: true });
  render(
    <MemoryRouter initialEntries={["/dashboard/admin/users?user=another-person"]}>
      <AdminUsersPage />
    </MemoryRouter>,
  );
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByRole("heading", { name: "فعالیت کاربر" })).toBeTruthy();
  expect(within(dialog).getByRole("status").textContent).toContain("در حال دریافت فعالیت");
  expect(within(dialog).queryByText(file.name)).toBeNull();
  expect(mocks.detail).toHaveBeenCalledWith("another-person", expect.anything());
});

it("offers retry for a failed list and activity request", async () => {
  mocks.users.mockReturnValue({
    isError: true,
    error: { data: { message: "دریافت ناموفق" } },
    refetch: mocks.refetch,
  });
  const rendered = mount();
  expect(screen.getByRole("alert").textContent).toContain("دریافت ناموفق");
  fireEvent.click(screen.getByRole("button", { name: "تلاش دوباره" }));
  expect(mocks.refetch).toHaveBeenCalledTimes(1);
  mocks.users.mockReturnValue({ currentData: { data: list } });
  mocks.detail.mockReturnValue({ isError: true, refetch: mocks.refetch });
  rendered.rerender(
    <MemoryRouter>
      <AdminUsersPage />
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole("button", { name: `فعالیت ${user.name}` }));
  fireEvent.click(await screen.findByRole("button", { name: "تلاش دوباره برای فعالیت" }));
  expect(mocks.refetch).toHaveBeenCalledTimes(2);
});

it("shows loading and filtered empty states without stale rows", async () => {
  mocks.users.mockReturnValue({ isFetching: true });
  const rendered = mount();
  expect(screen.getByRole("status").textContent).toContain("در حال دریافت کاربران");
  expect(screen.queryByText(user.name)).toBeNull();
  mocks.users.mockReturnValue({
    currentData: { data: { items: [], pagination: { skip: 0, limit: 10, total: 0 } } },
  });
  rendered.rerender(
    <MemoryRouter>
      <AdminUsersPage />
    </MemoryRouter>,
  );
  await chooseOption("فیلتر نقش", "نویسنده");
  expect(screen.getByText("کاربری پیدا نشد")).toBeTruthy();
  expect(screen.getByRole("button", { name: "پاک کردن فیلترها" })).toBeTruthy();
  expect((screen.getByRole("button", { name: "بعدی" }) as HTMLButtonElement).disabled).toBe(true);
});
