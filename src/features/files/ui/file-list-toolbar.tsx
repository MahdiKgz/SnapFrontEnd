import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover } from "@base-ui/react/popover";
import { RefreshCw, Search, SlidersHorizontal, X } from "lucide-react";

export interface FileFilterValues {
  fileType: string;
  hasIssues: string;
  uploadedFrom: string;
  uploadedTo: string;
}
export const EMPTY_FILE_FILTERS: FileFilterValues = {
  fileType: "",
  hasIssues: "",
  uploadedFrom: "",
  uploadedTo: "",
};
export function FileListToolbar({
  search,
  onSearchChange,
  filters,
  onFiltersChange,
  isFetching,
  onRefresh,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  filters: FileFilterValues;
  onFiltersChange: (value: FileFilterValues) => void;
  isFetching: boolean;
  onRefresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(filters);
  const count = Object.values(filters).filter(Boolean).length;
  const invalidRange = !!(
    draft.uploadedFrom &&
    draft.uploadedTo &&
    draft.uploadedFrom > draft.uploadedTo
  );
  const selectClass =
    "mt-1.5 h-9 w-full rounded-lg border border-input bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  return (
    <div className="flex w-full items-center gap-2 sm:w-auto">
      <div className="relative min-w-0 flex-1 sm:w-56">
        <Search className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          aria-label="جستجوی فایل‌ها"
          placeholder="جستجوی نام فایل…"
          value={search}
          maxLength={150}
          onChange={(event) => onSearchChange(event.target.value)}
          className="h-9 pl-9 pr-9 text-xs [&::-webkit-search-cancel-button]:hidden"
        />
        {search && (
          <button
            type="button"
            aria-label="پاک‌کردن جستجو"
            onClick={() => onSearchChange("")}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-accent"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>
      <Popover.Root
        open={open}
        onOpenChange={(value) => {
          if (value) setDraft(filters);
          setOpen(value);
        }}
      >
        <Popover.Trigger
          render={
            <Button
              type="button"
              size="icon"
              variant={count ? "secondary" : "outline"}
              aria-label="فیلتر فایل‌ها"
              title="فیلتر فایل‌ها"
              className="relative shrink-0"
            >
              <SlidersHorizontal />
              {count > 0 && (
                <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
                  {count.toLocaleString("fa-IR")}
                </span>
              )}
            </Button>
          }
        />
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
              aria-label="فیلتر فایل‌ها"
              className="w-80 max-w-[calc(100vw-1.5rem)] rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-xl"
            >
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  if (invalidRange) return;
                  onFiltersChange(draft);
                  setOpen(false);
                }}
              >
                <header className="mb-4 flex items-center justify-between">
                  <Popover.Title className="text-sm font-bold">فیلتر فایل‌ها</Popover.Title>
                  <Popover.Close
                    aria-label="بستن فیلترها"
                    className="rounded p-1 text-muted-foreground hover:bg-accent"
                  >
                    <X className="size-4" />
                  </Popover.Close>
                </header>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs">
                    نوع فایل
                    <select
                      className={selectClass}
                      value={draft.fileType}
                      onChange={(e) => setDraft({ ...draft, fileType: e.target.value })}
                    >
                      <option value="">همه</option>
                      {["geojson", "json", "kml", "kmz", "shp", "zip"].map((value) => (
                        <option key={value} value={value}>
                          {value.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs">
                    خطاهای شناسایی‌شده
                    <select
                      className={selectClass}
                      value={draft.hasIssues}
                      onChange={(e) => setDraft({ ...draft, hasIssues: e.target.value })}
                    >
                      <option value="">همه</option>
                      <option value="true">دارای خطا</option>
                      <option value="false">بدون خطا</option>
                    </select>
                  </label>
                  <label className="col-span-2 text-xs">
                    بارگذاری از تاریخ
                    <Input
                      type="date"
                      aria-label="بارگذاری از تاریخ"
                      dir="ltr"
                      value={draft.uploadedFrom}
                      max={draft.uploadedTo || undefined}
                      onChange={(e) => setDraft({ ...draft, uploadedFrom: e.target.value })}
                      className="mt-1.5 h-9"
                    />
                  </label>
                  <label className="col-span-2 text-xs">
                    بارگذاری تا تاریخ
                    <Input
                      type="date"
                      aria-label="بارگذاری تا تاریخ"
                      dir="ltr"
                      value={draft.uploadedTo}
                      min={draft.uploadedFrom || undefined}
                      onChange={(e) => setDraft({ ...draft, uploadedTo: e.target.value })}
                      className="mt-1.5 h-9"
                    />
                  </label>
                </div>
                <p className="mt-2 text-[10px] text-muted-foreground">
                  بازه بر اساس تاریخ محلی شما، شامل تمام روز پایانی است.
                </p>
                {invalidRange && (
                  <p role="alert" className="mt-2 text-xs text-destructive">
                    تاریخ پایان نباید قبل از تاریخ شروع باشد.
                  </p>
                )}
                <footer className="mt-4 flex gap-2">
                  <Button type="submit" className="flex-1" disabled={invalidRange}>
                    اعمال فیلترها
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDraft(EMPTY_FILE_FILTERS);
                      onFiltersChange(EMPTY_FILE_FILTERS);
                      setOpen(false);
                    }}
                  >
                    پاک‌کردن فیلترها
                  </Button>
                </footer>
              </form>
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
      <Button
        type="button"
        size="icon"
        variant="outline"
        aria-label="به‌روزرسانی فهرست"
        onClick={onRefresh}
        disabled={isFetching}
        className="shrink-0"
      >
        <RefreshCw className={isFetching ? "animate-spin" : ""} />
      </Button>
    </div>
  );
}
