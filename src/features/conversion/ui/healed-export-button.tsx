import { type FormEvent, useEffect, useId, useRef, useState } from "react";

import { Button, buttonVariants } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { MotionDialogBackdrop, MotionDialogPopup } from "@/shared/ui/motion-dialog";
import { CustomSelect } from "@/shared/ui/select";
import { Dialog } from "@base-ui/react/dialog";
import type { FeatureCollection } from "geojson";
import { Download, LoaderCircle, X } from "lucide-react";

import {
  useConversionJobStatus,
  useConvertFileMutation,
  useDownloadConversionMutation,
  useExportHealedMutation,
} from "../api/conversion-api";
import {
  type ConversionDownload,
  type ConversionFormat,
  conversionError,
  conversionWarning,
} from "../model/types";

type ExportSource = { jobId: string } | { filename: string; readDrawing: () => FeatureCollection };
const WGS84 = "EPSG:4326";

function ExportForm({ source }: { source: ExportSource }) {
  const id = useId();
  const healed = "jobId" in source;
  const [format, setFormat] = useState<ConversionFormat>("geojson");
  const [targetCRS, setTargetCRS] = useState(WGS84);
  const [conversionId, setConversionId] = useState<string | null>(null);
  const [download, setDownload] = useState<ConversionDownload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exportFile, exporting] = useExportHealedMutation();
  const [convertFile, converting] = useConvertFileMutation();
  const [fetchDownload, downloading] = useDownloadConversionMutation();
  const status = useConversionJobStatus(conversionId);
  const job = status.currentData?.data;
  const pending =
    !!conversionId && job?.status !== "completed" && job?.status !== "failed" && !status.isError;
  const busy = exporting.isLoading || converting.isLoading || downloading.isLoading || pending;
  const request = useRef<{ abort: () => void } | null>(null);
  const url = useRef<string | null>(null);
  const mounted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      request.current?.abort();
      if (url.current) URL.revokeObjectURL(url.current);
    };
  }, []);
  const receive = (result: ConversionDownload) => {
    if (!mounted.current) {
      URL.revokeObjectURL(result.url);
      return;
    }
    if (url.current) URL.revokeObjectURL(url.current);
    url.current = result.url;
    const filename =
      "filename" in source
        ? `${source.filename}.${result.filename.split(".").at(-1)}`
        : result.filename;
    setDownload({ ...result, filename });
    const link = document.createElement("a");
    link.href = result.url;
    link.download = filename;
    document.body.append(link);
    link.click();
    link.remove();
  };
  const clearResult = () => {
    setConversionId(null);
    setDownload(null);
    setError(null);
    if (url.current) {
      URL.revokeObjectURL(url.current);
      url.current = null;
    }
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const crs = targetCRS.trim().toUpperCase();
    if (!/^EPSG:[1-9]\d{3,5}$/.test(crs)) {
      setError("سیستم مختصات مقصد را مانند EPSG:4326 وارد کنید.");
      return;
    }
    clearResult();
    try {
      let requestResult;
      if ("jobId" in source) {
        requestResult = exportFile({ jobId: source.jobId, targetFormat: format, targetCRS: crs });
      } else {
        const drawing = source.readDrawing();
        const data =
          format === "dxf"
            ? {
                ...drawing,
                features: drawing.features.map((feature) => ({
                  ...feature,
                  properties: {
                    Layer: feature.geometry.type === "Polygon" ? "Parcels" : "Lines",
                    ...feature.properties,
                  },
                })),
              }
            : drawing;
        const file = new Blob([JSON.stringify(data)], { type: "application/geo+json" });
        if (format === "geojson" && crs === WGS84) {
          receive({
            kind: "download",
            url: URL.createObjectURL(file),
            filename: "converted.geojson",
            report: {
              features: drawing.features.length,
              sourceCRS: WGS84,
              targetCRS: crs,
              warnings: [],
            },
          });
          return;
        }
        const body = new FormData();
        body.append("file", file, `${source.filename}.geojson`);
        body.append("sourceCRS", WGS84);
        body.append("targetCRS", crs);
        body.append("targetFormat", format);
        if (format === "shapefile") body.append("splitShapefile", "true");
        requestResult = convertFile(body);
      }
      request.current = requestResult;
      const result = await requestResult.unwrap();
      if ("kind" in result) receive(result);
      else if (mounted.current) setConversionId(result.data.jobId);
    } catch (error) {
      if (mounted.current) setError(conversionError(error));
    }
  };
  const downloadQueued = async () => {
    if (!conversionId) return;
    setError(null);
    const active = fetchDownload(conversionId);
    request.current = active;
    try {
      receive(await active.unwrap());
    } catch (error) {
      if (mounted.current) setError(conversionError(error));
    }
  };
  const report = download?.report ?? job?.result;
  return (
    <form onSubmit={submit} className="space-y-4">
      <fieldset disabled={busy} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor={`format-${id}`} className="text-sm font-medium">
            فرمت فایل خروجی
          </label>
          <CustomSelect
            id={`format-${id}`}
            className="h-10 w-full"
            value={format}
            onValueChange={(value) => {
              clearResult();
              setFormat(value as ConversionFormat);
            }}
            options={[
              { value: "geojson", label: "GeoJSON" },
              { value: "shapefile", label: "Shapefile (ZIP)" },
              { value: "dxf", label: "DXF" },
            ]}
          />
        </div>
        <div className="rounded-lg bg-muted/50 p-3 text-xs leading-6 text-muted-foreground">
          سیستم مختصات مبدأ: <bdi dir="ltr">WGS84 — EPSG:4326</bdi>
          <br />
          مبدأ به‌صورت خودکار مشخص است و نیازی به ورود آن نیست.
        </div>
        <div className="space-y-2">
          <label htmlFor={`crs-${id}`} className="text-sm font-medium">
            سیستم مختصات مقصد
          </label>
          <Input
            id={`crs-${id}`}
            dir="ltr"
            className="font-mono text-foreground"
            value={targetCRS}
            list={`crs-options-${id}`}
            onChange={(event) => {
              clearResult();
              setTargetCRS(event.target.value);
            }}
            required
          />
          <datalist id={`crs-options-${id}`}>
            <option value="EPSG:4326">WGS84</option>
            <option value="EPSG:3857">Web Mercator</option>
            {[38, 39, 40, 41].map((zone) => (
              <option key={zone} value={`EPSG:326${zone}`}>
                UTM {zone}N
              </option>
            ))}
          </datalist>
          <p className="text-xs leading-6 text-muted-foreground">
            برای حفظ مختصات فعلی، <bdi dir="ltr">EPSG:4326</bdi> را نگه دارید. برای خروجی متری
            می‌توانید منطقهٔ UTM مناسب را انتخاب کنید.
          </p>
        </div>
        {format === "dxf" && (
          <p className="rounded-lg bg-muted/50 p-3 text-xs leading-6">
            {healed
              ? "مرز عارضه‌ها به‌صورت پلی‌لاین در لایهٔ اصلی CAD صادر می‌شود. می‌توانید در نرم‌افزار مقصد از خطوط پلیگون بسازید."
              : "قطعه‌ها به‌صورت پلی‌لاین بسته و چندخطی‌ها در لایهٔ جداگانهٔ CAD صادر می‌شوند."}
          </p>
        )}
        {healed && format === "geojson" && (
          <p className="text-xs leading-6 text-muted-foreground">
            مرز پلیگون‌ها و عارضه‌های خطی به‌صورت MultiLineString ذخیره می‌شوند.
          </p>
        )}
        {format === "shapefile" && (
          <p className="text-xs leading-6 text-muted-foreground">
            {healed
              ? "ZIP شامل فایل‌های شیپ‌فایل و PRJ خواهد بود. این فرمت به عارضه‌هایی از یک خانوادهٔ هندسی نیاز دارد."
              : "در ترسیم ترکیبی، قطعه‌ها و چندخطی‌ها به‌صورت دو لایه با فایل‌های PRJ در یک ZIP دریافت می‌شوند."}
          </p>
        )}
        {format === "geojson" && targetCRS.trim().toUpperCase() !== "EPSG:4326" && (
          <p className="text-xs leading-6 text-muted-foreground">
            GeoJSON با مختصات غیر WGS84 در همهٔ نرم‌افزارها پشتیبانی نمی‌شود.
          </p>
        )}
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          {busy ? "در حال آماده‌سازی…" : "ساخت و دانلود خروجی"}
        </Button>
      </fieldset>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {pending && (
        <p role="status" className="text-sm leading-6">
          خروجی روی سرور در حال آماده‌سازی است…
        </p>
      )}
      {status.isError && (
        <p role="alert" className="text-sm">
          دریافت وضعیت انجام نشد.{" "}
          <button
            type="button"
            className="text-primary underline"
            onClick={() => void status.refetch()}
          >
            بررسی دوباره
          </button>
        </p>
      )}
      {job?.status === "failed" && (
        <p role="alert" className="text-sm text-destructive">
          {conversionError(job.error)}
        </p>
      )}
      {job?.status === "completed" && !download && (
        <Button
          type="button"
          className="w-full"
          onClick={() => void downloadQueued()}
          disabled={downloading.isLoading}
        >
          دانلود خروجی آماده
        </Button>
      )}
      {download && (
        <a
          className="block text-sm text-primary underline"
          href={download.url}
          download={download.filename}
        >
          دریافت دوبارهٔ فایل
        </a>
      )}
      {report && (
        <p className="text-xs text-muted-foreground">
          <bdi dir="ltr">
            {report.sourceCRS} → {report.targetCRS}
          </bdi>
        </p>
      )}
      {!!report?.warnings.length && (
        <ul className="space-y-1 text-xs leading-6 text-muted-foreground">
          {report.warnings.map((warning) => (
            <li key={warning}>{conversionWarning[warning] ?? warning}</li>
          ))}
        </ul>
      )}
    </form>
  );
}

