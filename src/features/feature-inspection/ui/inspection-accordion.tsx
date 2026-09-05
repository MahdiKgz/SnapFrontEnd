import type { ReactNode } from "react";

import { Accordion } from "@base-ui/react/accordion";
import { ChevronDown } from "lucide-react";

export function InspectionAccordion({
  title,
  children,
  className,
}: {
  title: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Accordion.Root className={className}>
      <Accordion.Item value="details">
        <Accordion.Header>
          <Accordion.Trigger className="group flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-right text-xs font-semibold transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span>{title}</span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-out group-data-[panel-open]:rotate-180 motion-reduce:transition-none" />
          </Accordion.Trigger>
        </Accordion.Header>
        <Accordion.Panel className="h-[var(--accordion-panel-height)] overflow-hidden opacity-100 transition-[height,opacity] duration-200 ease-out data-[starting-style]:h-0 data-[starting-style]:opacity-0 data-[ending-style]:h-0 data-[ending-style]:opacity-0 motion-reduce:transition-none">
          {children}
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion.Root>
  );
}
