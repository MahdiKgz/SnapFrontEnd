export interface SpatialImage {
  id: string;
  name: string;
  size: number;
  status: "uploading" | "processing" | "ready" | "failed" | "deleting";
  errorCode: string | null;
  canComplete: boolean;
  canDelete: boolean;
}

export interface SpatialImageList {
  images: SpatialImage[];
  limit: number;
  maxBytes: number;
}

export interface SpatialImageTicket {
  id: string;
  url: string;
  fields: Record<string, string>;
}

export function uploadSpatialImage(
  file: File,
  ticket: SpatialImageTicket,
  signal: AbortSignal,
  onProgress: (percent: number) => void,
) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(signal.reason);
    const data = new FormData();
    for (const [name, value] of Object.entries(ticket.fields)) data.append(name, value);
    data.append("file", file);

    const xhr = new XMLHttpRequest();
    const abort = () => xhr.abort();
    signal.addEventListener("abort", abort, { once: true });
    xhr.addEventListener("loadend", () => signal.removeEventListener("abort", abort), {
      once: true,
    });
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable)
        onProgress(Math.min(100, Math.round((100 * event.loaded) / event.total)));
    };
    const fail = () => reject(new Error("بارگذاری در فضای ذخیره‌سازی کامل نشد."));
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : fail());
    xhr.onerror = fail;
    xhr.onabort = () => reject(signal.reason);
    xhr.open("POST", ticket.url);
    xhr.send(data);
  });
}
