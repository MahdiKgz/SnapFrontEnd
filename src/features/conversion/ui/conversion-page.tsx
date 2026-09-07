import { type FormEvent, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ArrowLeftRight,
  Download,
  FileArchive,
  LoaderCircle,
  RefreshCw,
  Upload,
} from "lucide-react";

import {
  useConversionJobStatus,
  useConvertFileMutation,
  useDownloadConversionMutation,
} from "../api/conversion-api";
import {
  type ConversionDownload,
  type ConversionFormat,
  conversionError,
  conversionWarning,
  validateConversion,
} from "../model/types";

export default function ConversionPage() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<ConversionFormat | "">("");
  const [sourceCRS, setSourceCRS] = useState("");
  const [targetCRS, setTargetCRS] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [download, setDownload] = useState<ConversionDownload | null>(null);
  const [convert, converting] = useConvertFileMutation();
  const [fetchDownload, downloading] = useDownloadConversionMutation();
  const status = useConversionJobStatus(jobId);
  const job = status.currentData?.data;
  const pending =
    !!jobId && job?.status !== "completed" && job?.status !== "failed" && !status.error;
  const busy = converting.isLoading || downloading.isLoading || pending;
  const activeRequest = useRef<{ abort: () => void } | null>(null);
  const mounted = useRef(true);
  const resultUrl = useRef<string | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      activeRequest.current?.abort();
      if (resultUrl.current) URL.revokeObjectURL(resultUrl.current);
    };
  }, []);

  const receiveDownload = (value: ConversionDownload) => {
    if (!mounted.current) {
      URL.revokeObjectURL(value.url);
      return;
    }
    if (resultUrl.current) URL.revokeObjectURL(resultUrl.current);
    resultUrl.current = value.url;
    setDownload(value);
    const link = document.createElement("a");
    link.href = value.url;
    link.download = value.filename;
    document.body.append(link);
    link.click();
    link.remove();
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const problem = validateConversion(file, sourceCRS, targetCRS);
    setError(problem);
    if (problem || !file) return;
    if (resultUrl.current) URL.revokeObjectURL(resultUrl.current);
    resultUrl.current = null;
    setDownload(null);
    setJobId(null);
    const body = new FormData();
    body.set("file", file);
    if (format) body.set("targetFormat", format);
    if (sourceCRS.trim()) body.set("sourceCRS", sourceCRS.trim().toUpperCase());
    if (targetCRS.trim()) body.set("targetCRS", targetCRS.trim().toUpperCase());
    const request = convert(body);
    activeRequest.current = request;
    try {
      const result = await request.unwrap();
      if ("kind" in result) receiveDownload(result);
      else if (mounted.current) setJobId(result.data.jobId);
    } catch (failure) {
      if (mounted.current) setError(conversionError(failure));
    }
  };
  const downloadJob = async () => {
    if (!jobId) return;
    setError(null);
    const request = fetchDownload(jobId);
    activeRequest.current = request;
    try {
      receiveDownload(await request.unwrap());
    } catch (failure) {
      if (mounted.current) setError(conversionError(failure));
    }
  };
  const report = download?.report ?? job?.result;

  return (
    <div dir="rtl" className="h-full overflow-y-auto p-5 text-foreground sm:p-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-medium text-primary">ابزارهای مکانی</p>
          <h1 className="flex items-center gap-3 text-xl font-bold">
            <ArrowLeftRight className="size-6 text-primary" />
            تبدیل فرمت و سیستم مختصات
          </h1>
          <p className="text-sm leading-7 text-muted-foreground">
            فایل را بارگذاری کنید، فرمت یا سیستم مختصات مقصد را انتخاب کنید و خروجی را دریافت کنید.
          </p>
        </header>
        <form
          onSubmit={(event) => void submit(event)}
          className="space-y-6 rounded-2xl border border-border bg-card p-5 sm:p-7"
        >
          <fieldset disabled={busy} className="space-y-6 disabled:opacity-70">
            <div className="space-y-3">
              <label
                htmlFor="conversion-file"
                className="flex items-center gap-2 text-sm font-medium"
              >
                <Upload className="size-4 text-primary" />
                فایل ورودی
              </label>
              <input
                id="conversion-file"
                type="file"
                accept=".geojson,.json,.zip,.dxf"
                onChange={(event) => {
                  setFile(event.target.files?.[0] ?? null);
                  setError(null);
                }}
                aria-describedby="conversion-file-help"
                className="w-full rounded-xl border border-dashed border-border bg-background p-4 text-sm file:me-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-primary"
              />
              <p id="conversion-file-help" className="text-xs leading-6 text-muted-foreground">
                GeoJSON، DXF یا یک شیپ‌فایل در قالب ZIP · حداکثر ۲۵۰ مگابایت
              </p>
              <div className="flex gap-2 rounded-xl bg-muted/50 p-3 text-xs leading-6 text-muted-foreground">
                <FileArchive className="mt-1 size-4 shrink-0" />
                <p>
                  فایل ZIP باید شامل فایل‌های هم‌نام SHP، SHX و DBF باشد. فایل PRJ را هم اضافه کنید
                  تا سیستم مختصات مبدأ خودکار تشخیص داده شود.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="conversion-format" className="text-sm font-medium">
                فرمت خروجی
              </label>
              <select
                id="conversion-format"
                value={format}
                onChange={(event) => setFormat(event.target.value as ConversionFormat | "")}
                className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="">حفظ فرمت ورودی</option>
                <option value="geojson">GeoJSON</option>
                <option value="shapefile">Shapefile (ZIP)</option>
                <option value="dxf">DXF</option>
              </select>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="conversion-source-crs" className="text-sm font-medium">
                  سیستم مختصات مبدأ{" "}
                  {/\.dxf$/i.test(file?.name ?? "") && (
                    <span className="text-destructive">(الزامی)</span>
                  )}
                </label>
                <Input
                  id="conversion-source-crs"
                  value={sourceCRS}
                  onChange={(event) => setSourceCRS(event.target.value)}
                  placeholder="EPSG:32639"
                  list="conversion-crs-options"
                  dir="ltr"
                  className="h-11 font-mono text-foreground"
                />
                <p className="text-xs leading-6 text-muted-foreground">
                  برای DXF الزامی است. برای شیپ‌فایل از PRJ و برای GeoJSON از CRS فایل یا WGS84
                  استفاده می‌شود.
                </p>
              </div>
              <div className="space-y-2">
                <label htmlFor="conversion-target-crs" className="text-sm font-medium">
                  سیستم مختصات مقصد (اختیاری)
                </label>
                <Input
                  id="conversion-target-crs"
                  value={targetCRS}
                  onChange={(event) => setTargetCRS(event.target.value)}
                  placeholder="EPSG:4326"
                  list="conversion-crs-options"
                  dir="ltr"
                  className="h-11 font-mono text-foreground"
                />
                <p className="text-xs leading-6 text-muted-foreground">
                  خالی بماند تا سیستم مختصات مبدأ حفظ شود.
                </p>
              </div>
            </div>
            <datalist id="conversion-crs-options">
              <option value="EPSG:4326">WGS84</option>
              <option value="EPSG:3857">Web Mercator</option>
              {[38, 39, 40, 41].map((zone) => (
                <option key={zone} value={`EPSG:326${zone}`}>
                  WGS84 / UTM {zone}N
                </option>
              ))}
            </datalist>
            {(format === "dxf" || (!format && /\.dxf$/i.test(file?.name ?? ""))) && (
              <p className="rounded-xl bg-muted/50 p-3 text-xs leading-6 text-muted-foreground">
                DXF خروجی شامل هندسه‌های ساده است. مشخصات عارضه و استایل CAD منتقل نمی‌شوند؛
                حلقه‌های پلیگون به خطوط بستهٔ جداگانه تبدیل می‌شوند.
              </p>
            )}
            {format === "geojson" &&
              targetCRS.trim() &&
              targetCRS.trim().toUpperCase() !== "EPSG:4326" && (
                <p className="text-xs leading-6 text-muted-foreground">
                  GeoJSON با CRS غیر WGS84 در همهٔ نرم‌افزارها پشتیبانی نمی‌شود؛ برای سازگاری بیشتر
                  EPSG:4326 را انتخاب کنید.
                </p>
              )}
            <Button type="submit" size="lg" disabled={busy} className="w-full sm:w-auto">
              {busy ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <ArrowLeftRight className="size-4" />
              )}
              {busy ? "در حال پردازش…" : "تبدیل و دریافت فایل"}
            </Button>
          </fieldset>
          {error && (
            <p role="alert" className="text-sm leading-7 text-destructive">
              {error}
            </p>
          )}
        </form>
        {pending && (
          <p
            role="status"
            className="rounded-xl border border-border bg-card p-4 text-sm leading-7"
          >
            فایل بزرگ‌تر از ۵ مگابایت است و روی سرور در حال تبدیل است. پس از آماده‌شدن، دکمهٔ دانلود
            نمایش داده می‌شود.
          </p>
        )}
        {status.error && jobId && (
          <div role="alert" className="space-y-3 rounded-xl border border-border bg-card p-4">
            <p className="text-sm">
              دریافت وضعیت انجام نشد. می‌توانید همان درخواست را دوباره بررسی کنید.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                void status.refetch();
              }}
            >
              <RefreshCw />
              بررسی دوباره
            </Button>
          </div>
        )}
        {job?.status === "failed" && (
          <p
            role="alert"
            className="rounded-xl border border-destructive/30 p-4 text-sm text-destructive"
          >
            {conversionError(job.error)}
          </p>
        )}
        {(download || job?.status === "completed") && (
          <section
            className="space-y-4 rounded-2xl border border-primary/20 bg-card p-5"
            aria-label="نتیجهٔ تبدیل"
          >
            <h2 className="font-semibold text-primary">فایل آمادهٔ دانلود است</h2>
            {report && (
              <p className="text-sm leading-7 text-muted-foreground">
                {report.features.toLocaleString("fa-IR")} عارضه ·{" "}
                <bdi dir="ltr" className="font-mono">
                  {report.sourceCRS} → {report.targetCRS}
                </bdi>
              </p>
            )}
            {download ? (
              <a
                href={download.url}
                download={download.filename}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground"
              >
                <Download className="size-4" />
                دریافت دوباره
              </a>
            ) : (
              <Button onClick={() => void downloadJob()} disabled={downloading.isLoading}>
                {downloading.isLoading ? <LoaderCircle className="animate-spin" /> : <Download />}
                دانلود خروجی
              </Button>
            )}
            {!!report?.warnings.length && (
              <ul className="space-y-2 text-xs leading-6 text-muted-foreground">
                {report.warnings.map((warning) => (
                  <li key={warning}>{conversionWarning[warning] ?? warning}</li>
                ))}
              </ul>
            )}
            {jobId && (
              <p className="text-xs text-muted-foreground">
                خروجی پردازش سرور تا ۲۴ ساعت نگهداری می‌شود.
              </p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