function ExportButton({
  source,
  className,
  children,
  disabled,
}: {
  source: ExportSource;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        disabled={disabled}
        className={
          className ??
          "inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        }
      >
        <Download className="size-4" />
        {children}
      </Dialog.Trigger>
      <Dialog.Portal>
        <MotionDialogBackdrop className="fixed inset-0 z-90 bg-black/50 backdrop-blur-sm" />
        <MotionDialogPopup
          dir="rtl"
          className="fixed left-1/2 top-1/2 z-100 max-h-[90dvh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card p-5 text-foreground shadow-2xl"
        >
          <header className="mb-4 flex items-center justify-between gap-2">
            <Dialog.Title className="text-base font-bold">انتخاب خروجی</Dialog.Title>
            <Dialog.Close
              aria-label="بستن انتخاب خروجی"
              className="rounded-lg p-1.5 hover:bg-muted"
            >
              <X className="size-4" />
            </Dialog.Close>
          </header>
          <Dialog.Description className="mb-4 text-xs leading-6 text-muted-foreground">
            فرمت فایل و سیستم مختصات مقصد را انتخاب کنید.
          </Dialog.Description>
          {open && (
            <ExportForm key={"jobId" in source ? source.jobId : source.filename} source={source} />
          )}
        </MotionDialogPopup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function HealedExportButton({
  jobId,
  className,
  children = "دانلود فایل ترمیم‌شده",
}: {
  jobId: string;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <ExportButton source={{ jobId }} className={className}>
      {children}
    </ExportButton>
  );
}

export function DrawingExportButton({
  filename,
  readDrawing,
  disabled,
}: {
  filename: string;
  readDrawing: () => FeatureCollection;
  disabled?: boolean;
}) {
  return (
    <ExportButton
      source={{ filename, readDrawing }}
      disabled={disabled}
      className={buttonVariants({ size: "sm", variant: "outline" })}
    >
      خروجی ترسیم
    </ExportButton>
  );
}
