import { Tooltip } from "@/components/ui/tooltip";
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
          <Popover.Popup
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
                <select
                  value={units.length}
                  onChange={(event) =>
                    onChange({ ...units, length: event.target.value as MeasurementUnits["length"] })
                  }
                  className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {Object.entries(LENGTH_UNITS).map(([value, { label }]) => (
                    <option key={value} value={value}>
                      {label} ({value})
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs font-medium">
                مساحت
                <select
                  value={units.area}
                  onChange={(event) =>
                    onChange({ ...units, area: event.target.value as MeasurementUnits["area"] })
                  }
                  className="mt-2 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {Object.entries(AREA_UNITS).map(([value, { label }]) => (
                    <option key={value} value={value}>
                      {label} ({value})
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
