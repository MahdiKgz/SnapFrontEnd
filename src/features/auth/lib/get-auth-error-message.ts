import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

interface ErrorPayload {
  message?: string;
  code?: string;
}

const recoveryErrors: Record<string, string> = {
  ACCOUNT_EMAIL_UNAVAILABLE: "ارسال ایمیل فعلاً در دسترس نیست. کمی بعد دوباره تلاش کنید.",
  EMAIL_ALREADY_VERIFIED: "این ایمیل قبلاً برای حساب شما تأیید شده است.",
  EMAIL_UNAVAILABLE: "امکان تأیید این ایمیل برای حساب شما وجود ندارد.",
  INVALID_CURRENT_PASSWORD: "رمز عبور فعلی صحیح نیست.",
  INVALID_EMAIL: "یک آدرس ایمیل معتبر وارد کنید.",
  INVALID_EMAIL_LINK: "این لینک معتبر نیست یا اعتبار آن به پایان رسیده است.",
  INVALID_PASSWORD: "رمز عبور باید حداقل ۸ نویسه و حداکثر ۱۲۸ بایت باشد.",
  RATE_LIMITED: "تعداد درخواست‌ها زیاد است. کمی بعد دوباره تلاش کنید.",
};

export function getAuthErrorMessage(error: unknown) {
  if (isFetchBaseQueryError(error)) {
    if (error.status === "FETCH_ERROR") {
      return "ارتباط با سرور برقرار نشد. لطفاً دوباره تلاش کنید.";
    }

    if (hasMessage(error.data)) {
      const translated = recoveryErrors[error.data.code ?? ""];
      if (typeof translated === "string") return translated;
      if (typeof error.data.message === "string" && error.status !== 500) return error.data.message;
    }

    if (error.status === 401) {
      return "شماره همراه یا رمز عبور صحیح نیست.";
    }

    if (error.status === 409) {
      return "حسابی با این شماره همراه از قبل وجود دارد.";
    }
  }

  return "خطایی رخ داد. لطفاً کمی بعد دوباره تلاش کنید.";
}

function isFetchBaseQueryError(error: unknown): error is FetchBaseQueryError {
  return typeof error === "object" && error !== null && "status" in error;
}

function hasMessage(data: unknown): data is ErrorPayload {
  return typeof data === "object" && data !== null && ("message" in data || "code" in data);
}
