import { type RefObject, useEffect, useRef, useState } from "react";

import { Eye, EyeOff, LoaderCircle, Trash2, Upload } from "lucide-react";
import type { Map } from "maplibre-gl";

import { Button } from "@shared/ui/button";

import {
  useCompleteSpatialImageMutation,
  useDeleteSpatialImageMutation,
  useGetSpatialImagesQuery,
  useReserveSpatialImageMutation,
} from "../api/business-api";
import { type SpatialImage, uploadSpatialImage } from "../model/spatial-images";
import { businessError, count } from "../model/types";
import { BusinessMessage, ConfirmBusinessAction } from "./business-feedback";
import { SpatialImageLayer } from "./spatial-image-layer";

const statuses: Record<SpatialImage["status"], string> = {
  uploading: "در انتظار ثبت بارگذاری",
  processing: "در حال آماده‌سازی برای نقشه",
  ready: "آمادهٔ نمایش",
  failed: "آماده‌سازی ناموفق",
  deleting: "در حال حذف",
};

const statusText = (image: SpatialImage) =>
  image.errorCode === "INVALID_GEOTIFF"
    ? "فایل TIFF خوانا با اطلاعات مکانی معتبر لازم است."
    : statuses[image.status];

const formatSize = (bytes: number) => {
  const units = [
    { size: 1024 ** 3, label: "گیگابایت" },
    { size: 1024 ** 2, label: "مگابایت" },
    { size: 1024, label: "کیلوبایت" },
  ];
  const { size, label } = units.find(({ size }) => bytes >= size) ?? { size: 1, label: "بایت" };
  return `${(bytes / size).toLocaleString("fa-IR", { maximumFractionDigits: 1 })} ${label}`;
};

