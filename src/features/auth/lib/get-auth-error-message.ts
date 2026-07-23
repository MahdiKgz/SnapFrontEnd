import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

interface ErrorPayload {
  message?: string;
}

export function getAuthErrorMessage(error: unknown) {
  if (isFetchBaseQueryError(error)) {
    if (error.status === "FETCH_ERROR") {
      return "ارتباط با سرور برقرار نشد. لطفاً دوباره تلاش کنید.";
    }

    if (hasMessage(error.data)) {
      return error.data.message;
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
  return typeof data === "object" && data !== null && "message" in data;
}
