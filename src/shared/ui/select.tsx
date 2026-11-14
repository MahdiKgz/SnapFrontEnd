import { useState } from "react";
import type { ReactNode } from "react";

import { Select } from "@base-ui/react/select";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@shared/lib/cn";

export interface SelectOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

interface CustomSelectProps {
  value: string;
  options: readonly SelectOption[];
  onValueChange: (value: string) => void;
  "aria-label"?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  name?: string;
  placeholder?: string;
  required?: boolean;
}

export function CustomSelect({
  value,
  options,
  onValueChange,
  className,
  disabled,
  id,
  name,
  placeholder = "انتخاب کنید",
  required,
  "aria-label": ariaLabel,
}: CustomSelectProps) {
  const [open, setOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const selected = options.find((option) => option.value === value);

  return (
    <Select.Root
      value={value}
      items={options}
      name={name}
      required={required}
      disabled={disabled}
      open={open}
      onOpenChange={setOpen}
      onValueChange={(nextValue) => {
        if (nextValue !== null) onValueChange(nextValue);
      }}
    >
      <Select.Trigger
        id={id}
        aria-label={ariaLabel}
        className={cn(
          "flex h-9 min-w-24 items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-right text-sm text-foreground shadow-xs outline-none transition-[border-color,box-shadow,background-color] hover:bg-accent/40 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
      >
        <Select.Value>
          {selected ? selected.label : <span className="text-muted-foreground">{placeholder}</span>}
        </Select.Value>
        <Select.Icon className="shrink-0 text-muted-foreground transition-transform duration-200 data-popup-open:rotate-180">
          <ChevronDown className="size-4" />
        </Select.Icon>
      </Select.Trigger>

      <AnimatePresence>
        {open && (
          <Select.Portal>
            <Select.Positioner
              side="bottom"
              align="start"
              sideOffset={6}
              collisionPadding={12}
              alignItemWithTrigger={false}
              className="z-[120] outline-none"
            >
              <Select.Popup
                render={
                  <motion.div
                    initial={reduceMotion ? false : { opacity: 0, y: -6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={reduceMotion ? undefined : { opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: reduceMotion ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }}
                  />
                }
                className="min-w-[var(--anchor-width)] max-w-[min(22rem,calc(100vw-1.5rem))] origin-top overflow-hidden rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-xl shadow-black/10 outline-none"
              >
                <Select.List className="max-h-72 overflow-y-auto overscroll-contain py-0.5">
                  {options.map((option) => (
                    <Select.Item
                      key={option.value}
                      value={option.value}
                      disabled={option.disabled}
                      className="group flex cursor-default items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm outline-none transition-colors data-disabled:pointer-events-none data-disabled:opacity-40 data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                    >
                      <Select.ItemText>{option.label}</Select.ItemText>
                      <Select.ItemIndicator className="text-primary">
                        <Check className="size-4" />
                      </Select.ItemIndicator>
                    </Select.Item>
                  ))}
                </Select.List>
              </Select.Popup>
            </Select.Positioner>
          </Select.Portal>
        )}
      </AnimatePresence>
    </Select.Root>
  );
}
