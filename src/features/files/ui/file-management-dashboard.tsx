import { useEffect, useState } from "react";
import type { FormEvent, ReactNode } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileSearch,
  Files,
  LoaderCircle,
  Pencil,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";

import {
  DEFAULT_FILES_LIMIT,
  useDeleteUserFileMutation,
  useGetUserFileQuery,
  useGetUserFilesQuery,
  useRenameUserFileMutation,
} from "../api/files-api";
import type { UserFileStatus, UserFileSummary } from "../model/types";

const STATUS_PRESENTATION: Record<UserFileStatus, { label: string; className: string }> = {
  "dry-run-complete": {
    label: "بررسی‌شده",
    className: "bg-sky-500/10 text-sky-600 dark:text-sky-300",
  },
  queued: {
    label: "در صف ترمیم",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
  },
  processing: {
    label: "در حال ترمیم",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
  },
  completed: {
    label: "ترمیم‌شده",
    className: "bg-primary/10 text-primary",
  },
  failed: {
    label: "ناموفق",
    className: "bg-destructive/10 text-destructive",
  },
  unavailable: {
    label: "ناموجود",
    className: "bg-muted text-muted-foreground",
  },
};

const REPAIR_LABELS: Record<string, string> = {
  duplicateVerticesRemoved: "رأس‌های تکراری حذف‌شده",
  invalidRingsRepaired: "حلقه‌های نامعتبر ترمیم‌شده",
  ringsAutoClosed: "حلقه‌های بسته‌شده",
  holesRemoved: "حفره‌های نامعتبر حذف‌شده",
  spikesRemoved: "نوک‌های تیز حذف‌شده",
  undershootsRepaired: "Undershootهای ترمیم‌شده",
  overshootsRepaired: "Overshootهای ترمیم‌شده",
  gapsClosed: "شکاف‌های بسته‌شده",
  overlapsHealed: "هم‌پوشانی‌های ترمیم‌شده",
  exactDuplicates: "عارضه‌های تکراری",
  sliversRemovedCount: "پلیگون‌های باریک حذف‌شده",
};

