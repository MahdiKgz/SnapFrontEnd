import { type FormEvent, type ReactNode, useState } from "react";

import { useAppSelector } from "@/app/store/hooks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@base-ui/react/dialog";
import { Building2, Crown, LoaderCircle, RefreshCw, Users } from "lucide-react";

import {
  useGetBusinessContextQuery,
  useGetCompanyQuery,
  useRemoveColleagueMutation,
  useRenameCompanyMutation,
  useRespondCompanyInvitationMutation,
  useRevokeCompanyInvitationMutation,
} from "../api/business-api";
import { type BusinessContext, businessError, count } from "../model/types";
import { AddColleagueDialog } from "./add-colleague-dialog";

export function BusinessMessage({ error, children }: { error?: boolean; children: ReactNode }) {
  return (
    <p
      role={error ? "alert" : "status"}
      className={`rounded-xl border p-3 text-sm ${error ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-primary/25 bg-primary/5 text-primary"}`}
    >
      {children}
    </p>
  );
}
export function ConfirmBusinessAction({
  title,
  description,
  busy,
  onClose,
  onConfirm,
}: {
  title: string;
  description: string;
  busy: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/45" />
        <Dialog.Popup
          dir="rtl"
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100%_-_2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-border bg-card p-6 text-foreground shadow-xl"
        >
          <Dialog.Title className="font-bold">{title}</Dialog.Title>
          <Dialog.Description className="mt-3 text-sm leading-7 text-muted-foreground">
            {description}
          </Dialog.Description>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" disabled={busy} onClick={onClose}>
              انصراف
            </Button>
            <Button disabled={busy} onClick={onConfirm}>
              {busy && <LoaderCircle className="size-4 animate-spin" />}تأیید
            </Button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export default function CompanyPage() {
  const context = useGetBusinessContextQuery(undefined, {
    pollingInterval: 30000,
    refetchOnMountOrArgChange: true,
  });
  const data = context.data?.data;
  return (
    <div className="h-full overflow-y-auto p-5 md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-primary">حساب و همکاری تیمی</p>
            <h1 className="mt-1 text-2xl font-black">پلن و شرکت</h1>
          </div>
          <Button
            variant="outline"
            size="icon"
            aria-label="به‌روزرسانی اطلاعات شرکت"
            onClick={() => void context.refetch()}
          >
            <RefreshCw className={context.isFetching ? "size-4 animate-spin" : "size-4"} />
          </Button>
        </header>
        {context.isError ? (
          <BusinessMessage error>{businessError(context.error)}</BusinessMessage>
        ) : !data ? (
          <p className="flex items-center gap-2 text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" />
            در حال دریافت اطلاعات...
          </p>
        ) : (
          <>
            <section className="flex items-center gap-4 rounded-2xl border border-primary/25 bg-primary/5 p-5">
              <Crown className="size-8 shrink-0 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">پلن شخصی شما</p>
                <h2 className="mt-1 font-bold">{data.plan.name}</h2>
                <p className="mt-2 text-xs leading-6 text-muted-foreground">
                  فعال‌سازی و تغییر پلن توسط مدیر سامانه انجام می‌شود.
                </p>
                {data.company?.role === "member" && data.company.active && (
                  <p className="text-xs leading-6 text-primary">
                    عضویت فعال در {data.company.name} · امکانات شرکتی در دسترس شماست.
                  </p>
                )}
              </div>
            </section>
            <CompanyInvitations invitations={data.invitations} />
            {data.company?.role === "owner" ? (
              <OwnerCompany />
            ) : data.company ? (
              <MemberCompany company={data.company} />
            ) : (
              <section className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
                <Building2 className="mx-auto size-10 text-primary" />
                <h2 className="mt-4 font-bold">فضای شرکت‌های GIS</h2>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-7 text-muted-foreground">
                  با پلن شرکتی، یک مدیر و حداکثر سه همکار می‌توانند فعالیت تیم را پیگیری کنند. برای
                  فعال‌سازی این پلن با مدیر سامانه هماهنگ کنید؛ دعوت شرکت‌ها نیز همین‌جا نمایش داده
                  می‌شود.
                </p>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
function CompanyInvitations({ invitations }: { invitations: BusinessContext["invitations"] }) {
  const [respond, state] = useRespondCompanyInvitationMutation();
  const [error, setError] = useState("");
  const answer = async (id: string, action: "accept" | "decline") => {
    setError("");
    try {
      await respond({ id, action }).unwrap();
    } catch (failure) {
      setError(businessError(failure));
    }
  };
  if (!invitations.length) return null;
  return (
    <section className="space-y-3 rounded-2xl border border-primary/25 bg-card p-5">
      <h2 className="font-bold">دعوت‌های همکاری ({count(invitations.length)})</h2>
      {invitations.map((invite) => (
        <article
          key={invite.id}
          className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border p-4"
        >
          <div>
            <h3 className="text-sm font-bold">{invite.companyName}</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              مدیر: {invite.managerName} · معتبر تا{" "}
              {new Date(invite.expiresAt).toLocaleDateString("fa-IR")}
            </p>
            <p className="mt-2 text-xs leading-6 text-muted-foreground">
              با پذیرش، آمار آپلودها و ترمیم‌های زمان عضویت شما در گزارش شرکت دیده می‌شود.
            </p>
          </div>
          <div className="flex gap-2">
            <Button disabled={state.isLoading} onClick={() => void answer(invite.id, "accept")}>
              پذیرش دعوت
            </Button>
            <Button
              variant="outline"
              disabled={state.isLoading}
              onClick={() => void answer(invite.id, "decline")}
            >
              رد دعوت
            </Button>
          </div>
        </article>
      ))}
      {error && <BusinessMessage error>{error}</BusinessMessage>}
    </section>
  );
}
function MemberCompany({ company }: { company: NonNullable<BusinessContext["company"]> }) {
  const userId = useAppSelector((state) => state.auth.user?.id);
  const [leave, leaving] = useRemoveColleagueMutation();
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState("");
  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-5">
      <h2 className="flex items-center gap-2 font-bold">
        <Users className="size-5 text-primary" />
        {company.name}
      </h2>
      <p className="text-sm leading-7 text-muted-foreground">
        شما از {new Date(company.joinedAt).toLocaleDateString("fa-IR")} همکار این شرکت هستید.
        فایل‌ها در حساب خودتان مدیریت می‌شوند؛ مدیر شرکت آمار فعالیت‌های زمان عضویت را می‌بیند.
      </p>
      {!company.active && (
        <BusinessMessage error>
          پلن شرکتی مدیر فعال نیست. امکانات شرکت تا فعال‌سازی مجدد تعلیق شده‌اند.
        </BusinessMessage>
      )}
      <Button variant="outline" onClick={() => setConfirm(true)}>
        خروج از شرکت
      </Button>
      {error && <BusinessMessage error>{error}</BusinessMessage>}
      {confirm && (
        <ConfirmBusinessAction
          title="خروج از شرکت"
          description="آپلودهای بعدی به شرکت نسبت داده نمی‌شوند. آمار قبلی شرکت حفظ می‌شود و فایل‌های حساب شما تغییری نمی‌کنند."
          busy={leaving.isLoading}
          onClose={() => setConfirm(false)}
          onConfirm={() => {
            if (userId)
              void leave(userId)
                .unwrap()
                .catch((failure) => setError(businessError(failure)))
                .finally(() => setConfirm(false));
          }}
        />
      )}
    </section>
  );
}
function OwnerCompany() {
  const query = useGetCompanyQuery(undefined, {
    pollingInterval: 30000,
    refetchOnMountOrArgChange: true,
  });
  const data = query.data?.data;
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [editName, setEditName] = useState<string | null>(null);
  const [rename, renaming] = useRenameCompanyMutation();
  const [remove, removing] = useRemoveColleagueMutation();
  const [revoke, revoking] = useRevokeCompanyInvitationMutation();
  const [confirm, setConfirm] = useState<{
    id: string;
    name: string;
    kind: "member" | "invite";
  } | null>(null);
  const saveName = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      await rename(editName ?? "").unwrap();
      setEditName(null);
      setMessage("نام شرکت ذخیره شد.");
    } catch (failure) {
      setError(businessError(failure));
    }
  };
  const removeConfirmed = async () => {
    if (!confirm) return;
    setError("");
    try {
      await (confirm.kind === "member" ? remove(confirm.id) : revoke(confirm.id)).unwrap();
      setMessage(confirm.kind === "member" ? "عضویت همکار پایان یافت." : "دعوت لغو شد.");
    } catch (failure) {
      setError(businessError(failure));
    } finally {
      setConfirm(null);
    }
  };
  if (query.isError) return <BusinessMessage error>{businessError(query.error)}</BusinessMessage>;
  if (!data) return <p className="text-sm text-muted-foreground">در حال دریافت آمار شرکت...</p>;
  const metrics = [
    { title: "کل آپلودهای شرکت", value: count(data.usage.uploads) },
    {
      title: "حجم فایل‌های آپلودشده",
      value: `${count(Math.round((data.usage.bytes / 1048576) * 100) / 100)} MB`,
      ltr: true,
    },
    { title: "خطاهای شناسایی‌شده", value: count(data.usage.identifiedIssues) },
    { title: "خطاهای ترمیم‌شده", value: count(data.usage.healedIssues) },
  ];
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold">{data.name}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              یک مدیر + {count(data.seats.limit)} همکار · {count(data.seats.members)} عضو ·{" "}
              {count(data.seats.invitations)} دعوت در انتظار
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setEditName(data.name)}>
              ویرایش نام
            </Button>
            <AddColleagueDialog
              disabled={!data.active || data.seats.total >= data.seats.limit}
              onSuccess={setMessage}
            />
          </div>
        </div>
        {editName !== null && (
          <form onSubmit={(event) => void saveName(event)} className="mt-4 flex flex-wrap gap-2">
            <Input
              aria-label="نام شرکت"
              value={editName}
              maxLength={150}
              onChange={(event) => setEditName(event.target.value)}
              className="max-w-sm"
            />
            <Button type="submit" disabled={renaming.isLoading}>
              ذخیره نام
            </Button>
            <Button variant="ghost" type="button" onClick={() => setEditName(null)}>
              انصراف
            </Button>
          </form>
        )}
        {!data.active && (
          <div className="mt-4">
            <BusinessMessage error>
              پلن شرکتی فعال نیست؛ افزودن همکار و پذیرش دعوت تا فعال‌سازی مجدد در دسترس نیست.
            </BusinessMessage>
          </div>
        )}
        {data.seats.total >= data.seats.limit && (
          <p className="mt-3 text-xs text-muted-foreground">
            ظرفیت همکاران تکمیل است. دعوت‌های در انتظار نیز جایگاه رزرو می‌کنند.
          </p>
        )}
      </section>
      {message && <BusinessMessage>{message}</BusinessMessage>}
      {error && <BusinessMessage error>{error}</BusinessMessage>}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric) => (
          <article key={metric.title} className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-xs text-muted-foreground">{metric.title}</h3>
            <strong
              dir={metric.ltr ? "ltr" : undefined}
              className="mt-3 block text-right text-2xl font-black"
            >
              {metric.value}
            </strong>
          </article>
        ))}
      </section>
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="p-5">
          <h2 className="font-bold">فعالیت اعضای شرکت</h2>
          <p className="mt-2 text-xs leading-6 text-muted-foreground">
            آمار از زمان عضویت محاسبه می‌شود. مجموع شرکت، فعالیت همکاران قبلی و فایل‌های حذف‌شده را
            نیز حفظ می‌کند. فایل‌های موجود: {count(data.usage.storedFiles)}
          </p>
        </div>
        <div className="max-h-96 overflow-auto">
          <table className="w-full min-w-[650px] text-right text-xs">
            <thead className="sticky top-0 bg-muted">
              <tr>
                {["همکار", "نقش", "آپلود", "خطا", "ترمیم", "عملیات"].map((title) => (
                  <th key={title} className="px-5 py-3 font-medium">
                    {title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.members.map((member) => (
                <tr key={member.id} className="border-t border-border">
                  <td className="px-5 py-4">
                    <p className="font-semibold">{member.name}</p>
                    <p dir="ltr" className="mt-1 text-right text-muted-foreground">
                      {member.phone}
                    </p>
                  </td>
                  <td className="px-5 py-4">{member.role === "owner" ? "مدیر شرکت" : "همکار"}</td>
                  <td className="px-5 py-4">{count(member.usage.uploads)}</td>
                  <td className="px-5 py-4">{count(member.usage.identifiedIssues)}</td>
                  <td className="px-5 py-4">{count(member.usage.healedIssues)}</td>
                  <td className="px-5 py-4">
                    {member.role !== "owner" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`حذف ${member.name}`}
                        onClick={() =>
                          setConfirm({ id: member.id, name: member.name, kind: "member" })
                        }
                      >
                        حذف همکار
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {data.invitations.length > 0 && (
        <section className="space-y-3 rounded-2xl border border-border bg-card p-5">
          <h2 className="font-bold">دعوت‌های در انتظار</h2>
          {data.invitations.map((invite) => (
            <div
              key={invite.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"
            >
              <div>
                <p className="text-sm font-semibold">{invite.user.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  <bdi dir="ltr">{invite.user.phone}</bdi> · انقضا:{" "}
                  {new Date(invite.expiresAt).toLocaleDateString("fa-IR")}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setConfirm({ id: invite.id, name: invite.user.name, kind: "invite" })
                }
              >
                لغو دعوت
              </Button>
            </div>
          ))}
        </section>
      )}
      {confirm && (
        <ConfirmBusinessAction
          title={
            confirm.kind === "member" ? `حذف ${confirm.name} از شرکت` : `لغو دعوت ${confirm.name}`
          }
          description={
            confirm.kind === "member"
              ? "عضویت همکار پایان می‌یابد و جایگاه آزاد می‌شود. فایل‌های او و آمار گذشتهٔ شرکت حفظ می‌شوند."
              : "این دعوت دیگر قابل پذیرش نخواهد بود و جایگاه رزروشده آزاد می‌شود."
          }
          busy={removing.isLoading || revoking.isLoading}
          onClose={() => setConfirm(null)}
          onConfirm={() => void removeConfirmed()}
        />
      )}
    </div>
  );
}
