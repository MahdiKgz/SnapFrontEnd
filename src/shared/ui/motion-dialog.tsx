import type { ComponentProps } from "react";

import { Dialog } from "@base-ui/react/dialog";
import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@shared/lib/cn";

type BackdropProps = Omit<ComponentProps<typeof Dialog.Backdrop>, "render" | "className"> & {
  className?: string;
};

type PopupProps = Omit<ComponentProps<typeof Dialog.Popup>, "render" | "className"> & {
  className?: string;
};

export function MotionDialogBackdrop({ className, ...props }: BackdropProps) {
  const reduceMotion = useReducedMotion();

  return (
    <Dialog.Backdrop
      {...props}
      render={
        <motion.div
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.2 }}
        />
      }
      className={cn(
        "fixed inset-0 z-50 bg-black/45 backdrop-blur-sm transition-opacity duration-150 data-ending-style:opacity-0 motion-reduce:transition-none",
        className,
      )}
    />
  );
}

export function MotionDialogPopup({ className, ...props }: PopupProps) {
  const reduceMotion = useReducedMotion();

  return (
    <Dialog.Popup
      {...props}
      render={
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: reduceMotion ? 0 : 0.24,
            ease: [0.22, 1, 0.36, 1],
          }}
        />
      }
      className={cn(
        "fixed left-1/2 top-1/2 z-50 max-h-[88vh] w-[calc(100%-2rem)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card text-card-foreground shadow-2xl outline-none transition-[opacity,scale] duration-150 data-ending-style:scale-98 data-ending-style:opacity-0 motion-reduce:transition-none",
        className,
      )}
    />
  );
}