const formatDate = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("fa-IR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";

const formatBytes = (value: number) => {
  if (value < 1024) return `${value.toLocaleString("fa-IR")} بایت`;
  if (value < 1024 * 1024)
    return `${(value / 1024).toLocaleString("fa-IR", { maximumFractionDigits: 1 })} کیلوبایت`;
  return `${(value / (1024 * 1024)).toLocaleString("fa-IR", { maximumFractionDigits: 1 })} مگابایت`;
};

const getRequestError = (error: unknown) => {
  if (typeof error === "object" && error && "data" in error) {
    const data = error.data;
    if (typeof data === "object" && data && "message" in data && typeof data.message === "string") {
      return data.message;
    }
  }
  return "انجام عملیات ممکن نشد. لطفاً دوباره تلاش کنید.";
};

function StatusBadge({ status }: { status: UserFileStatus }) {
  const presentation = STATUS_PRESENTATION[status];
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${presentation.className}`}
    >
      {presentation.label}
    </span>
  );
}

function Modal({
  children,
  onClose,
  title,
}: {
  children: ReactNode;
  onClose: () => void;
  title: string;
}) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="بستن پنجره"
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl"
      >
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 px-5 py-4 backdrop-blur">
          <h2 className="text-base font-bold text-foreground">{title}</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="بستن">
            <X />
          </Button>
        </header>
        {children}
      </section>
    </div>
  );
}

function FileDetailDialog({ fileId, onClose }: { fileId: string; onClose: () => void }) {
  const { data, isError, isFetching, refetch } = useGetUserFileQuery(fileId);
  const file = data?.data;
  const repairs = Object.entries(file?.healing.result?.repairs ?? {}).filter(
    ([, count]) => count > 0,
  );

  return (
    <Modal title="جزئیات فایل" onClose={onClose}>
      <div className="space-y-6 p-5">
        {isFetching && !file ? (
          <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="size-5 animate-spin" />
            در حال دریافت اطلاعات فایل...
          </div>
        ) : isError || !file ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-center">
            <p className="text-sm text-destructive">اطلاعات فایل دریافت نشد.</p>
            <Button className="mt-4" variant="outline" onClick={() => void refetch()}>
              تلاش دوباره
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem label="نام نمایشی" value={file.name} />
              <DetailItem label="نام اصلی فایل" value={file.originalName} dir="ltr" />
              <DetailItem label="زمان بارگذاری" value={formatDate(file.uploadedAt)} />
              <DetailItem label="حجم فایل" value={formatBytes(file.sizeInBytes)} />
              <DetailItem label="نوع فایل" value={file.mimeType} dir="ltr" />
              <div className="rounded-xl border border-border/60 bg-muted/20 p-3">
                <p className="text-[11px] text-muted-foreground">وضعیت</p>
                <div className="mt-2">
                  <StatusBadge status={file.status} />
                </div>
              </div>
            </div>

            <section className="rounded-xl border border-border/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold">خطاهای شناسایی‌شده</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {file.report
                      ? `${file.report.summary.issuesFound.toLocaleString("fa-IR")} خطا در ${file.report.summary.issueGroups.toLocaleString("fa-IR")} گروه`
                      : "گزارش تحلیل این فایل در دسترس نیست."}
                  </p>
                </div>
                {file.report?.valid ? (
                  <CheckCircle2 className="size-5 text-primary" />
                ) : (
                  <AlertTriangle className="size-5 text-amber-500" />
                )}
              </div>
              {file.report && file.report.issueGroups.length > 0 && (
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {file.report.issueGroups.map((group) => (
                    <div key={group.groupId} className="rounded-lg bg-muted/40 px-3 py-2.5">
                      <p className="truncate text-xs font-semibold" dir="ltr">
                        {group.code}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {group.issueCount.toLocaleString("fa-IR")} خطا در{" "}
                        {group.affectedFeatureCount.toLocaleString("fa-IR")} عارضه
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-xl border border-border/60 p-4">
              <h3 className="text-sm font-bold">نتیجه ترمیم</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                {file.isHealed
                  ? `ترمیم در ${formatDate(file.healing.completedAt)} تکمیل شده است.`
                  : `وضعیت فعلی: ${STATUS_PRESENTATION[file.status].label}`}
              </p>
              {file.healing.error && (
                <p className="mt-3 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                  {file.healing.error}
                </p>
              )}
              {repairs.length > 0 ? (
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {repairs.map(([key, count]) => (
                    <div
                      key={key}
                      className="flex items-center justify-between rounded-lg bg-primary/5 px-3 py-2"
                    >
                      <span className="text-xs text-muted-foreground">
                        {REPAIR_LABELS[key] ?? key}
                      </span>
                      <strong className="text-sm text-primary">
                        {count.toLocaleString("fa-IR")}
                      </strong>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-xs text-muted-foreground">
                  هنوز ترمیمی برای این فایل ثبت نشده است.
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </Modal>
  );
}

function DetailItem({ dir, label, value }: { dir?: "ltr" | "rtl"; label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl border border-border/60 bg-muted/20 p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold" dir={dir} title={value}>
        {value}
      </p>
    </div>
  );
}

function RenameDialog({ file, onClose }: { file: UserFileSummary; onClose: () => void }) {
  const [name, setName] = useState(file.name);
  const [error, setError] = useState("");
  const [renameFile, { isLoading }] = useRenameUserFileMutation();

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedName = name.trim();
    if (normalizedName.length < 2 || normalizedName.length > 150) {
      setError("نام باید بین ۲ تا ۱۵۰ نویسه باشد.");
      return;
    }
    try {
      await renameFile({ id: file.id, name: normalizedName }).unwrap();
      onClose();
    } catch (requestError) {
      setError(getRequestError(requestError));
    }
  };

  return (
    <Modal title="ویرایش نام فایل" onClose={onClose}>
      <form className="space-y-4 p-5" onSubmit={(event) => void submit(event)}>
        <div>
          <label htmlFor="edit-file-name" className="text-xs font-medium text-muted-foreground">
            نام نمایشی
          </label>
          <Input
            id="edit-file-name"
            className="mt-2 h-10"
            minLength={2}
            maxLength={150}
            required
            autoFocus
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError("");
            }}
          />
          <p className="mt-2 text-[11px] text-muted-foreground">
            نام اصلی، زمان بارگذاری و نتایج تحلیل قابل ویرایش نیستند.
          </p>
          {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            انصراف
          </Button>
          <Button type="submit" disabled={isLoading || name.trim() === file.name}>
            {isLoading ? "در حال ذخیره..." : "ذخیره تغییرات"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function DeletePopconfirm({
  disabled,
  fileName,
  onConfirm,
}: {
  disabled: boolean;
  fileName: string;
  onConfirm: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  const confirm = async () => {
    setIsDeleting(true);
    setError("");
    try {
      await onConfirm();
      setOpen(false);
    } catch (requestError) {
      setError(getRequestError(requestError));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="relative inline-flex">
      <Button
        type="button"
        size="icon-sm"
        variant="destructive"
        disabled={disabled}
        aria-label={`حذف ${fileName}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        title={disabled ? "حذف هنگام اجرای ترمیم ممکن نیست" : "حذف"}
        onClick={() => setOpen((value) => !value)}
      >
        <Trash2 />
      </Button>
      {open && (
        <div
          role="dialog"
          aria-label="تأیید حذف فایل"
          className="absolute top-[calc(100%+0.5rem)] left-0 z-30 w-72 rounded-xl border border-border bg-popover p-4 text-right shadow-xl"
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
            <div>
              <p className="text-sm font-bold text-popover-foreground">این فایل حذف شود؟</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                فایل «{fileName}»، گزارش تحلیل و خروجی ترمیم‌شده آن برای همیشه حذف می‌شوند.
              </p>
            </div>
          </div>
          {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
          <div className="mt-4 flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isDeleting}
            >
              انصراف
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => void confirm()}
              disabled={isDeleting}
            >
              {isDeleting ? "در حال حذف..." : "بله، حذف شود"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function FileManagementDashboard() {
  const [skip, setSkip] = useState(0);
  const [viewFileId, setViewFileId] = useState<string | null>(null);
  const [editingFile, setEditingFile] = useState<UserFileSummary | null>(null);
  const { data, isError, isFetching, refetch } = useGetUserFilesQuery({
    skip,
    limit: DEFAULT_FILES_LIMIT,
  });
  const [deleteFile] = useDeleteUserFileMutation();
  const page = data?.data;
  const items = page?.items ?? [];
  const total = page?.pagination.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / DEFAULT_FILES_LIMIT));
  const currentPage = Math.floor(skip / DEFAULT_FILES_LIMIT) + 1;

  useEffect(() => {
    if (page && page.items.length === 0 && skip > 0) {
      setSkip(Math.max(0, skip - DEFAULT_FILES_LIMIT));
    }
  }, [page, skip]);

  const handleDelete = async (id: string) => {
    await deleteFile(id).unwrap();
    if (items.length === 1 && skip > 0) {
      setSkip(Math.max(0, skip - DEFAULT_FILES_LIMIT));
    }
  };

  return (
    <div className="h-full overflow-y-auto p-5 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">فایل‌های من</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              فایل‌های مکانی، وضعیت تحلیل و نتیجه ترمیم‌های خود را مدیریت کنید.
            </p>
          </div>
          <Link to="/map" className={buttonVariants({ className: "gap-2" })}>
            <FileSearch />
            بارگذاری و تحلیل فایل
          </Link>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryCard
            icon={<Files />}
            label="تعداد فایل‌ها"
            value={total.toLocaleString("fa-IR")}
          />
          <SummaryCard
            icon={<CheckCircle2 />}
            label="ترمیم‌شده در این صفحه"
            value={items.filter((file) => file.isHealed).length.toLocaleString("fa-IR")}
          />
          <SummaryCard
            icon={<AlertTriangle />}
            label="خطاهای این صفحه"
            value={items
              .reduce((sum, file) => sum + (file.issuesFound ?? 0), 0)
              .toLocaleString("fa-IR")}
          />
        </div>

        <section className="rounded-2xl border border-border/60 bg-card shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
            <div>
              <h2 className="text-base font-bold">فهرست فایل‌های بارگذاری‌شده</h2>
              <p className="mt-1 text-xs text-muted-foreground">مرتب‌شده از جدیدترین بارگذاری</p>
            </div>
            <Button
              size="icon"
              variant="outline"
              aria-label="به‌روزرسانی فهرست"
              onClick={() => void refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={isFetching ? "animate-spin" : ""} />
            </Button>
          </div>

          {isError ? (
            <div className="p-10 text-center">
              <AlertTriangle className="mx-auto size-8 text-destructive" />
              <p className="mt-3 text-sm text-destructive">دریافت فهرست فایل‌ها ممکن نشد.</p>
              <Button className="mt-4" variant="outline" onClick={() => void refetch()}>
                تلاش دوباره
              </Button>
            </div>
          ) : isFetching && !page ? (
            <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-muted-foreground">
              <LoaderCircle className="size-5 animate-spin" />
              در حال دریافت فایل‌ها...
            </div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center">
              <Files className="mx-auto size-10 text-muted-foreground/50" />
              <h3 className="mt-4 text-sm font-bold">هنوز فایلی ندارید</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                اولین فایل مکانی خود را از میز کار نقشه بارگذاری کنید.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[780px] border-collapse text-right">
                <thead>
                  <tr className="h-12 border-b border-border/60 bg-muted/20 text-xs text-muted-foreground">
                    <th className="px-5 font-semibold">نام</th>
                    <th className="px-4 font-semibold">زمان بارگذاری</th>
                    <th className="px-4 font-semibold">ترمیم</th>
                    <th className="px-4 font-semibold">وضعیت</th>
                    <th className="px-5 text-left font-semibold">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {items.map((file) => {
                    const isBusy = file.status === "queued" || file.status === "processing";
                    return (
                      <tr key={file.id} className="h-16 transition-colors hover:bg-muted/20">
                        <td className="max-w-64 px-5">
                          <p className="truncate text-sm font-semibold" title={file.name}>
                            {file.name}
                          </p>
                          <p className="mt-1 truncate text-[11px] text-muted-foreground" dir="ltr">
                            {file.originalName}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-4 text-xs text-muted-foreground">
                          {formatDate(file.uploadedAt)}
                        </td>
                        <td className="px-4">
                          <span
                            className={`text-xs font-semibold ${file.isHealed ? "text-primary" : "text-muted-foreground"}`}
                          >
                            {file.isHealed ? "بله" : "خیر"}
                          </span>
                        </td>
                        <td className="px-4">
                          <StatusBadge status={file.status} />
                        </td>
                        <td className="px-5">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="icon-sm"
                              variant="outline"
                              aria-label={`مشاهده ${file.name}`}
                              title="مشاهده"
                              onClick={() => setViewFileId(file.id)}
                            >
                              <Eye />
                            </Button>
                            <Button
                              size="icon-sm"
                              variant="outline"
                              aria-label={`ویرایش ${file.name}`}
                              title="ویرایش نام"
                              onClick={() => setEditingFile(file)}
                            >
                              <Pencil />
                            </Button>
                            <DeletePopconfirm
                              disabled={isBusy}
                              fileName={file.name}
                              onConfirm={() => handleDelete(file.id)}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <footer className="flex flex-col gap-3 border-t border-border/60 px-5 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>
              نمایش {items.length.toLocaleString("fa-IR")} از {total.toLocaleString("fa-IR")} فایل
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="icon-sm"
                variant="outline"
                aria-label="صفحه قبل"
                disabled={skip === 0 || isFetching}
                onClick={() => setSkip(Math.max(0, skip - DEFAULT_FILES_LIMIT))}
              >
                <ChevronRight />
              </Button>
              <span className="min-w-24 text-center">
                صفحه {currentPage.toLocaleString("fa-IR")} از {totalPages.toLocaleString("fa-IR")}
              </span>
              <Button
                size="icon-sm"
                variant="outline"
                aria-label="صفحه بعد"
                disabled={!page?.pagination.hasMore || isFetching}
                onClick={() => setSkip(skip + DEFAULT_FILES_LIMIT)}
              >
                <ChevronLeft />
              </Button>
            </div>
          </footer>
        </section>
      </div>

      {viewFileId && <FileDetailDialog fileId={viewFileId} onClose={() => setViewFileId(null)} />}
      {editingFile && <RenameDialog file={editingFile} onClose={() => setEditingFile(null)} />}
    </div>
  );
}

function SummaryCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border/60 bg-card p-4 shadow-sm">
      <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary [&_svg]:size-5">
        {icon}
      </span>
      <span>
        <span className="block text-xs text-muted-foreground">{label}</span>
        <strong className="mt-1 block text-xl text-foreground">{value}</strong>
      </span>
    </div>
  );
}
