// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";

import { AccountSecurityPage } from "./account-security-page";

const { send, verify } = vi.hoisted(() => ({ send: vi.fn(), verify: vi.fn() }));
vi.mock("@/app/store/hooks", () => ({
  useAppSelector: (select: (state: { auth: { user: { phone: string } } }) => unknown) =>
    select({ auth: { user: { phone: "09123456789" } } }),
}));
vi.mock("@features/auth", () => ({
  getAuthErrorMessage: () => "رمز عبور فعلی نادرست است.",
  useAccountEmailQuery: () => ({
    data: {
      email: "current@example.com",
      emailVerifiedAt: "2026-11-12",
      pendingEmail: "pending@example.com",
    },
  }),
  useRequestEmailVerificationMutation: () => [send, { isLoading: false }],
  useVerifyEmailMutation: () => [verify, { isLoading: false }],
}));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

it("shows recovery status and keeps the sign-in phone separate from the recovery address", async () => {
  send.mockReturnValue({ unwrap: async () => ({}) });
  render(
    <MemoryRouter>
      <AccountSecurityPage />
    </MemoryRouter>,
  );
  expect(screen.getByText("current@example.com")).toBeTruthy();
  expect(screen.queryByLabelText("رمز عبور فعلی")).toBeNull();

  fireEvent.click(screen.getByRole("button", { name: "تغییر ایمیل" }));
  await screen.findByRole("dialog");
  const input = screen.getByLabelText<HTMLInputElement>("آدرس ایمیل بازیابی");
  expect(input.value).toBe("");
  expect(input.readOnly).toBe(true);
  fireEvent.focus(input);
  expect(input.readOnly).toBe(false);
  fireEvent.change(input, { target: { value: "new@example.com" } });
  fireEvent.change(screen.getByLabelText("رمز عبور فعلی"), {
    target: { value: "current-password" },
  });
  fireEvent.click(screen.getByRole("button", { name: "ارسال لینک تأیید" }));
  await waitFor(() =>
    expect(send).toHaveBeenCalledWith({ email: "new@example.com", password: "current-password" }),
  );
  expect(await screen.findByText(/لینک تأیید ارسال شد/)).toBeTruthy();

  fireEvent.click(screen.getByRole("button", { name: "ارسال دوبارهٔ لینک" }));
  expect((await screen.findByLabelText<HTMLInputElement>("آدرس ایمیل بازیابی")).value).toBe(
    "pending@example.com",
  );
});

it("confirms a verification link through the existing account API", async () => {
  verify.mockReturnValue({ unwrap: async () => ({}) });
  render(
    <MemoryRouter initialEntries={["/dashboard/security#token=example"]}>
      <AccountSecurityPage />
    </MemoryRouter>,
  );
  fireEvent.click(screen.getByRole("button", { name: "تأیید ایمیل" }));
  await waitFor(() => expect(verify).toHaveBeenCalledWith({ token: "example" }));
  expect(await screen.findByText(/برای بازیابی رمز عبور فعال است/)).toBeTruthy();
});
