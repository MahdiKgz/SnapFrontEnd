import { type ReactElement, type ReactNode, useId, useState } from "react";

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";

interface TooltipProps {
  children: ReactElement;
  content: ReactNode;
  side?: TooltipPrimitive.Positioner.Props["side"];
  overlap?: boolean;
}

export function Tooltip({ children, content, side = "bottom", overlap = false }: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);

  return (
    <TooltipPrimitive.Root open={open} onOpenChange={setOpen} disableHoverablePopup={overlap}>
      <TooltipPrimitive.Trigger
        render={children}
        delay={250}
        aria-describedby={open ? id : undefined}
      />
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Positioner
          side={overlap ? "bottom" : side}
          sideOffset={overlap ? ({ anchor }) => 8 - anchor.height : 8}
          collisionPadding={12}
          collisionAvoidance={
            overlap
              ? { side: "none", align: "shift", fallbackAxisSide: "none" }
              : { side: "flip", align: "shift", fallbackAxisSide: "end" }
          }
          positionMethod="fixed"
          className={`z-50 data-[anchor-hidden]:hidden ${overlap ? "pointer-events-none" : ""}`}
        >
          <TooltipPrimitive.Popup
            id={id}
            role="tooltip"
            style={overlap ? { maxWidth: "calc(var(--anchor-width) - 1rem)" } : undefined}
            className="max-w-[min(22rem,calc(100vw-1.5rem))] rounded-lg border border-border bg-popover px-3 py-2 text-right text-[11px] leading-5 font-medium whitespace-normal text-popover-foreground shadow-xl [overflow-wrap:anywhere]"
          >
            {content}
          </TooltipPrimitive.Popup>
        </TooltipPrimitive.Positioner>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
