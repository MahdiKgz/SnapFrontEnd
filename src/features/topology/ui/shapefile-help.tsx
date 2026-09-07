import { Popover } from "@base-ui/react/popover";
import { CircleHelp, X } from "lucide-react";

export function ShapefileHelp() {
  return (
    <Popover.Root>
      <Popover.Trigger
        type="button"
        className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <CircleHelp className="size-3.5" aria-hidden="true" />
        راهنمای Shapefile
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          side="bottom"
          align="end"
          sideOffset={8}
          collisionPadding={12}
          positionMethod="fixed"
          className="z-50"
        >
          <Popover.Popup
            dir="rtl"
            className="max-h-[var(--available-height)] w-72 max-w-[calc(100vw-1.5rem)] overflow-y-auto rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-xl transition-[opacity,transform] duration-150 data-[starting-style]:translate-y-1 data-[starting-style]:opacity-0 data-[ending-style]:translate-y-1 data-[ending-style]:opacity-0 motion-reduce:transition-none"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <Popover.Title className="text-xs font-bold">آپلود Shapefile</Popover.Title>
              <Popover.Close
                type="button"
                aria-label="بستن راهنمای Shapefile"
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="size-3.5" />
              </Popover.Close>
            </div>
            <Popover.Description className="text-[11px] leading-6 text-muted-foreground">
              پیشنهاد: فایل‌های هم‌نام زیر را در یک فایل ZIP قرار دهید و همان ZIP را انتخاب کنید.
            </Popover.Description>
            <dl className="my-3 space-y-1.5 rounded-lg bg-muted/60 p-3 text-[11px]">
              {[
                ["parcels.shp", "هندسهٔ عارضه‌ها"],
                ["parcels.shx", "شاخص هندسه‌ها"],
                ["parcels.dbf", "اطلاعات توصیفی"],
                ["parcels.prj", "سیستم مختصات"],
              ].map(([filename, description]) => (
                <div key={filename} className="flex items-center justify-between gap-3">
                  <dt className="font-mono text-[10px]" dir="ltr">
                    {filename}
                  </dt>
                  <dd className="text-muted-foreground">{description}</dd>
                </div>
              ))}
            </dl>
            <p className="text-[11px] leading-6 text-muted-foreground">
              فایل PRJ برای تبدیل درست مختصات لازم است. اگر فایل CPG دارید، آن را هم برای حفظ
              کدگذاری متن‌ها داخل ZIP بگذارید.
            </p>
            <p className="mt-2 border-t border-border pt-2 text-[11px] leading-6">
              فایل SHP تکی هم پذیرفته می‌شود؛ مختصاتش باید WGS84 باشد و اطلاعات توصیفی همراه آن
              دریافت نمی‌شود.
            </p>
            <p className="mt-2 text-[10px] text-muted-foreground">
              حداکثر حجم فایل آپلودی: ۵ مگابایت
            </p>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
