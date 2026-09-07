export type ConversionFormat = "geojson" | "shapefile" | "dxf";
export interface ConversionReport {
  features: number;
  sourceCRS: string;
  targetCRS: string;
  warnings: string[];
}
export interface ConversionDownload {
  kind: "download";
  url: string;
  filename: string;
  report: ConversionReport;
}
export interface ConversionJobResponse {
  success: boolean;
  data: {
    jobId: string;
    status: "queued" | "processing" | "completed" | "failed";
    result?: ConversionReport;
    error?: { code: string; message: string };
  };
}
export const CONVERSION_MAX_BYTES = 250 * 1024 * 1024;
export function validateConversion(
  file: File | null,
  sourceCRS: string,
  targetCRS: string,
): string | null {
  if (!file) return "ابتدا فایل را انتخاب کنید.";
  if (!/\.(geojson|json|zip|dxf)$/i.test(file.name))
    return "فرمت ورودی باید GeoJSON، فایل ZIP شیپ‌فایل یا DXF باشد.";
  if (!file.size || file.size > CONVERSION_MAX_BYTES)
    return "فایل باید غیرخالی و حداکثر ۲۵۰ مگابایت باشد.";
  if (/\.dxf$/i.test(file.name) && !sourceCRS.trim())
    return "برای فایل DXF، سیستم مختصات مبدأ را مشخص کنید.";
  for (const value of [sourceCRS, targetCRS]) {
    if (value.trim() && !/^EPSG:[1-9]\d{3,5}$/i.test(value.trim()))
      return "سیستم مختصات را مانند EPSG:32639 وارد کنید.";
  }
  return null;
}
export const conversionError = (error: unknown): string => {
  const data =
    (error as { data?: { code?: string }; code?: string })?.data ?? (error as { code?: string });
  const messages: Record<string, string> = {
    SOURCE_CRS_REQUIRED:
      "سیستم مختصات مبدأ مشخص نیست؛ کد EPSG را وارد کنید یا فایل PRJ را در ZIP قرار دهید.",
    INVALID_SOURCE_CRS: "سیستم مختصات مبدأ معتبر نیست یا پشتیبانی نمی‌شود.",
    INVALID_TARGET_CRS: "تبدیل به سیستم مختصات مقصد انتخاب‌شده امکان‌پذیر نیست.",
    INVALID_CONVERSION_COORDINATES:
      "مختصات با سیستم انتخاب‌شده سازگار نیست؛ CRS مبدأ را بررسی کنید.",
    INVALID_CONVERSION_FILE:
      "فایل قابل تبدیل نیست. ساختار فایل یا فایل‌های همراه شیپ‌فایل را بررسی کنید.",
    UNSUPPORTED_CONVERSION_FORMAT: "این فرمت در ابزار تبدیل پشتیبانی نمی‌شود.",
    UNSUPPORTED_CONVERSION_GEOMETRY:
      "شیپ‌فایل به یک نوع عارضه نیاز دارد؛ هندسهٔ خالی یا مجموعهٔ هندسه پشتیبانی نمی‌شود.",
    UNSUPPORTED_CONVERSION_ATTRIBUTES:
      "یکی از مشخصات عارضه از محدودیت طول متن یا دقت عددی شیپ‌فایل بیشتر است.",
    CONVERSION_DATA_LOSS: "تبدیل می‌تواند بخشی از داده را از بین ببرد؛ خروجی ناقص تحویل داده نشد.",
    CONVERSION_LIMIT_EXCEEDED: "اندازهٔ فایل، خروجی یا تعداد عارضه‌ها از ظرفیت ابزار بیشتر است.",
    CONVERSION_NO_GEOMETRY: "عارضهٔ قابل تبدیل در فایل پیدا نشد.",
    CONVERSION_QUEUE_UNAVAILABLE: "صف تبدیل موقتاً در دسترس نیست؛ کمی بعد دوباره تلاش کنید.",
    CONVERSION_RUNTIME_UNAVAILABLE: "سرویس تبدیل روی سرور آماده نیست. با مدیر سامانه تماس بگیرید.",
    CONVERSION_TIMEOUT: "زمان پردازش از حد مجاز گذشت؛ از فایل کوچک‌تری استفاده کنید.",
    CONVERTER_BUSY: "سرویس تبدیل مشغول است؛ کمی بعد دوباره تلاش کنید.",
    CONVERSION_EXPIRED: "مهلت دانلود تمام شده؛ فایل را دوباره تبدیل کنید.",
    CONVERSION_NOT_FOUND: "درخواست تبدیل در دسترس نیست؛ فایل را دوباره ارسال کنید.",
  };
  return (
    messages[data?.code ?? ""] ??
    "تبدیل یا دریافت فایل انجام نشد؛ اتصال را بررسی و دوباره تلاش کنید."
  );
};
export const conversionWarning: Record<string, string> = {
  FEATURE_IDS_NOT_RETAINED:
    "شناسهٔ سطح عارضهٔ GeoJSON در این فرمت منتقل نمی‌شود؛ مشخصات عارضه تابع قالب خروجی هستند.",
  DXF_GEOMETRY_ONLY: "خروجی DXF فقط هندسه‌ها را نگه می‌دارد؛ مشخصات و استایل CAD منتقل نمی‌شوند.",
  DXF_POLYGON_RINGS_AS_POLYLINES:
    "مرز بیرونی و حفره‌های پلیگون در DXF به صورت خط بستهٔ جداگانه ذخیره شده‌اند.",
  SHAPEFILE_FIELD_NAMES_SHORTENED:
    "نام برخی ستون‌ها برای محدودیت شیپ‌فایل کوتاه شده؛ نام‌های اصلی در conversion-metadata.json داخل ZIP آمده‌اند.",
  SHAPEFILE_DBF_ATTRIBUTE_TYPES:
    "نوع مشخصات با قالب DBF سازگار شده؛ متن‌های تو‌در‌تو به متن JSON تبدیل می‌شوند و دقت اعداد تابع DBF است.",
  PROJECTED_GEOJSON_LEGACY_CRS:
    "این GeoJSON دارای CRS غیر WGS84 است و از فیلد CRS قدیمی استفاده می‌کند؛ همهٔ نرم‌افزارها آن را پشتیبانی نمی‌کنند.",
};
