import { useEffect, useState } from "react";

import { Dialog } from "@base-ui/react/dialog";
import {
  Activity,
  ArrowUpLeft,
  ChevronLeft,
  ChevronRight,
  FileText,
  LoaderCircle,
  Pencil,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import {
  BusinessMessage,
  ConfirmBusinessAction,
  businessError,
  count,
  useAssignWriterRoleMutation,
  useGetAdminUserQuery,
  useGetAdminUsersQuery,
  useGetBusinessPlansQuery,
  useUpdateAdminUserMutation,
} from "@features/business";
import type { AdminUser } from "@features/business";

import { Button } from "@shared/ui/button";
import { Input } from "@shared/ui/input";
import { Label } from "@shared/ui/label";
import { MotionDialogBackdrop, MotionDialogPopup } from "@shared/ui/motion-dialog";
import { CustomSelect } from "@shared/ui/select";

const date = (value: string) => new Date(value).toLocaleDateString("fa-IR");
const normalizePhone = (value: string) =>
  value.replace(/[۰-۹٠-٩]/g, (digit) =>
    String(digit.charCodeAt(0) - (digit >= "۰" ? "۰".charCodeAt(0) : "٠".charCodeAt(0))),
  );
const bytes = (value: number) =>
  value >= 1048576
    ? `${count(Math.round((value / 1048576) * 10) / 10)} مگابایت`
    : `${count(Math.ceil(value / 1024))} کیلوبایت`;
const roleNames: Record<string, string> = { user: "کاربر", admin: "مدیر", writer: "نویسنده" };
const statuses: Record<string, string> = {
  "dry-run-complete": "بررسی‌شده",
  queued: "در صف ترمیم",
  processing: "در حال ترمیم",
  completed: "ترمیم‌شده",
  failed: "ناموفق",
  cancelled: "لغوشده",
  unavailable: "ناموجود",
};
export default function AdminUsersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [queryText, setQueryText] = useState("");
  const [plan, setPlan] = useState("");
  const [role, setRole] = useState("");
  const [skip, setSkip] = useState(0);
  const [limit, setLimit] = useState(10);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [writer, setWriter] = useState<AdminUser | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [assignWriter, assigning] = useAssignWriterRoleMutation();
  const plans = useGetBusinessPlansQuery();
  useEffect(() => {
    if (search.trim() === queryText) return;
    const timer = window.setTimeout(() => {
      setQueryText(search.trim());
      setSkip(0);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [search, queryText]);
  const users = useGetAdminUsersQuery(
    { search: queryText, plan, role, skip, limit },
    { refetchOnMountOrArgChange: true },
  );
  const page = users.currentData?.data;
  const available = plans.data?.data ?? [];
  const filtered = Boolean(queryText || plan || role);
  const activityId = searchParams.get("user");
  const openActivity = (id: string | null) => {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (id) next.set("user", id);
        else next.delete("user");
        return next;
      },
      { replace: true },
    );
  };
  const confirmWriter = async () => {
    if (!writer) return;
    setError("");
    setMessage("");
    try {
      await assignWriter({ userId: writer.id, enabled: !writer.roles.includes("writer") }).unwrap();
      setMessage(`دسترسی نویسندگی ${writer.name} به‌روزرسانی شد.`);
      setWriter(null);
    } catch (failure) {
      setWriter(null);
      setError(businessError(failure));
    }
  };
  return (
    <div dir="rtl" className="flex h-full min-h-0 flex-col gap-5 overflow-y-auto p-4 md:p-8">
      <header className="flex shrink-0 flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-primary">مدیریت سامانه</p>
          <h1 className="mt-1 text-2xl font-black">مدیریت کاربران</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            کاربران را پیدا کنید، مشخصاتشان را ویرایش کنید و فعالیت آن‌ها را ببینید.
          </p>
        </div>
        <Link
          to="/dashboard/admin/plans"
          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          مدیریت پلن‌ها <ArrowUpLeft className="size-4" />
        </Link>
      </header>
      <div className="grid shrink-0 gap-3 sm:grid-cols-3">
        <Summary
          icon={<Users className="size-5" />}
          label={filtered ? "کاربران مطابق فیلتر" : "کاربران سامانه"}
          value={page ? count(page.pagination.total) : "—"}
          description="تعداد حساب‌های ثبت‌شده"
        />
        <Summary
          icon={<ShieldCheck className="size-5" />}
          label="مشخصات و دسترسی"
          value="کنترل حساب‌ها"
          description="ویرایش نام، تلفن و نقش نویسنده"
        />
        <Summary
          icon={<Activity className="size-5" />}
          label="فعالیت کاربران"
          value="نمای کلی مصرف"
          description="آپلودها، ترمیم‌ها و فایل‌های اخیر"
        />
      </div>
      {message && <BusinessMessage>{message}</BusinessMessage>}
      {error && <BusinessMessage error>{error}</BusinessMessage>}
      <section
        aria-label="فهرست کاربران"
        className="flex min-h-96 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
      >
        <div className="shrink-0 space-y-3 border-b border-border p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-48 flex-1">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <Input
                aria-label="جستجوی کاربران"
                placeholder="جستجو با نام یا شماره تلفن…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-9 rounded-xl pr-9"
              />
            </div>
            <CustomSelect
              aria-label="فیلتر نقش"
              value={role}
              onValueChange={(value) => {
                setRole(value);
                setSkip(0);
              }}
              options={[
                { value: "", label: "همهٔ نقش‌ها" },
                { value: "user", label: "دارای نقش کاربر" },
                { value: "writer", label: "نویسنده" },
                { value: "admin", label: "مدیر" },
              ]}
              className="rounded-xl"
            />
            <CustomSelect
              aria-label="فیلتر پلن"
              value={plan}
              onValueChange={(value) => {
                setPlan(value);
                setSkip(0);
              }}
              options={[
                { value: "", label: "همهٔ پلن‌ها" },
                ...available.map((item) => ({ value: item.code, label: item.name })),
              ]}
              className="rounded-xl"
            />
            <Button
              variant="outline"
              size="icon-lg"
              aria-label="به‌روزرسانی کاربران"
              disabled={users.isFetching}
              onClick={() => void users.refetch()}
            >
              <RefreshCw className={users.isFetching ? "size-4 animate-spin" : "size-4"} />
            </Button>
          </div>
          {plans.isError && (
            <div className="flex flex-wrap items-center gap-2 text-xs text-destructive">
              <span>فهرست پلن‌ها دریافت نشد.</span>
              <Button variant="ghost" size="xs" onClick={() => void plans.refetch()}>
                تلاش دوباره برای پلن‌ها
              </Button>
            </div>
          )}
          {filtered && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => {
                setSearch("");
                setQueryText("");
                setPlan("");
                setRole("");
                setSkip(0);
              }}
            >
              پاک کردن فیلترها <X className="size-3" />
            </Button>
          )}
        </div>
        <div className="min-h-0 flex-1 overflow-auto" aria-busy={users.isFetching}>
          {users.isError ? (
            <div className="space-y-3 p-6">
              <BusinessMessage error>{businessError(users.error)}</BusinessMessage>
              <Button variant="outline" onClick={() => void users.refetch()}>
                تلاش دوباره
              </Button>
            </div>
          ) : !page ? (
            <Loading text="در حال دریافت کاربران…" />
          ) : !page.items.length ? (
            <div className="flex flex-col items-center gap-3 px-5 py-14 text-center">
              <Users className="size-9 text-muted-foreground/60" />
              <h2 className="font-semibold">کاربری پیدا نشد</h2>
              <p className="text-sm text-muted-foreground">
                {filtered
                  ? "عبارت جستجو یا فیلترها را تغییر دهید."
                  : "هنوز حساب کاربری در سامانه ثبت نشده است."}
              </p>
            </div>
          ) : (
            <table className="w-full min-w-[800px] text-right text-sm">
              <caption className="sr-only">کاربران، نقش‌ها، پلن و فعالیت حساب‌ها</caption>
              <thead className="sticky top-0 z-10 bg-muted text-xs text-muted-foreground">
                <tr>
                  {["کاربر", "نقش و پلن", "فعالیت", "تاریخ عضویت", "عملیات"].map((label) => (
                    <th key={label} scope="col" className="px-5 py-3 font-medium">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {page.items.map((user) => (
                  <tr
                    key={user.id}
                    className="border-t border-border transition-colors hover:bg-muted/30"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span
                          aria-hidden="true"
                          className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-base font-bold text-primary"
                        >
                          {user.name.slice(0, 1)}
                        </span>
                        <div>
                          <p className="font-semibold">{user.name}</p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            <bdi dir="ltr">{user.phone}</bdi>
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {user.roles.map((item) => (
                          <span
                            key={item}
                            className={`rounded-md px-2 py-1 text-[11px] ${item === "admin" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                          >
                            {roleNames[item] ?? item}
                          </span>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">پلن {user.plan.name}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-xs">
                        {count(user.usage.uploads)} آپلود{" "}
                        <span className="mx-1 text-muted-foreground">·</span>{" "}
                        {count(user.storedFiles)} فایل
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {count(user.usage.healedIssues)} ایراد ترمیم‌شده
                      </p>
                    </td>
                    <td className="px-5 py-4 text-xs text-muted-foreground">
                      {date(user.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`ویرایش ${user.name}`}
                          onClick={() => setEditing(user)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`فعالیت ${user.name}`}
                          onClick={() => openActivity(user.id)}
                        >
                          <Activity className="size-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          disabled={assigning.isLoading}
                          aria-label={`${user.roles.includes("writer") ? "لغو" : "اعطای"} نقش نویسنده ${user.name}`}
                          onClick={() => setWriter(user)}
                        >
                          {user.roles.includes("writer") ? "لغو نویسندگی" : "اعطای نویسندگی"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border p-4 text-xs text-muted-foreground">
          <label className="flex items-center gap-2">
            تعداد در صفحه
            <CustomSelect
              aria-label="تعداد کاربران در صفحه"
              value={String(limit)}
              onValueChange={(value) => {
                setLimit(Number(value));
                setSkip(0);
              }}
              options={[10, 25, 50].map((value) => ({
                value: String(value),
                label: count(value),
              }))}
              className="h-8 min-w-20 px-2 text-xs"
            />
          </label>
          <span>{page ? `${count(page.pagination.total)} کاربر` : "—"}</span>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={!skip || users.isFetching}
              onClick={() => setSkip(Math.max(0, skip - limit))}
            >
              <ChevronRight />
              قبلی
            </Button>
            <span>صفحهٔ {count(Math.floor(skip / limit) + 1)}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={!page || skip + limit >= page.pagination.total || users.isFetching}
              onClick={() => setSkip(skip + limit)}
            >
              بعدی
              <ChevronLeft />
            </Button>
          </div>
        </footer>
      </section>
      {editing && (
        <EditUserDialog
          user={editing}
          onClose={() => setEditing(null)}
          onDone={(value) => {
            setMessage(value);
            setError("");
            setEditing(null);
          }}
        />
      )}
      {activityId && (
        <UserActivityDialog
          key={activityId}
          userId={activityId}
          onClose={() => openActivity(null)}
        />
      )}
      {writer && (
        <ConfirmBusinessAction
          title={`${writer.roles.includes("writer") ? "لغو" : "اعطای"} دسترسی نویسندگی`}
          description={`${writer.roles.includes("writer") ? "دسترسی انتشار و مدیریت مقاله" : "امکان انتشار و مدیریت مقاله"} برای «${writer.name}» ${writer.roles.includes("writer") ? "لغو" : "فعال"} شود؟`}
          busy={assigning.isLoading}
          onClose={() => setWriter(null)}
          onConfirm={() => void confirmWriter()}
        />
      )}
    </div>
  );
}

function Summary({
  icon,
  label,
  value,
  description,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
}) {
  return (
    <article className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
      <span className="rounded-xl bg-primary/10 p-2.5 text-primary">{icon}</span>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-2 text-lg font-bold">{value}</p>
        <p className="mt-1 text-[11px] leading-5 text-muted-foreground">{description}</p>
      </div>
    </article>
  );
}

function Loading({ text }: { text: string }) {
  return (
    <p
      role="status"
      className="flex items-center justify-center gap-2 p-12 text-sm text-muted-foreground"
    >
      <LoaderCircle className="size-4 animate-spin" />
      {text}
    </p>
  );
}

function EditUserDialog({
  user,
  onClose,
  onDone,
}: {
  user: AdminUser;
  onClose: () => void;
  onDone: (message: string) => void;
}) {
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(normalizePhone(user.phone));
  const [error, setError] = useState("");
  const [update, updating] = useUpdateAdminUserMutation();
  const changed = name.trim() !== user.name || phone.trim() !== user.phone;
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !updating.isLoading) onClose();
      }}
    >
      <Dialog.Portal>
        <MotionDialogBackdrop className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm" />
        <MotionDialogPopup
          dir="rtl"
          className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card p-6 text-foreground shadow-xl"
        >
          <div className="flex items-center justify-between gap-2">
            <Dialog.Title className="font-bold">ویرایش مشخصات کاربر</Dialog.Title>
            <Button
              variant="ghost"
              size="icon"
              aria-label="بستن ویرایش"
              disabled={updating.isLoading}
              onClick={onClose}
            >
              <X />
            </Button>
          </div>
          <Dialog.Description className="mt-2 text-xs leading-6 text-muted-foreground">
            مشخصات حساب «{user.name}» را به‌روزرسانی کنید. شماره تلفن برای ورود کاربر استفاده
            می‌شود.
          </Dialog.Description>
          <form
            className="mt-5 space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!changed || updating.isLoading) return;
              if (name.trim().length < 2) {
                setError("نام باید حداقل دو نویسه باشد.");
                return;
              }
              if (!/^09\d{9}$/.test(phone.trim())) {
                setError("شماره تلفن را به صورت ۱۱ رقم و با 09 وارد کنید.");
                return;
              }
              setError("");
              try {
                await update({ userId: user.id, name: name.trim(), phone: phone.trim() }).unwrap();
                onDone(`مشخصات ${name.trim()} به‌روزرسانی شد.`);
              } catch (failure) {
                setError(businessError(failure));
              }
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="admin-user-name">نام و نام خانوادگی</Label>
              <Input
                id="admin-user-name"
                required
                minLength={2}
                maxLength={100}
                value={name}
                disabled={updating.isLoading}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-user-phone">شماره تلفن</Label>
              <Input
                id="admin-user-phone"
                type="tel"
                dir="ltr"
                inputMode="tel"
                required
                maxLength={11}
                value={phone}
                disabled={updating.isLoading}
                onChange={(event) => setPhone(normalizePhone(event.target.value))}
              />
              <p className="text-xs text-muted-foreground">
                نمونه: <bdi dir="ltr">09123456789</bdi>
              </p>
            </div>
            {error && <BusinessMessage error>{error}</BusinessMessage>}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={updating.isLoading}
                onClick={onClose}
              >
                انصراف
              </Button>
              <Button type="submit" disabled={!changed || updating.isLoading}>
                {updating.isLoading && <LoaderCircle className="size-4 animate-spin" />}ذخیره
                تغییرات
              </Button>
            </div>
          </form>
        </MotionDialogPopup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function UserActivityDialog({ userId, onClose }: { userId: string; onClose: () => void }) {
  const detail = useGetAdminUserQuery(userId, { refetchOnMountOrArgChange: true });
  const data = detail.currentData?.data;
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <MotionDialogBackdrop className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm" />
        <MotionDialogPopup
          dir="rtl"
          className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card p-5 text-foreground shadow-xl md:p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <Dialog.Title className="font-bold">فعالیت {data?.user.name ?? "کاربر"}</Dialog.Title>
            <Button variant="ghost" size="icon" aria-label="بستن فعالیت" onClick={onClose}>
              <X />
            </Button>
          </div>
          <Dialog.Description className="mt-2 text-xs leading-6 text-muted-foreground">
            آمار مصرف حساب و اطلاعات فایل‌های اخیر کاربر
          </Dialog.Description>
          {detail.isError ? (
            <div className="mt-5 space-y-3">
              <BusinessMessage error>{businessError(detail.error)}</BusinessMessage>
              <Button variant="outline" onClick={() => void detail.refetch()}>
                تلاش دوباره برای فعالیت
              </Button>
            </div>
          ) : !data ? (
            <Loading text="در حال دریافت فعالیت…" />
          ) : (
            <div className="mt-5 space-y-5">
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ["آپلودها", count(data.user.usage.uploads)],
                  ["حجم آپلود", bytes(data.user.usage.bytes)],
                  ["ایراد شناسایی‌شده", count(data.user.usage.identifiedIssues)],
                  ["ایراد ترمیم‌شده", count(data.user.usage.healedIssues)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-border bg-muted/30 p-3">
                    <dt className="text-[11px] text-muted-foreground">{label}</dt>
                    <dd className="mt-2 text-base font-bold">{value}</dd>
                  </div>
                ))}
              </dl>
              <section>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="text-sm font-bold">فایل‌های اخیر</h2>
                  <span className="text-xs text-muted-foreground">
                    {count(data.user.storedFiles)} فایل ذخیره‌شده
                  </span>
                </div>
                {!data.recentFiles.length ? (
                  <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                    هنوز فایلی برای این کاربر ثبت نشده است.
                  </p>
                ) : (
                  <ul className="divide-y divide-border rounded-xl border border-border">
                    {data.recentFiles.map((file) => (
                      <li key={file.id} className="flex items-start gap-3 p-4">
                        <FileText className="mt-1 size-5 shrink-0 text-primary" />
                        <div className="min-w-0 flex-1">
                          <p className="break-all text-sm font-medium">
                            {file.name || file.originalName}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {date(file.createdAt)} <span className="mx-1">·</span>{" "}
                            {bytes(file.sizeInBytes)}
                          </p>
                          <p className="mt-2 text-xs text-muted-foreground">
                            {count(file.identifiedIssues)} ایراد شناسایی‌شده{" "}
                            <span className="mx-1">·</span> {count(file.healedIssues)} ترمیم‌شده
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-md px-2 py-1 text-[11px] ${file.healStatus === "failed" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}
                        >
                          {statuses[file.healStatus] ?? "بررسی‌نشده"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>
          )}
        </MotionDialogPopup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
