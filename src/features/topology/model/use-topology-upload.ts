import { useRef, useState } from "react";
import type { FormEvent } from "react";

import { useUploadTopologyMutation } from "../api/topology-api";
import { storeTopologyJobId } from "./topology-job-storage";
import type { TopologyUploadData } from "./types";

const ACCEPTED_EXTENSIONS = ["json", "geojson", "kml", "kmz", "shp", "zip", "dwg", "dgn"];

interface UseTopologyUploadOptions {
  clearPreviewError: () => void;
  onAnalysisComplete: (data: TopologyUploadData) => void;
  onAnalysisReset: () => void;
  removePreview: () => void;
}

export function useTopologyUpload({
  clearPreviewError,
  onAnalysisComplete,
  onAnalysisReset,
  removePreview,
}: UseTopologyUploadOptions) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTopology, { isError, isLoading, reset, error }] = useUploadTopologyMutation();
  const [name, setName] = useState("");
  const [sourceCrs, setSourceCrs] = useState("");
  const [tolerance, setTolerance] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [validationError, setValidationError] = useState("");

  const isCad = !!selectedFile && /\.(dwg|dgn)$/i.test(selectedFile.name);
  const errorCode =
    error && "data" in error && error.data && typeof error.data === "object" && "code" in error.data
      ? String(error.data.code)
      : "";
  const uploadError =
    (
      {
        INVALID_SOURCE_CRS: "سیستم مختصات فایل را با یک کد EPSG معتبر مشخص کنید.",
        CAD_RUNTIME_UNAVAILABLE: "مبدل CAD روی سرور آماده نیست. با پشتیبانی تماس بگیرید.",
        DGN_V8_UNAVAILABLE:
          "نسخهٔ ۸ فایل DGN به مبدل تکمیلی سرور نیاز دارد. فعلاً از خروجی DGN نسخهٔ ۷ استفاده کنید.",
        INVALID_CAD_FILE: "فایل CAD قابل تبدیل نیست؛ نسخه و محتوای فایل را بررسی کنید.",
        CAD_INVALID_COORDINATES: "تبدیل مختصات انجام نشد. سیستم مختصات انتخاب‌شده را بررسی کنید.",
        CAD_NO_GEOMETRY: "عارضهٔ قابل پردازشی در فایل CAD پیدا نشد.",
        CAD_OUTPUT_TOO_LARGE:
          "حجم یا تعداد عارضه‌های فایل پس از تبدیل بیش از حد مجاز است. فایل را به بخش‌های کوچک‌تر تقسیم کنید.",
        CAD_CONVERSION_TIMEOUT: "تبدیل فایل بیش از حد طول کشید. فایل کوچک‌تری انتخاب کنید.",
        CAD_CONVERSION_WARNING:
          "بخشی از فایل CAD با اطمینان قابل خواندن نیست. برای جلوگیری از نتیجهٔ ناقص، فایل پذیرفته نشد.",
        CAD_CONVERTER_BUSY: "مبدل سرور مشغول است. کمی بعد دوباره تلاش کنید.",
        FILE_TOO_LARGE: "حداکثر حجم فایل آپلودی ۵ مگابایت است.",
      } as Record<string, string>
    )[errorCode] ?? "ارسال یا بررسی فایل انجام نشد. فایل و اتصال به سرویس آپلود را بررسی کنید.";

  const changeSourceCrs = (value: string) => {
    setSourceCrs(value);
    setValidationError("");
    reset();
  };

  const resetFeedback = () => {
    setFileError("");
    setValidationError("");
    clearPreviewError();
    reset();
  };

  const changeName = (value: string) => {
    setName(value);
    setValidationError("");
    clearPreviewError();
    reset();
  };

  const changeTolerance = (value: string) => {
    setTolerance(value);
    setValidationError("");
    clearPreviewError();
    reset();
  };

  const selectFile = (file?: File) => {
    if (!file) return;
    setSourceCrs("");

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !ACCEPTED_EXTENSIONS.includes(extension)) {
      setSelectedFile(null);
      setFileError(
        "فرمت فایل باید JSON، GeoJSON، KML، KMZ، SHP، ZIP حاوی Shapefile، DWG یا DGN باشد.",
      );
      return;
    }

    setFileError("");
    setSelectedFile(file);
    clearPreviewError();
    reset();
  };

  const clearFile = () => {
    setSelectedFile(null);
    setSourceCrs("");
    resetFeedback();
    removePreview();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const resetAnalysis = () => {
    setName("");
    setTolerance("");
    setSelectedFile(null);
    setSourceCrs("");
    resetFeedback();
    removePreview();
    onAnalysisReset();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 150) {
      setValidationError("نام فایل باید بین ۲ تا ۱۵۰ نویسه باشد.");
      return;
    }

    if (!selectedFile) {
      setFileError("لطفاً فایل داده مکانی را انتخاب کنید.");
      return;
    }

    const numericTolerance = Number(tolerance);
    if (!Number.isFinite(numericTolerance) || numericTolerance < 1 || numericTolerance > 50) {
      setValidationError("مقدار tolerance باید بین ۱ تا ۵۰ میلی‌متر باشد.");
      return;
    }

    if (isCad && !/^EPSG:[1-9]\d{3,5}$/i.test(sourceCrs.trim())) {
      setValidationError(
        "برای فایل CAD، سیستم مختصات مبدأ را انتخاب کنید یا کد EPSG معتبر وارد کنید.",
      );
      return;
    }

    const formData = new FormData();
    if (isCad) formData.append("sourceCrs", sourceCrs.trim().toUpperCase());
    formData.append("name", trimmedName);
    formData.append("tolerance", tolerance);
    formData.append("file", selectedFile, selectedFile.name);

    resetFeedback();

    try {
      const response = await uploadTopology(formData).unwrap();
      storeTopologyJobId(response.data.jobId);
      onAnalysisComplete(response.data);
    } catch {
      // RTK Query exposes the request error through the mutation state.
    }
  };

  return {
    changeSourceCrs,
    sourceCrs,
    isCad,
    uploadError,
    changeName,
    changeTolerance,
    clearFile,
    fileError,
    fileInputRef,
    isError,
    isLoading,
    name,
    resetAnalysis,
    selectFile,
    selectedFile,
    submit,
    tolerance,
    validationError,
  };
}
