import { MotionPopoverPopup } from "@/shared/ui/motion-popover";
import { CustomSelect } from "@/shared/ui/select";
import { Tooltip } from "@/shared/ui/tooltip";
import { Popover } from "@base-ui/react/popover";
import { Settings, X } from "lucide-react";

import { AREA_UNITS, LENGTH_UNITS } from "../model/measurement-units";
import type { MeasurementUnits } from "../model/measurement-units";

export function MeasurementSettings({
  units,
  onChange,
}: {
  units: MeasurementUnits;
  onChange: (units: MeasurementUnits) => void;
}) {
  return (
    <Popover.Root>
      <Tooltip content="تنظیم واحد اندازه‌گیری" side="right">
        <Popover.Trigger
          aria-label="تنظیم واحد اندازه‌گیری"
          className="flex size-10 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring data-[popup-open]:bg-accent"
        >
          <Settings className="size-5" />
        </Popover.Trigger>
      </Tooltip>
      <Popover.Portal>
        <Popover.Positioner
          side="right"
          align="start"
          sideOffset={12}
          collisionPadding={12}
          positionMethod="fixed"
          className="z-50"
        >
          <MotionPopoverPopup
            aria-label="تنظیمات اندازه‌گیری"
            dir="rtl"
            className="w-64 max-w-[calc(100vw-2rem)] rounded-2xl border border-border bg-popover p-4 text-popover-foreground shadow-xl"
          >
            <header className="mb-4 flex items-center justify-between gap-2">
              <Popover.Title className="text-sm font-bold">واحد اندازه‌گیری</Popover.Title>
              <Popover.Close
                aria-label="بستن تنظیمات"
                className="rounded-lg p-1 text-muted-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-4" />
              </Popover.Close>
            </header>
            <div className="space-y-4">
              <label className="block text-xs font-medium">
                طول و محیط
                <CustomSelect
                  aria-label="طول و محیط"
                  value={units.length}
                  onValueChange={(value) =>
                    onChange({ ...units, length: value as MeasurementUnits["length"] })
                  }
                  options={Object.entries(LENGTH_UNITS).map(([value, { label }]) => ({
                    value,
                    label: `${label} (${value})`,
                  }))}
                  className="mt-2 w-full"
                />
              </label>
              <label className="block text-xs font-medium">
                مساحت
                <CustomSelect
                  aria-label="مساحت"
                  value={units.area}
                  onValueChange={(value) =>
                    onChange({ ...units, area: value as MeasurementUnits["area"] })
                  }
                  options={Object.entries(AREA_UNITS).map(([value, { label }]) => ({
                    value,
                    label: `${label} (${value})`,
                  }))}
                  className="mt-2 w-full"
                />
              </label>
            </div>
          </MotionPopoverPopup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
