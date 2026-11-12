import { type FormEvent, useRef, useState } from "react";

import { useAppSelector } from "@/app/store/hooks";
import { Dialog } from "@base-ui/react/dialog";
import {
  Clock3,
  LoaderCircle,
  MailCheck,
  Pencil,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import {
  getAuthErrorMessage,
  useAccountEmailQuery,
  useRequestEmailVerificationMutation,
  useVerifyEmailMutation,
} from "@features/auth";
import { BusinessMessage } from "@features/business";

import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";

const fallback = "درخواست انجام نشد. دوباره تلاش کنید.";

export function AccountSecurityPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const phone = useAppSelector((state) => state.auth.user?.phone);
  const token = new URLSearchParams(location.hash.slice(1)).get("token");
  const { data, isError, isLoading, isFetching, refetch } = useAccountEmailQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [sendVerification, { isLoading: isSending }] = useRequestEmailVerificationMutation();
  const [verify, { isLoading: isVerifying }] = useVerifyEmailMutation();
  const [feedback, setFeedback] = useState<{ text: string; error?: boolean }>();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [editingEmail, setEditingEmail] = useState(false);
  const [formError, setFormError] = useState("");
  const dialogTitle = useRef<HTMLHeadingElement>(null);
  const verified = data?.emailVerifiedAt ? data.email : null;

  const start = (value = "") => {
    setEmail(value);
    setEditingEmail(false);
    setFormError("");
    setOpen(true);
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    const fields = new FormData(event.currentTarget);
    try {
      await sendVerification({
        email: email.trim(),
        password: String(fields.get("password") ?? ""),
      }).unwrap();
      setOpen(false);
      setFeedback({ text: "لینک تأیید ارسال شد. صندوق ورودی و پوشهٔ هرزنامه را بررسی کنید." });
    } catch (error) {
      setFormError(getAuthErrorMessage(error) ?? fallback);
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
      setFeedback({ text: getAuthErrorMessage(error) ?? fallback, error: true });
    }
  };

  return (
    <div dir="rtl" className="h-full overflow-y-auto p-5 md:p-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <header>
          <h1 className="text-2xl font-black">امنیت حساب</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            ایمیلی را که برای بازیابی رمز عبور استفاده می‌کنید مدیریت کنید.
          </p>
        </header>

        {token && (
          <section
            aria-labelledby="verify-title"
            className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-primary/25 bg-primary/5 p-4 sm:p-5"
          >
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <h2 id="verify-title" className="text-sm font-bold">
                  تأیید ایمیل بازیابی
                </h2>
                <p className="mt-1 text-xs leading-6 text-muted-foreground">
                  تأیید را در همان حسابی انجام دهید که لینک را درخواست کرده است.
                </p>
              </div>
            </div>
            <Button
              type="button"
              onClick={() => void confirm()}
              disabled={isSending || isVerifying}
            >
              {isVerifying && <LoaderCircle className="size-4 animate-spin" />}
              {isVerifying ? "در حال تأیید…" : "تأیید ایمیل"}
            </Button>
          </section>
        )}

        {feedback && <BusinessMessage error={feedback.error}>{feedback.text}</BusinessMessage>}

        <section
          aria-labelledby="email-title"
          aria-busy={isFetching}
          className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <MailCheck className="size-5" aria-hidden="true" />
              </span>
              <h2 id="email-title" className="text-sm font-bold">
                ایمیل بازیابی
              </h2>
            </div>
            {data && !isError && (
              <Button
                type="button"
                variant={verified ? "outline" : "default"}
                size="sm"
                disabled={isSending || isVerifying}
                onClick={() => start()}
              >
                {verified ? <Pencil className="size-4" /> : <Plus className="size-4" />}
                {verified ? "تغییر ایمیل" : "افزودن ایمیل"}
              </Button>
            )}
          </div>
          {isLoading && (
            <p role="status" className="flex items-center gap-2 p-5 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" /> در حال دریافت وضعیت ایمیل…
            </p>
          )}
          {isError && (
            <div className="space-y-3 p-5">
              <BusinessMessage error>دریافت وضعیت ایمیل انجام نشد.</BusinessMessage>
              <Button variant="outline" size="sm" type="button" onClick={() => void refetch()}>
                <RefreshCw className="size-4" /> تلاش دوباره
              </Button>
            </div>
          )}
          {data && !isError && (
            <dl className="divide-y divide-border text-sm">
              <div className="grid gap-2 px-4 py-4 sm:grid-cols-[minmax(9rem,1fr)_minmax(0,2fr)] sm:items-center sm:px-5">
                <dt className="font-medium">ایمیل تأییدشده</dt>
                <dd className="flex min-w-0 flex-wrap items-center gap-2">
                  {verified ? (
                    <>
                      <bdi dir="ltr" className="break-all">
                        {verified}
                      </bdi>
                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                        فعال
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">هنوز ایمیلی تأیید نشده است.</span>
                  )}
                </dd>
              </div>
              {data.pendingEmail && (
                <div className="grid gap-2 px-4 py-4 sm:grid-cols-[minmax(9rem,1fr)_minmax(0,2fr)] sm:items-center sm:px-5">
                  <dt className="flex items-center gap-2 font-medium">
                    <Clock3 className="size-4 text-muted-foreground" />
                    در انتظار تأیید
                  </dt>
                  <dd className="flex min-w-0 flex-wrap items-center justify-between gap-2">
                    <bdi dir="ltr" className="break-all">
                      {data.pendingEmail}
                    </bdi>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isSending || isVerifying}
                      onClick={() => start(data.pendingEmail ?? "")}
                    >
                      ارسال دوبارهٔ لینک
                    </Button>
                  </dd>
                </div>
              )}
            </dl>
          )}
        </section>

        <Dialog.Root
          open={open}
          onOpenChange={(next) => {
            if (!isSending) setOpen(next);
          }}
        >
          <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/45" />
            <Dialog.Popup
              dir="rtl"
              initialFocus={dialogTitle}
              className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card p-5 text-foreground shadow-xl"
            >
              <header className="mb-4 flex items-center justify-between gap-3">
                <Dialog.Title tabIndex={-1} ref={dialogTitle} className="font-bold outline-none">
                  {verified ? "تغییر ایمیل بازیابی" : "ثبت ایمیل بازیابی"}
                </Dialog.Title>
                <Dialog.Close
                  disabled={isSending}
                  aria-label="بستن"
                  className="rounded-lg p-1.5 hover:bg-muted"
                >
                  <X className="size-4" />
                </Dialog.Close>
              </header>
              <Dialog.Description className="mb-4 text-sm leading-6 text-muted-foreground">
                لینک تأیید به این آدرس فرستاده می‌شود.
              </Dialog.Description>
              {open && (
                <form onSubmit={submit} className="space-y-4">
                  {phone && (
                    <input type="hidden" name="username" autoComplete="username" value={phone} />
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="recovery-address">آدرس ایمیل بازیابی</Label>
                    <Input
                      id="recovery-address"
                      name="recovery-address"
                      type="email"
                      dir="ltr"
                      autoComplete="section-recovery email"
                      placeholder="name@example.com"
                      value={email}
                      readOnly={!editingEmail}
                      onFocus={() => setEditingEmail(true)}
                      onChange={(event) => setEmail(event.target.value)}
                      required
                      maxLength={254}
                      className="h-9 rounded-xl"
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
                      className="h-9 rounded-xl"
                    />
                  </div>
                  {formError && <BusinessMessage error>{formError}</BusinessMessage>}
                  <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isSending}
                      onClick={() => setOpen(false)}
                    >
                      انصراف
                    </Button>
                    <Button type="submit" disabled={isSending || isVerifying || !email.trim()}>
                      {isSending ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : (
                        <Send className="size-4" />
                      )}
                      {isSending ? "در حال ارسال…" : "ارسال لینک تأیید"}
                    </Button>
                  </div>
                </form>
              )}
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </div>
  );
}
