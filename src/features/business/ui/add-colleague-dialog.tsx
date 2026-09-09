import { type FormEvent, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@base-ui/react/dialog";
import { LoaderCircle, Search, UserPlus, X } from "lucide-react";

import { useAddColleagueMutation, useLookupColleagueMutation } from "../api/business-api";
import { type Person, businessError } from "../model/types";

export function AddColleagueDialog({
  disabled,
  onSuccess,
}: {
  disabled: boolean;
  onSuccess: (message: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger render={<Button disabled={disabled} />}>
        <UserPlus className="size-4" />
        افزودن همکار
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm" />
        <Dialog.Popup
          dir="rtl"
          className="fixed left-1/2 top-1/2 z-50 max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card p-6 text-foreground shadow-xl"
        >
          <div className="flex items-center justify-between gap-3">
            <Dialog.Title className="font-bold">افزودن همکار به شرکت</Dialog.Title>
            <Dialog.Close render={<Button variant="ghost" size="icon" aria-label="بستن" />}>
              <X className="size-4" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-2 text-xs leading-6 text-muted-foreground">
            شمارهٔ حساب ثبت‌شدهٔ همکار را وارد کنید و پس از بررسی مشخصات، برایش دعوت بفرستید.
          </Dialog.Description>
          {open && (
            <ColleagueForm
              onDone={(message) => {
                setOpen(false);
                onSuccess(message);
              }}
            />
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
function ColleagueForm({ onDone }: { onDone: (message: string) => void }) {
  const [phone, setPhone] = useState("");
  const [person, setPerson] = useState<Person | null>(null);
  const [error, setError] = useState("");
  const [lookup, finding] = useLookupColleagueMutation();
  const [add, adding] = useAddColleagueMutation();
  const generation = useRef(0);
  const request = useRef<{ abort: () => void } | null>(null);
  useEffect(
    () => () => {
      generation.current++;
      request.current?.abort();
    },
    [],
  );
  const search = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setPerson(null);
    const current = ++generation.current;
    const active = lookup(phone);
    request.current = active;
    try {
      const result = await active.unwrap();
      if (generation.current === current) setPerson(result.data);
    } catch (failure) {
      if (generation.current === current) setError(businessError(failure));
    }
  };
  const confirm = async () => {
    if (!person) return;
    setError("");
    try {
      await add({ userId: person.id }).unwrap();
      onDone("دعوت در حساب همکار ثبت شد و در انتظار پاسخ است.");
    } catch (failure) {
      setError(businessError(failure));
    }
  };
  return (
    <div className="mt-5 space-y-5">
      <form onSubmit={(event) => void search(event)} className="space-y-2">
        <label htmlFor="colleague-phone" className="text-xs font-medium">
          شماره تلفن همکار
        </label>
        <div className="flex gap-2">
          <Input
            id="colleague-phone"
            type="tel"
            dir="ltr"
            placeholder="09123456789"
            autoComplete="off"
            value={phone}
            disabled={adding.isLoading}
            onChange={(event) => {
              generation.current++;
              request.current?.abort();
              setPhone(event.target.value);
              setPerson(null);
              setError("");
            }}
          />
          <Button
            type="submit"
            variant="outline"
            disabled={!phone.trim() || finding.isLoading || adding.isLoading}
          >
            {finding.isLoading ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Search className="size-4" />
            )}
            بررسی
          </Button>
        </div>
      </form>
      {person && (
        <>
          <article
            aria-label="مشخصات همکار"
            className="rounded-xl border border-primary/25 bg-primary/5 p-4"
          >
            <p className="font-bold">{person.name}</p>
            <p dir="ltr" className="mt-1 text-right text-sm text-muted-foreground">
              {person.phone}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              عضو سامانه از {new Date(person.createdAt).toLocaleDateString("fa-IR")}
            </p>
          </article>
          <p className="rounded-xl border border-border p-3 text-sm leading-7">
            عضویت فقط با پذیرش دعوت توسط خود همکار فعال می‌شود. دعوت در پنل او نمایش داده می‌شود و
            ظرفیت تا ۷ روز رزرو می‌ماند.
          </p>
          <p className="text-xs leading-6 text-muted-foreground">
            آمار فعالیت‌های پس از عضویت با شرکت به اشتراک گذاشته می‌شود. فایل‌های شخصی قبلی در آمار
            شرکت نمی‌آیند.
          </p>
          <Button
            className="w-full"
            disabled={adding.isLoading || finding.isLoading}
            onClick={() => void confirm()}
          >
            {adding.isLoading && <LoaderCircle className="size-4 animate-spin" />}
            تأیید مشخصات و ارسال دعوت
          </Button>
        </>
      )}
      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