export function SpatialImagesPanel({
  mapRef,
  isMapReady,
  visible,
}: {
  mapRef: RefObject<Map | null>;
  isMapReady: boolean;
  visible: boolean;
}) {
  const [shown, setShown] = useState<string[]>([]);
  const list = useGetSpatialImagesQuery(undefined, {
    pollingInterval: visible ? 5000 : shown.length ? 30000 : 0,
  });
  const [reserve] = useReserveSpatialImageMutation();
  const [complete, completion] = useCompleteSpatialImageMutation();
  const [remove, deletion] = useDeleteSpatialImageMutation();
  const [deleteTarget, setDeleteTarget] = useState<SpatialImage>();
  const [error, setError] = useState<string>();
  const [progress, setProgress] = useState<number>();
  const upload = useRef<AbortController>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => () => upload.current?.abort(), []);

  const restricted =
    list.error && "status" in list.error && [401, 403].includes(Number(list.error.status));
  const collection = list.currentData?.data;
  const readyLayers = restricted
    ? []
    : (collection?.images ?? []).filter(
        (image) => image.status === "ready" && shown.includes(image.id),
      );

  const startUpload = async (file: File) => {
    if (!collection || upload.current) return;
    setError(undefined);
    if (!/\.tiff?$/i.test(file.name) || file.size <= 0 || file.size > collection.maxBytes) {
      setError("یک فایل TIFF با حجم حداکثر ۵ گیگابایت انتخاب کنید.");
      return;
    }
    const controller = new AbortController();
    upload.current = controller;
    setProgress(0);
    let imageId: string | undefined;
    let sent = false;
    try {
      const { data } = await reserve({ fileName: file.name, size: file.size }).unwrap();
      imageId = data.id;
      await uploadSpatialImage(file, data, controller.signal, setProgress);
      sent = true;
      await complete(data.id).unwrap();
    } catch (reason) {
      if (imageId && !sent)
        await remove(imageId)
          .unwrap()
          .catch(() => undefined);
      if (!controller.signal.aborted)
        setError(reason instanceof Error ? reason.message : businessError(reason));
    } finally {
      upload.current = null;
      setProgress(undefined);
    }
  };

  const confirmUpload = async (id: string) => {
    setError(undefined);
    try {
      await complete(id).unwrap();
    } catch (reason) {
      setError(businessError(reason));
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setError(undefined);
    try {
      await remove(deleteTarget.id).unwrap();
      setShown((current) => current.filter((id) => id !== deleteTarget.id));
    } catch (reason) {
      setError(businessError(reason));
    } finally {
      setDeleteTarget(undefined);
    }
  };

  if (restricted)
    return <BusinessMessage>تصاویر مکانی در پلن شرکتی فعال در دسترس است.</BusinessMessage>;

  return (
    <div className="space-y-3">
      {list.isLoading && (
        <p role="status" className="text-sm text-muted-foreground">
          در حال دریافت تصاویر…
        </p>
      )}
      {list.isError && (
        <BusinessMessage error>
          دریافت فهرست تصاویر انجام نشد.{" "}
          <button type="button" className="underline" onClick={() => void list.refetch()}>
            تلاش دوباره
          </button>
        </BusinessMessage>
      )}
      {collection && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {count(collection.images.length)} از {count(collection.limit)} تصویر شرکت
            </p>
            <Button
              size="sm"
              disabled={progress !== undefined || collection.images.length >= collection.limit}
              onClick={() => input.current?.click()}
            >
              <Upload className="size-4" />
              بارگذاری تصویر
            </Button>
            <input
              ref={input}
              type="file"
              accept=".tif,.tiff"
              hidden
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void startUpload(file);
              }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            GeoTIFF با حداکثر {formatSize(collection.maxBytes)} برای هر تصویر
          </p>
          {progress !== undefined && (
            <div className="space-y-1">
              <label htmlFor="spatial-image-progress" className="text-xs">
                {progress === 100 ? "در حال ثبت بارگذاری…" : `در حال بارگذاری… ${count(progress)}٪`}
              </label>
              <progress
                id="spatial-image-progress"
                className="block h-2 w-full accent-primary"
                max={100}
                value={progress}
              />
            </div>
          )}
          {error && <BusinessMessage error>{error}</BusinessMessage>}
          {!collection.images.length && (
            <p className="rounded-xl border p-3 text-sm text-muted-foreground">
              هنوز تصویری بارگذاری نشده است.
            </p>
          )}
          <ul className="space-y-2">
            {collection.images.map((image) => {
              const displayed = shown.includes(image.id);
              return (
                <li key={image.id} className="space-y-2 rounded-xl border bg-card p-3">
                  <p className="truncate text-sm font-semibold" title={image.name} dir="auto">
                    {image.name}
                  </p>
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    {image.status === "processing" && (
                      <LoaderCircle className="size-3 animate-spin" />
                    )}
                    {formatSize(image.size)} · {statusText(image)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {image.status === "ready" && (
                      <Button
                        size="sm"
                        variant="outline"
                        aria-pressed={displayed}
                        disabled={!isMapReady}
                        onClick={() =>
                          setShown((current) =>
                            displayed
                              ? current.filter((id) => id !== image.id)
                              : [...current, image.id],
                          )
                        }
                      >
                        {displayed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                        {displayed ? "پنهان‌کردن" : "نمایش روی نقشه"}
                      </Button>
                    )}
                    {image.canComplete && progress === undefined && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={completion.isLoading}
                        onClick={() => void confirmUpload(image.id)}
                      >
                        ثبت فایل بارگذاری‌شده
                      </Button>
                    )}
                    {image.canDelete && (
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={`حذف ${image.name}`}
                        disabled={image.status === "uploading" && progress !== undefined}
                        onClick={() => setDeleteTarget(image)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    )}
                  </div>
                  {readyLayers.some(({ id }) => id === image.id) && (
                    <SpatialImageLayer id={image.id} mapRef={mapRef} isMapReady={isMapReady} />
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}
      {deleteTarget && (
        <ConfirmBusinessAction
          title="حذف تصویر مکانی"
          description={`تصویر «${deleteTarget.name}» از فهرست شرکت حذف شود؟`}
          busy={deletion.isLoading}
          onClose={() => setDeleteTarget(undefined)}
          onConfirm={() => void confirmDelete()}
        />
      )}
    </div>
  );
}
