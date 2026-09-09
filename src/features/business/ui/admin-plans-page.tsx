import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoaderCircle, RefreshCw, Search } from "lucide-react";

import {
  useAssignUserPlanMutation,
  useGetBusinessPlansQuery,
  useGetPlanUsersQuery,
} from "../api/business-api";
import { type PlanCode, type PlanUsers, businessError, count } from "../model/types";
import { BusinessMessage, ConfirmBusinessAction } from "./company-page";

export default function AdminPlansPage() {
  const plans = useGetBusinessPlansQuery();
  const [search, setSearch] = useState("");
  const [queryText, setQueryText] = useState("");
  const [plan, setPlan] = useState("");
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(10);
  const [selection, setSelection] = useState<{
    user: PlanUsers["items"][number];
    planCode: PlanCode;
  } | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [assign, assigning] = useAssignUserPlanMutation();
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQueryText(search.trim());
      setSkip(0);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search]);
  const users = useGetPlanUsersQuery(
    { search: queryText, plan, skip, limit },
    { refetchOnMountOrArgChange: true },
  );
  const page = users.currentData?.data;
  const available = plans.data?.data ?? [];
  const confirm = async () => {
    if (!selection) return;
    setError("");
    try {
      await assign({ userId: selection.user.id, planCode: selection.planCode }).unwrap();
      setMessage(`پلن ${selection.user.name} به‌روزرسانی شد.`);
      setSelection(null);
    } catch (failure) {
      setSelection(null);
      setError(businessError(failure));
    }
  };
  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-y-auto p-5 md:p-8">
      <header className="shrink-0">
        <p className="text-xs font-semibold text-primary">مدیریت سامانه</p>
        <h1 className="mt-1 text-2xl font-black">مدیریت پلن‌ها</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          تعیین پلن کاربران و فعال‌سازی فضای شرکت‌های GIS
        </p>
      </header>
      <section className="grid shrink-0 gap-3 md:grid-cols-3">
        {available.map((item) => (
          <article
            key={item.code}
            className={`rounded-2xl border p-4 ${item.isCompany ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}
          >
            <h2 className="text-sm font-bold">{item.name}</h2>
            <p className="mt-2 text-xs text-muted-foreground">
              تعرفه ماهانه: {count(item.monthlyPrice)} تومان
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {item.isCompany
                ? `یک مدیر + ${count(item.employeeLimit)} همکار و آمار شرکت`
                : "حساب شخصی"}
            </p>
          </article>
        ))}
      </section>
      {plans.isError && <BusinessMessage error>{businessError(plans.error)}</BusinessMessage>}
      {message && <BusinessMessage>{message}</BusinessMessage>}
      {error && <BusinessMessage error>{error}</BusinessMessage>}
      <section className="flex min-h-72 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex shrink-0 flex-wrap items-center gap-3 border-b border-border p-4">
          <div className="relative min-w-48 flex-1">
            <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="جستجوی کاربران"
              type="text"
              placeholder="نام یا شماره تلفن کاربر..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pr-9"
            />
          </div>
          <select
            aria-label="فیلتر پلن"
            className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
            value={plan}
            onChange={(event) => {
              setPlan(event.target.value);
              setSkip(0);
            }}
          >
            <option value="">همهٔ پلن‌ها</option>
            {available.map((item) => (
              <option key={item.code} value={item.code}>
                {item.name}
              </option>
            ))}
          </select>
          <Button
            variant="outline"
            size="icon"
            aria-label="به‌روزرسانی کاربران"
            disabled={users.isFetching}
            onClick={() => void users.refetch()}
          >
            <RefreshCw className={users.isFetching ? "size-4 animate-spin" : "size-4"} />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          {users.isError ? (
            <div className="p-5">
              <BusinessMessage error>{businessError(users.error)}</BusinessMessage>
            </div>
          ) : !page ? (
            <p className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
              <LoaderCircle className="size-4 animate-spin" />
              در حال دریافت کاربران...
            </p>
          ) : (
            <table className="w-full min-w-[580px] text-right text-sm">
              <thead className="sticky top-0 bg-muted text-xs text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">کاربر</th>
                  <th className="px-5 py-3">شماره تلفن</th>
                  <th className="px-5 py-3">پلن فعلی</th>
                  <th className="px-5 py-3">تغییر پلن</th>
                </tr>
              </thead>
              <tbody>
                {page.items.map((user) => (
                  <tr key={user.id} className="border-t border-border">
                    <td className="px-5 py-4 font-semibold">{user.name}</td>
                    <td className="px-5 py-4">
                      <bdi dir="ltr">{user.phone}</bdi>
                    </td>
                    <td className="px-5 py-4 text-xs">{user.plan.name}</td>
                    <td className="px-5 py-4">
                      <select
                        aria-label={`تغییر پلن ${user.name}`}
                        value={user.planCode}
                        disabled={!available.length || assigning.isLoading}
                        onChange={(event) =>
                          setSelection({ user, planCode: event.target.value as PlanCode })
                        }
                        className="h-9 max-w-48 rounded-lg border border-input bg-background px-2 text-xs"
                      >
                        {available.map((item) => (
                          <option key={item.code} value={item.code}>
                            {item.name}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
                {!page.items.length && (
                  <tr>
                    <td colSpan={4} className="p-10 text-center text-muted-foreground">
                      کاربری با این شرایط پیدا نشد.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border p-4 text-xs text-muted-foreground">
          <label className="flex items-center gap-2">
            تعداد در صفحه
            <select
              aria-label="تعداد کاربران در صفحه"
              value={limit}
              onChange={(event) => {
                setLimit(Number(event.target.value));
                setSkip(0);
              }}
              className="rounded border border-input bg-background px-2 py-1"
            >
              {[10, 25, 50].map((size) => (
                <option key={size} value={size}>
                  {count(size)}
                </option>
              ))}
            </select>
          </label>
          <span>{page ? `${count(page.pagination.total)} کاربر` : "—"}</span>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              variant="outline"
              disabled={!skip || users.isFetching}
              onClick={() => setSkip(Math.max(0, skip - limit))}
            >
              قبلی
            </Button>
            <span>صفحهٔ {count(Math.floor(skip / limit) + 1)}</span>
            <Button
              size="sm"
              variant="outline"
              disabled={!page || skip + limit >= page.pagination.total || users.isFetching}
              onClick={() => setSkip(skip + limit)}
            >
              بعدی
            </Button>
          </div>
        </footer>
      </section>
      {selection && (
        <ConfirmBusinessAction
          title={`تغییر پلن ${selection.user.name}`}
          description={`پلن این کاربر به «${available.find((item) => item.code === selection.planCode)?.name}» تغییر کند؟ ${selection.user.planCode === "advanced" && selection.planCode !== "advanced" ? "فضای شرکت حفظ می‌شود، اما افزودن همکار و امکانات شرکتی تا فعال‌سازی مجدد تعلیق خواهند شد." : selection.planCode === "advanced" ? "فضای شرکت با ظرفیت یک مدیر و سه همکار فعال خواهد شد." : ""}`}
          busy={assigning.isLoading}
          onClose={() => setSelection(null)}
          onConfirm={() => void confirm()}
        />
      )}
    </div>
  );
}
