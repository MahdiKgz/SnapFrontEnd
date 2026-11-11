import { type FormEvent, useState } from "react";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { MailCheck } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  getAuthErrorMessage,
  useAccountEmailQuery,
  useRequestEmailVerificationMutation,
  useVerifyEmailMutation,
} from "@features/auth";

export function AccountSecurityPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const token = new URLSearchParams(location.hash.slice(1)).get("token");
  const { data, isError, isLoading, refetch } = useAccountEmailQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [sendVerification, { isLoading: isSending }] = useRequestEmailVerificationMutation();
  const [verify, { isLoading: isVerifying }] = useVerifyEmailMutation();
  const [feedback, setFeedback] = useState<{ text: string; error?: boolean }>();

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(undefined);
    const form = event.currentTarget;
    const fields = new FormData(form);
    try {
      await sendVerification({
        email: String(fields.get("email")).trim(),
        password: String(fields.get("password")),
      }).unwrap();
      form.reset();
      setFeedback({ text: "لینک تأیید ارسال شد. صندوق ورودی و پوشه هرزنامه را بررسی کنید." });
    } catch (error) {
      setFeedback({ text: getAuthErrorMessage(error) ?? "", error: true });
    }
  };

  const confirm = async () => {
    if (!token) return;
    setFeedback(undefined);
    try {
      await verify({ token }).unwrap();
      navigate(location.pathname, { replace: true });
      setFeedback({ text: "ایمیل شما تأیید شد و برای بازیابی رمز عبور فعال است." });
    } catch (error) {
      setFeedback({ text: getAuthErrorMessage(error) ?? "", error: true });
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6 lg:p-10">
      <header className="space-y-2">
        <h1 className="text-2xl font-bold">امنیت حساب</h1>
        <p className="text-sm text-muted-foreground">
          برای بازیابی رمز عبور، یک ایمیل در دسترس ثبت و تأیید کنید.
        </p>
      </header>

      {token && (
        <section aria-labelledby="verify-title" className="space-y-3 rounded-xl border bg-card p-5">
          <h2 id="verify-title" className="font-semibold">
            تأیید ایمیل از طریق لینک
          </h2>
          <p className="text-sm text-muted-foreground">
            لینک را در همان حسابی که درخواست را ثبت کرده تأیید کنید.
          </p>
          <Button type="button" onClick={() => void confirm()} disabled={isSending || isVerifying}>
            {isVerifying ? "در حال تأیید…" : "تأیید ایمیل"}
          </Button>
        </section>
      )}

      {feedback && (
        <p
          role={feedback.error ? "alert" : "status"}
          className={feedback.error ? "text-sm text-destructive" : "text-sm text-primary"}
        >
          {feedback.text}
        </p>
      )}

      <section aria-labelledby="email-title" className="space-y-5 rounded-xl border bg-card p-5">
        <div className="flex items-center gap-2">
          <MailCheck className="size-5 text-primary" aria-hidden="true" />
          <h2 id="email-title" className="font-semibold">
            ایمیل بازیابی
          </h2>
        </div>

        {isLoading && (
          <p role="status" className="text-sm text-muted-foreground">
            در حال بررسی وضعیت ایمیل…
          </p>
        )}
        {isError && (
          <div className="space-y-2">
            <p role="alert" className="text-sm text-destructive">
              دریافت وضعیت ایمیل ممکن نشد.
            </p>
            <Button variant="outline" type="button" onClick={() => void refetch()}>
              تلاش دوباره
            </Button>
          </div>
        )}

        {data && (
          <>
            <dl className="space-y-2 text-sm">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <dt className="text-muted-foreground">ایمیل تأییدشده</dt>
                <dd>
                  {data.emailVerifiedAt && data.email ? <bdi>{data.email}</bdi> : "هنوز تأیید نشده"}
                </dd>
              </div>
              {data.pendingEmail && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <dt className="text-muted-foreground">در انتظار تأیید</dt>
                  <dd>
                    <bdi>{data.pendingEmail}</bdi>
                  </dd>
                </div>
              )}
            </dl>

            <form onSubmit={submit} className="space-y-4 border-t pt-5">
              <div className="space-y-2">
                <Label htmlFor="account-email">{data.email ? "ایمیل جدید" : "آدرس ایمیل"}</Label>
                <Input
                  id="account-email"
                  name="email"
                  type="email"
                  dir="ltr"
                  autoComplete="email"
                  placeholder="name@example.com"
                  required
                  maxLength={254}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="account-password">رمز عبور فعلی</Label>
                <Input
                  id="account-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                />
              </div>
              <Button type="submit" disabled={isSending || isVerifying}>
                {isSending ? "در حال ارسال…" : "ارسال لینک تأیید"}
              </Button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
