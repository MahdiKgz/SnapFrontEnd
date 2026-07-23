import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, FileCode2, UploadCloud, X } from "lucide-react";

import { useTopologyUpload } from "../model/use-topology-upload";

interface TopologyFormProps {
  clearPreviewError: () => void;
  isPreviewing: boolean;
  previewError: string;
  previewFile: (file: File) => Promise<void>;
  removePreview: () => void;
}

const ACCEPTED_FILE_TYPES = ".json,.geojson,.kml,.kmz";

export function TopologyForm({
  clearPreviewError,
  isPreviewing,
  previewError,
  previewFile,
  removePreview,
}: TopologyFormProps) {
  const {
    changeName,
    changeTolerance,
    clearFile,
    fileError,
    fileInputRef,
    isError,
    isLoading,
    isSuccess,
    name,
    selectFile,
    selectedFile,
    submit,
    tolerance,
    validationError,
  } = useTopologyUpload({
    clearPreviewError,
    previewFile,
    removePreview,
  });

  return (
    <form onSubmit={submit}>
      <p className="mb-4 text-xs leading-5 text-slate-400">
        فایل داده مکانی خود را برای بررسی و رفع خطاها اضافه کنید.
      </p>

      <div className="space-y-2">
        <Label htmlFor="layer-name" className="text-xs text-slate-300">
          نام (name)
        </Label>
        <Input
          id="layer-name"
          name="name"
          required
          value={name}
          onChange={(event) => changeName(event.target.value)}
          placeholder="برای مثال: محدوده قطعات"
          className="h-10 border-slate-700 bg-slate-900/80 text-slate-100 placeholder:text-slate-500"
        />
      </div>

      <div className="mt-4 space-y-2">
        <Label htmlFor="topology-tolerance" className="text-xs text-slate-300">
          تلورانس (tolerance)
        </Label>
        <div className="relative">
          <Input
            id="topology-tolerance"
            name="tolerance"
            type="number"
            min="1"
            max="50"
            step="1"
            required
            value={tolerance}
            onChange={(event) => changeTolerance(event.target.value)}
            placeholder="۱ تا ۵۰"
            className="h-10 border-slate-700 bg-slate-900/80 pl-12 text-slate-100 placeholder:text-slate-500"
          />
          <span
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-xs font-medium text-slate-500"
            dir="ltr"
          >
            mm
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <Label className="text-xs text-slate-300">فایل (file)</Label>
        <input
          ref={fileInputRef}
          type="file"
          name="file"
          accept={ACCEPTED_FILE_TYPES}
          className="sr-only"
          onChange={(event) => selectFile(event.target.files?.[0])}
        />

        {selectedFile ? (
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
              <FileCode2 className="size-4" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-100" dir="ltr">
                {selectedFile.name}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-400">
                {(selectedFile.size / 1024).toLocaleString("fa-IR", {
                  maximumFractionDigits: 1,
                })}{" "}
                کیلوبایت
              </p>
            </div>
            <button
              type="button"
              aria-label="حذف فایل"
              onClick={clearFile}
              className="flex size-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-800 hover:text-red-400"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              selectFile(event.dataTransfer.files[0]);
            }}
            className="flex w-full flex-col items-center rounded-xl border border-dashed border-slate-700 bg-slate-900/70 px-4 py-5 text-center transition-colors hover:border-emerald-500 hover:bg-emerald-500/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            <span className="mb-2 flex size-10 items-center justify-center rounded-full bg-slate-800 text-emerald-400 shadow-sm">
              <UploadCloud className="size-5" />
            </span>
            <span className="text-xs font-semibold text-slate-200">انتخاب یا رها کردن فایل</span>
            <span className="mt-1 text-[10px] text-slate-500" dir="ltr">
              JSON, GeoJSON, KML, KMZ
            </span>
          </button>
        )}
        {fileError && (
          <p role="alert" className="text-[11px] leading-5 text-red-400">
            {fileError}
          </p>
        )}
      </div>

      {isSuccess && (
        <div
          role="status"
          className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-400"
        >
          <CheckCircle2 className="size-4 shrink-0" />
          فایل با موفقیت ارسال شد.
        </div>
      )}

      {isError && (
        <p role="alert" className="mt-4 text-[11px] leading-5 text-red-400">
          ارسال فرم انجام نشد. اتصال به سرویس آپلود را بررسی کنید.
        </p>
      )}

      {previewError && (
        <p role="alert" className="mt-4 text-[11px] leading-5 text-amber-400">
          {previewError}
        </p>
      )}

      {validationError && (
        <p role="alert" className="mt-4 text-[11px] leading-5 text-red-400">
          {validationError}
        </p>
      )}

      <Button
        type="submit"
        disabled={isLoading || isPreviewing}
        className="mt-4 h-10 w-full bg-emerald-500 text-white hover:bg-emerald-400"
      >
        {isLoading || isPreviewing ? "در حال بارگذاری..." : "شروع بررسی توپولوژی"}
      </Button>
    </form>
  );
}
