import { type FormEvent, useState } from "react";

import { useAppDispatch } from "@/app/store/hooks";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { AuthFormLayout } from "@widgets/auth-layout";

import {
  getAuthErrorMessage,
  logout,
  useForgotPasswordMutation,
  useResetPasswordMutation,
} from "@features/auth";

const fieldClass = "h-11 border-border/80 bg-card/40 focus-visible:ring-primary/50";
const submitClass =
  "mt-2 h-11 w-full text-base font-semibold shadow-[0_0_20px_rgba(114,180,145,0.15)]";

function BackToLogin() {
  const { state } = useLocation();
  return (
    <Link
      to="/login"
      state={state}
      className="mt-8 block text-center text-sm font-medium text-primary hover:underline"
    >
      بازگشت به ورود
    </Link>
  );
}

export function ForgotPasswordPage() {
  const [sendRequest, { isLoading, isSuccess }] = useForgotPasswordMutation();
  const [error, setError] = useState<string>();

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(undefined);
    const email = String(new FormData(event.currentTarget).get("email")).trim();
    try {
      await sendRequest({ email }).unwrap();
    } catch (error) {
      setError(getAuthErrorMessage(error));
    }
  };

  return (
    <AuthFormLayout
      title="بازیابی رمز عبور"
      description="ایمیلی را وارد کنید که در بخش امنیت حساب تأیید کرده‌اید."
    >
      {isSuccess ? (
        <p
          role="status"
          className="rounded-lg border border-primary/20 bg-primary/10 p-3 text-sm leading-relaxed"
        >
          اگر این ایمیل برای حسابی تأیید شده باشد، لینک بازیابی ارسال می‌شود. صندوق ورودی و پوشه
          هرزنامه را بررسی کنید.
        </p>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-5">
          <div className="space-y-2">
            <Label htmlFor="recovery-email">ایمیل تأییدشده</Label>
            <Input
              id="recovery-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              dir="ltr"
              required
              maxLength={254}
              className={fieldClass}
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" disabled={isLoading} className={submitClass}>
            {isLoading ? "در حال ارسال درخواست…" : "ارسال لینک بازیابی"}
          </Button>
        </form>
      )}
      <BackToLogin />
    </AuthFormLayout>
  );
}

export function ResetPasswordPage() {
  const location = useLocation();
  const token = new URLSearchParams(location.hash.slice(1)).get("token");
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const [error, setError] = useState<string>();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(undefined);
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password"));
    if (password !== form.get("confirmPassword")) {
      setError("رمز عبور جدید و تکرار آن یکسان نیستند.");
      return;
    }
    if (new TextEncoder().encode(password).length > 128) {
      setError("رمز عبور باید حداکثر ۱۲۸ بایت باشد.");
      return;
    }
    if (!token) return;
    try {
      await resetPassword({ token, password }).unwrap();
      dispatch(logout());
      navigate("/login", { replace: true, state: { passwordReset: true } });
    } catch (error) {
      setError(getAuthErrorMessage(error));
    }
  };

  return (
    <AuthFormLayout
      title="تنظیم رمز عبور جدید"
      description="برای حساب SnapGIS خود یک رمز عبور جدید انتخاب کنید."
    >
      {token && /^[A-Za-z0-9_-]{43}$/.test(token) ? (
        <form onSubmit={submit} className="flex flex-col gap-5">
          <div className="space-y-2">
            <Label htmlFor="new-password">رمز عبور جدید</Label>
            <Input
              id="new-password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              className={fieldClass}
            />
            <p className="text-xs text-muted-foreground">حداقل ۸ نویسه وارد کنید.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">تکرار رمز عبور جدید</Label>
            <Input
              id="confirm-password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={128}
              className={fieldClass}
            />
          </div>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <Button type="submit" disabled={isLoading} className={submitClass}>
            {isLoading ? "در حال ذخیره…" : "ذخیره رمز عبور جدید"}
          </Button>
        </form>
      ) : (
        <p role="alert" className="text-sm text-destructive">
          لینک بازیابی معتبر نیست.
        </p>
      )}
      <Link
        to="/auth/forgot"
        className="mt-6 block text-center text-sm font-medium text-primary hover:underline"
      >
        درخواست لینک جدید
      </Link>
    </AuthFormLayout>
  );
}
