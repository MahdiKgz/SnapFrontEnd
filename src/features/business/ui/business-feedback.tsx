import type { ReactNode } from "react";

import { Dialog } from "@base-ui/react/dialog";
import { LoaderCircle } from "lucide-react";

import { Button } from "@shared/ui/button";
import { MotionDialogBackdrop, MotionDialogPopup } from "@shared/ui/motion-dialog";

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
        <MotionDialogBackdrop className="fixed inset-0 z-50 bg-black/45" />
        <MotionDialogPopup
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
        </MotionDialogPopup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
