import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";

import type { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";
import { AlertTriangle, Eye, EyeOff, LoaderCircle, RefreshCw } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { BasemapPicker } from "@features/basemap";
import { FeatureInspectionPanel } from "@features/feature-inspection";
import { useGetUserFileQuery } from "@features/files";
import { MapMeasurementTools } from "@features/map-measurement";
import { useMapPreview } from "@features/map-preview";
import {
  CadImportNotice,
  ParcelEditor,
  TopologyForm,
  type TopologyUploadData,
  useLazyGetHealedOutputQuery,
  useLazyGetOriginalInputQuery,
  useOriginalGeometryOverlay,
  useReviewIssueFocus,
  useTopologyResultsMap,
} from "@features/topology";

import { MapCanvas, useMapLibreMap } from "@entities/map";

import { type MapToolId } from "../model/map-tools";
import { MapToolPanel } from "./map-tool-panel";
import { PointerCoordinate } from "./pointer-coordinate";
import { ToolPlaceholder } from "./tool-placeholder";

const SpatialImagesPanel = lazy(async () => ({
  default: (await import("@features/business/spatial-images")).SpatialImagesPanel,
}));

interface ReviewTarget {
  jobId: string;
  groupId: string;
  featureIndexes: number[];
}

export function MapWorkbench() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [uploadReview, setUploadReview] = useState<ReviewTarget | null>(null);
  const [confirmedUploadParcels, setConfirmedUploadParcels] = useState<number[]>([]);
  const [reviewNotice, setReviewNotice] = useState<{ jobId: string; error?: boolean } | null>(null);
  const { containerRef, isMapReady, mapRef } = useMapLibreMap();
  const {
    clearPreviewError,
    isPreviewing,
    previewError,
    previewGeoJson,
    removePreview,
    setPreviewMask,
  } = useMapPreview(mapRef, isMapReady);
  const [activeTool, setActiveTool] = useState<MapToolId | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [hasOpenedSpatialImages, setHasOpenedSpatialImages] = useState(false);
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
  const [displayedSavedFileId, setDisplayedSavedFileId] = useState<string | null>(null);
  const requestedHealedFileId = useRef<string | null>(null);
  const [loadHealedOutput, healedOutputRequest] = useLazyGetHealedOutputQuery();
  const [loadOriginalInput, originalRequest] = useLazyGetOriginalInputQuery();
  const [originalError, setOriginalError] = useState(false);
  const healedFileId = searchParams.get("healedFile");
  const requestedIssue = searchParams.get("issue");
  const selectedIssueIndex =
    requestedIssue && /^\d+$/.test(requestedIssue) && Number.isSafeInteger(Number(requestedIssue))
      ? Number(requestedIssue)
      : null;
  const fileDetailRequest = useGetUserFileQuery(healedFileId ?? "", {
    skip: !healedFileId,
  });
  const fileDetail = fileDetailRequest.currentData?.data;
  const savedFileHasOutput =
    fileDetail?.status === "completed" || !!fileDetail?.manualParcelIndexes?.length;
  const savedFileIsReady = fileDetail?.id === healedFileId;
  const savedFileIsLoading =
    fileDetailRequest.isFetching ||
    healedOutputRequest.isFetching ||
    (!savedFileHasOutput && originalRequest.isFetching);
  const reviewIssues = useMemo(
    () => fileDetail?.report?.issues ?? [],
    [fileDetail?.report?.issues],
  );

  const requestedReview = reviewIssues.find(
    (issue, index) =>
      (issue.issueIndex ?? index) === selectedIssueIndex && issue.disposition === "ManualReview",
  );
  const savedGroup =
    searchParams.get("edit") === "1" &&
    requestedReview &&
    fileDetail?.report?.issueGroups?.find(
      (group) => group.check === requestedReview.check && group.code === requestedReview.code,
    );
  const savedReview =
    searchParams.get("edit") === "1" && healedFileId && savedGroup
      ? {
          jobId: healedFileId,
          groupId: savedGroup.groupId,
          featureIndexes: savedGroup.affectedFeatureIndexes,
        }
      : null;
  const review = uploadReview ?? savedReview;
  const editorActive =
    !!review && isMapReady && (uploadReview !== null || displayedSavedFileId === review.jobId);
  const [loadedReviewKey, setLoadedReviewKey] = useState<string>();
  const reviewKey = review ? `${review.jobId}:${review.groupId}` : undefined;
  const editingIndexes =
    editorActive && reviewKey === loadedReviewKey ? review?.featureIndexes : undefined;
  const affected = topologyResult?.report.affectedFeatureCollection;
  const affectedOnMap = useMemo(() => {
    if (!affected || isHealedResultVisible) return null;
    if (!editingIndexes) return affected;
    const indexes = new Set(editingIndexes);
    return {
      ...affected,
      features: affected.features.filter(
        ({ snapgisFeatureIndex, geometry }) =>
          snapgisFeatureIndex === undefined ||
          !indexes.has(snapgisFeatureIndex) ||
          (geometry?.type !== "Polygon" && geometry?.type !== "MultiPolygon"),
      ),
    };
  }, [affected, isHealedResultVisible, editingIndexes]);
  useEffect(() => {
    if (!editorActive && loadedReviewKey) setPreviewMask?.([]);
  }, [editorActive, loadedReviewKey, setPreviewMask]);
  const activeJobId = topologyResult?.jobId ?? healedFileId;
  const activeJob = useRef(activeJobId);
  useEffect(() => {
    activeJob.current = activeJobId;
  }, [activeJobId]);

  useOriginalGeometryOverlay({
    data: originalGeoJson,
    isMapReady,
    mapRef,
    visible: isOriginalVisible,
  });
  useReviewIssueFocus({
    data: fileDetail?.report?.affectedFeatureCollection ?? null,
    isMapReady:
      isMapReady && !editorActive && savedFileIsReady && displayedSavedFileId === healedFileId,
    issues: reviewIssues,
    mapRef,
    selectedIssueIndex,
  });

  useTopologyResultsMap({
    affectedFeatures: affectedOnMap,
    focus: !editorActive,
    isMapReady,
    mapRef,
    selectedFeatureIndexes,
  });

  useEffect(() => {
    const resizeTimer = window.setTimeout(() => mapRef.current?.resize(), 550);
    return () => window.clearTimeout(resizeTimer);
  }, [isPanelOpen, mapRef]);

  useEffect(() => {
    if (
      !healedFileId ||
      !isMapReady ||
      !savedFileIsReady ||
      requestedHealedFileId.current === healedFileId
    )
      return;

    requestedHealedFileId.current = healedFileId;
    setHealedFileLoadError(false);
    setDisplayedSavedFileId(null);
    setOriginalGeoJson(null);
    setIsOriginalVisible(false);
    setIsHealedResultVisible(false);
    setTopologyResult(null);
    setSelectedFeatureIndexes([]);
    let cancelled = false;
    const request = savedFileHasOutput
      ? loadHealedOutput(`/heal/${encodeURIComponent(healedFileId)}/output`)
      : loadOriginalInput(healedFileId);
    void request
      .unwrap()
      .then(async (output) => {
        if (cancelled) return;
        setTopologyResult(null);
        setSelectedFeatureIndexes([]);
        await previewGeoJson(output);
        if (cancelled) return;
        setIsHealedResultVisible(savedFileHasOutput);
        setDisplayedSavedFileId(healedFileId);
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
    savedFileHasOutput,
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

  const closeParcelEditor = () => {
    setLoadedReviewKey(undefined);
    setPreviewMask([]);
    if (uploadReview) {
      setUploadReview(null);
      setIsPanelOpen(true);
    } else {
      const next = new URLSearchParams(searchParams);
      next.delete("edit");
      setSearchParams(next, { replace: true });
    }
  };

  const refreshReviewedPreview = async (target: ReviewTarget, featureIndexes: number[]) => {
    if (activeJob.current !== target.jobId) return;
    if (uploadReview) {
      setConfirmedUploadParcels((current) => Array.from(new Set([...current, ...featureIndexes])));
    }
    closeParcelEditor();
    setReviewNotice({ jobId: target.jobId });
    try {
      const output = await loadHealedOutput(
        `/heal/${encodeURIComponent(target.jobId)}/output`,
      ).unwrap();
      if (activeJob.current !== target.jobId) return;
      await previewGeoJson(output, false);
      setIsHealedResultVisible(true);
    } catch {
      if (activeJob.current === target.jobId) setReviewNotice({ jobId: target.jobId, error: true });
    }
  };

  const selectTool = (tool: MapToolId) => {
    if (tool === "spatial-images") setHasOpenedSpatialImages(true);
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
      {!editorActive && (
        <MapMeasurementTools
          mapRef={mapRef}
          isMapReady={isMapReady}
          onActiveChange={setIsMeasuring}
        />
      )}

      {!editorActive && !isMeasuring && !isPanelOpen && (
        <FeatureInspectionPanel mapRef={mapRef} isMapReady={isMapReady} />
      )}

      {healedFileId && savedFileIsLoading && (
        <div className="absolute left-1/2 top-5 z-30 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-border/70 bg-background/90 px-4 py-3 text-xs text-foreground shadow-xl backdrop-blur">
          <LoaderCircle className="size-4 animate-spin text-emerald-700 dark:text-emerald-400" />
          در حال دریافت عوارض فایل...
        </div>
      )}

      {healedFileId &&
        (healedFileLoadError || fileDetailRequest.isError) &&
        !savedFileIsLoading && (
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

      {healedFileId &&
        savedFileIsReady &&
        !savedFileHasOutput &&
        !savedFileIsLoading &&
        !healedFileLoadError &&
        !fileDetailRequest.isError && (
          <div
            role="status"
            className="absolute right-5 top-5 z-20 max-w-64 rounded-xl border border-border/70 bg-background/90 px-4 py-3 text-xs text-foreground shadow-xl"
          >
            هندسهٔ اصلی فایل؛ ترمیم هنوز تکمیل نشده است.
          </div>
        )}

      {healedFileId && savedFileHasOutput && isHealedResultVisible && !healedFileLoadError && (
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

      {review && !isMapReady && (
        <p
          role="status"
          className="absolute bottom-6 left-1/2 z-30 -translate-x-1/2 rounded-lg border bg-card px-4 py-3 text-xs shadow-lg"
        >
          در حال آماده‌سازی نقشه برای ویرایش…
        </p>
      )}
      {editorActive && review && (
        <ParcelEditor
          key={reviewKey}
          mapRef={mapRef}
          jobId={review.jobId}
          groupId={review.groupId}
          onReady={(indexes) => {
            setLoadedReviewKey(reviewKey);
            setPreviewMask(indexes);
          }}
          onCancel={closeParcelEditor}
          onConfirmed={(indexes) => void refreshReviewedPreview(review, indexes)}
        />
      )}
      {!editorActive && reviewNotice?.jobId === activeJobId && (
        <p
          role="status"
          className="absolute bottom-6 left-1/2 z-30 -translate-x-1/2 rounded-lg border bg-card px-4 py-3 text-xs shadow-lg"
        >
          {reviewNotice.error
            ? "اصلاح در خروجی ثبت شد. به‌روزرسانی پیش‌نمایش نقشه انجام نشد."
            : "اصلاحات تأیید و در خروجی ثبت شدند."}
        </p>
      )}

      <MapToolPanel
        activeTool={activeTool}
        isOpen={isPanelOpen && !editorActive}
        onClose={() => setIsPanelOpen(false)}
        onSelectTool={selectTool}
      >
        <div className="overflow-x-hidden!" hidden={activeTool !== "topology"}>
          <TopologyForm
            clearPreviewError={clearPreviewError}
            isPreviewing={isPreviewing}
            onAnalysisComplete={(result) => {
              setTopologyResult(result);
              setConfirmedUploadParcels([]);
              setReviewNotice(null);
              setSelectedFeatureIndexes([]);
              setIsHealedResultVisible(false);
            }}
            onAnalysisReset={() => {
              setTopologyResult(null);
              setConfirmedUploadParcels([]);
              setReviewNotice(null);
              setSelectedFeatureIndexes([]);
              setIsHealedResultVisible(false);
            }}
            onHealingComplete={async (output) => {
              setSelectedFeatureIndexes([]);
              await previewGeoJson(output);
              setIsHealedResultVisible(true);
            }}
            onReviewGroup={(group) => {
              if (!topologyResult) return;
              setIsMeasuring(false);
              setReviewNotice(null);
              setUploadReview({
                jobId: topologyResult.jobId,
                groupId: group.groupId,
                featureIndexes: group.affectedFeatureIndexes,
              });
            }}
            manualParcelIndexes={confirmedUploadParcels}
            onSelectFeatures={setSelectedFeatureIndexes}
            previewError={previewError}
            removePreview={removePreview}
            result={topologyResult}
          />
        </div>

        {activeTool === "smart-analysis" && <ToolPlaceholder />}
        {hasOpenedSpatialImages && (
          <div hidden={activeTool !== "spatial-images"}>
            <Suspense
              fallback={
                <p role="status" className="text-sm">
                  در حال دریافت تصاویر…
                </p>
              }
            >
              <SpatialImagesPanel
                mapRef={mapRef}
                isMapReady={isMapReady}
                visible={activeTool === "spatial-images" && isPanelOpen && !editorActive}
              />
            </Suspense>
          </div>
        )}
      </MapToolPanel>
    </div>
  );
}
