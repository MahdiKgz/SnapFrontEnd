import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { MapCanvas, useMapLibreMap } from "@/entities/map";
import { BasemapPicker } from "@/features/basemap/ui/basemap-picker";
import { FeatureInspectionPanel } from "@/features/feature-inspection/ui/feature-inspection-panel";
import { useGetUserFileQuery } from "@/features/files";
import { MapMeasurementTools } from "@/features/map-measurement/ui/map-measurement-tools";
import { useMapPreview } from "@/features/map-preview";
import {
  TopologyForm,
  type TopologyUploadData,
  useLazyGetHealedOutputQuery,
  useLazyGetOriginalInputQuery,
  useTopologyResultsMap,
} from "@/features/topology";
import {
  useManualReviewMarkers,
  useOriginalGeometryOverlay,
} from "@/features/topology/model/use-healed-review-map";
import { CadImportNotice } from "@/features/topology/ui/cad-import-notice";
import type { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";
import { AlertTriangle, Eye, EyeOff, LoaderCircle, RefreshCw } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { type MapToolId } from "../model/map-tools";
import { MapToolPanel } from "./map-tool-panel";
import { PointerCoordinate } from "./pointer-coordinate";
import { ToolPlaceholder } from "./tool-placeholder";

export function MapWorkbench() {
  const [searchParams] = useSearchParams();
  const { containerRef, isMapReady, mapRef } = useMapLibreMap();
  const { clearPreviewError, isPreviewing, previewError, previewGeoJson, removePreview } =
    useMapPreview(mapRef, isMapReady);
  const [activeTool, setActiveTool] = useState<MapToolId | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [topologyResult, setTopologyResult] = useState<TopologyUploadData | null>(null);
  const [selectedFeatureIndexes, setSelectedFeatureIndexes] = useState<number[]>([]);
  const [isHealedResultVisible, setIsHealedResultVisible] = useState(false);
  const [healedFileLoadError, setHealedFileLoadError] = useState(false);
  const [healedFileLoadAttempt, setHealedFileLoadAttempt] = useState(0);
  const [originalGeoJson, setOriginalGeoJson] = useState<FeatureCollection<
    Geometry,
    GeoJsonProperties
  > | null>(null);
  const [isOriginalVisible, setIsOriginalVisible] = useState(false);
  const [reviewSelection, setReviewSelection] = useState<{ key: string; index: number } | null>(
    null,
  );
  const requestedHealedFileId = useRef<string | null>(null);
  const [loadHealedOutput, healedOutputRequest] = useLazyGetHealedOutputQuery();
  const [loadOriginalInput, originalRequest] = useLazyGetOriginalInputQuery();
  const [originalError, setOriginalError] = useState(false);
  const healedFileId = searchParams.get("healedFile");
  const requestedIssue = searchParams.get("issue");
  const reviewKey = `${healedFileId}:${requestedIssue}`;
  const selectedIssueIndex =
    reviewSelection?.key === reviewKey
      ? reviewSelection.index
      : requestedIssue &&
          /^\d+$/.test(requestedIssue) &&
          Number.isSafeInteger(Number(requestedIssue))
        ? Number(requestedIssue)
        : null;
  const fileDetailRequest = useGetUserFileQuery(healedFileId ?? "", {
    skip: !healedFileId,
  });
  const fileDetail = fileDetailRequest.currentData?.data;
  const savedFileIsHealed = fileDetail?.status === "completed";
  const savedFileIsReady = fileDetail?.id === healedFileId;
  const savedFileIsLoading = fileDetailRequest.isFetching || healedOutputRequest.isFetching ||
    (!savedFileIsHealed && originalRequest.isFetching);
  const reviewIssues = useMemo(
    () => fileDetail?.report?.issues ?? [],
    [fileDetail?.report?.issues],
  );

  const selectReviewIssue = useCallback(
    (issueIndex: number) => {
      setReviewSelection({ key: reviewKey, index: issueIndex });
    },
    [reviewKey],
  );

  useOriginalGeometryOverlay({
    data: originalGeoJson,
    isMapReady,
    mapRef,
    visible: isOriginalVisible,
  });
  useManualReviewMarkers({
    interactive: !isMeasuring,
    data: fileDetail?.report?.affectedFeatureCollection ?? null,
    isMapReady,
    issues: reviewIssues,
    mapRef,
    onSelectIssue: selectReviewIssue,
    selectedIssueIndex,
  });

  useTopologyResultsMap({
    affectedFeatures: isHealedResultVisible
      ? null
      : (topologyResult?.report.affectedFeatureCollection ?? null),
    isMapReady,
    mapRef,
    selectedFeatureIndexes,
  });

  useEffect(() => {
    const resizeTimer = window.setTimeout(() => mapRef.current?.resize(), 550);
    return () => window.clearTimeout(resizeTimer);
  }, [isPanelOpen, mapRef]);

  useEffect(() => {
    if (!healedFileId || !isMapReady || !savedFileIsReady ||
      requestedHealedFileId.current === healedFileId) return;

    requestedHealedFileId.current = healedFileId;
    setHealedFileLoadError(false);
    setOriginalGeoJson(null);
    setIsOriginalVisible(false);
    setIsHealedResultVisible(false);
    setTopologyResult(null);
    setSelectedFeatureIndexes([]);
    let cancelled = false;
    const request = savedFileIsHealed
      ? loadHealedOutput(`/heal/${encodeURIComponent(healedFileId)}/output`)
      : loadOriginalInput(healedFileId);
    void request
      .unwrap()
      .then(async (output) => {
        if (cancelled) return;
        setTopologyResult(null);
        setSelectedFeatureIndexes([]);
        setIsHealedResultVisible(savedFileIsHealed);
        await previewGeoJson(output);
      })
      .catch(() => {
        if (!cancelled) setHealedFileLoadError(true);
      });
    return () => {
      cancelled = true;
      requestedHealedFileId.current = null;
    };
  }, [
    healedFileId,
    healedFileLoadAttempt,
    savedFileIsReady,
    savedFileIsHealed,
    isMapReady,
    loadHealedOutput,
    loadOriginalInput,
    previewGeoJson,
  ]);

  const retryHealedFile = () => {
    if (fileDetailRequest.isError) void fileDetailRequest.refetch();
    requestedHealedFileId.current = null;
    setHealedFileLoadAttempt((attempt) => attempt + 1);
  };

  const selectTool = (tool: MapToolId) => {
    setActiveTool(tool);
    setIsPanelOpen(true);
  };

  return (
    <div className="relative h-dvh min-h-[32rem] w-full overflow-hidden bg-background" dir="rtl">
      <MapCanvas containerRef={containerRef} />
      <BasemapPicker mapRef={mapRef} isMapReady={isMapReady} />
      {!!fileDetail?.report?.cadImport?.warnings.length && (
        <details className="absolute left-14 top-5 z-20 max-h-[40dvh] w-72 max-w-[calc(100vw-7rem)] overflow-auto rounded-xl border border-amber-500/30 bg-card p-3 text-xs text-foreground shadow-lg">
          <summary className="cursor-pointer font-semibold text-amber-700 dark:text-amber-300">
            این نقشه با هشدار CAD وارد شده است
          </summary>
          <CadImportNotice report={fileDetail.report.cadImport} />
        </details>
      )}
      <PointerCoordinate isMapReady={isMapReady} mapRef={mapRef} />
      <MapMeasurementTools
        mapRef={mapRef}
        isMapReady={isMapReady}
        onActiveChange={setIsMeasuring}
      />

      {!isMeasuring && !isPanelOpen && (
        <FeatureInspectionPanel mapRef={mapRef} isMapReady={isMapReady} />
      )}

      {healedFileId && savedFileIsLoading && (
        <div className="absolute left-1/2 top-5 z-30 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-border/70 bg-background/90 px-4 py-3 text-xs text-foreground shadow-xl backdrop-blur">
          <LoaderCircle className="size-4 animate-spin text-emerald-700 dark:text-emerald-400" />
          در حال دریافت عوارض فایل...
        </div>
      )}

      {healedFileId && (healedFileLoadError || fileDetailRequest.isError) && !savedFileIsLoading && (
        <div className="absolute left-1/2 top-5 z-30 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-red-500/30 bg-background/95 px-4 py-3 text-xs text-foreground shadow-xl backdrop-blur">
          <AlertTriangle className="size-4 shrink-0 text-red-700 dark:text-red-400" />
          <span>دریافت اطلاعات یا عوارض فایل ممکن نشد.</span>
          <button
            type="button"
            onClick={retryHealedFile}
            className="flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1.5 font-semibold transition-colors hover:bg-border"
          >
            <RefreshCw className="size-3.5" />
            تلاش دوباره
          </button>
        </div>
      )}

      {healedFileId && savedFileIsReady && !savedFileIsHealed && !savedFileIsLoading &&
        !healedFileLoadError && !fileDetailRequest.isError && (
        <div role="status" className="absolute right-5 top-5 z-20 max-w-64 rounded-xl border border-border/70 bg-background/90 px-4 py-3 text-xs text-foreground shadow-xl">
          هندسهٔ اصلی فایل؛ ترمیم هنوز تکمیل نشده است.
        </div>
      )}

      {healedFileId && savedFileIsHealed && isHealedResultVisible && !healedFileLoadError && (
        <button
          type="button"
          aria-pressed={isOriginalVisible}
          className={`absolute top-5 right-5 z-30 flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-bold shadow-xl backdrop-blur transition-colors ${
            isOriginalVisible
              ? "border-amber-400/50 bg-amber-500/90 text-slate-950"
              : "border-border/70 bg-background/90 text-foreground"
          }`}
          disabled={originalRequest?.isFetching}
          onClick={async () => {
            if (originalGeoJson) {
              setIsOriginalVisible((visible) => !visible);
              return;
            }
            const id = healedFileId;
            setOriginalError(false);
            try {
              const original = await loadOriginalInput(id).unwrap();
              if (requestedHealedFileId.current !== id || !mapRef.current) return;
              setOriginalGeoJson(original);
              setIsOriginalVisible(true);
            } catch {
              if (requestedHealedFileId.current === id) setOriginalError(true);
            }
          }}
        >
          {isOriginalVisible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          {originalRequest?.isFetching
            ? "در حال دریافت…"
            : originalError
              ? "تلاش دوباره برای هندسه اصلی"
              : isOriginalVisible
                ? "پنهان‌کردن هندسه اصلی"
                : "نمایش هندسه اصلی"}
        </button>
      )}

      <MapToolPanel
        activeTool={activeTool}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onSelectTool={selectTool}
      >
        <div className="overflow-x-hidden!" hidden={activeTool !== "topology"}>
          <TopologyForm
            clearPreviewError={clearPreviewError}
            isPreviewing={isPreviewing}
            onAnalysisComplete={(result) => {
              setTopologyResult(result);
              setSelectedFeatureIndexes([]);
              setIsHealedResultVisible(false);
            }}
            onAnalysisReset={() => {
              setTopologyResult(null);
              setSelectedFeatureIndexes([]);
              setIsHealedResultVisible(false);
            }}
            onHealingComplete={async (output) => {
              setSelectedFeatureIndexes([]);
              setIsHealedResultVisible(true);
              await previewGeoJson(output);
            }}
            onSelectFeatures={setSelectedFeatureIndexes}
            previewError={previewError}
            removePreview={removePreview}
            result={topologyResult}
          />
        </div>

        {activeTool === "smart-analysis" && <ToolPlaceholder tool="smart-analysis" />}
        {activeTool === "layer-quality" && <ToolPlaceholder tool="layer-quality" />}
      </MapToolPanel>
    </div>
  );
}
