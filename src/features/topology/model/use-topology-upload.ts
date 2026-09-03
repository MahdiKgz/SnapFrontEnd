import { useRef, useState } from "react";
import type { FormEvent } from "react";

import { useUploadTopologyMutation } from "../api/topology-api";
import { storeTopologyJobId } from "./topology-job-storage";
import type { TopologyUploadData } from "./types";

const ACCEPTED_EXTENSIONS = ["json", "geojson", "kml", "kmz"];

interface UseTopologyUploadOptions {
  clearPreviewError: () => void;
  onAnalysisComplete: (data: TopologyUploadData) => void;
  onAnalysisReset: () => void;
  previewFile: (file: File) => Promise<void>;
  removePreview: () => void;
}

export function useTopologyUpload({
  clearPreviewError,
  onAnalysisComplete,
  onAnalysisReset,
  previewFile,
  removePreview,
}: UseTopologyUploadOptions) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTopology, { isError, isLoading, reset }] = useUploadTopologyMutation();
  const [name, setName] = useState("");
  const [tolerance, setTolerance] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");
  const [validationError, setValidationError] = useState("");

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

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !ACCEPTED_EXTENSIONS.includes(extension)) {
      setSelectedFile(null);
      setFileError("فرمت فایل باید JSON، GeoJSON، KML یا KMZ باشد.");
      return;
    }

    setFileError("");
    setSelectedFile(file);
    clearPreviewError();
    reset();
  };

  const clearFile = () => {
    setSelectedFile(null);
    resetFeedback();
    removePreview();
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const resetAnalysis = () => {
    setName("");
    setTolerance("");
    setSelectedFile(null);
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

    const formData = new FormData();
    formData.append("name", trimmedName);
    formData.append("tolerance", tolerance);
    formData.append("file", selectedFile, selectedFile.name);

    resetFeedback();

    try {
      const [response] = await Promise.all([
        uploadTopology(formData).unwrap(),
        previewFile(selectedFile),
      ]);
      storeTopologyJobId(response.data.jobId);
      onAnalysisComplete(response.data);
    } catch {
      // RTK Query exposes the request error through the mutation state.
    }
  };

  return {
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
