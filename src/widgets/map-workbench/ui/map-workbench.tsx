import { useEffect, useRef, useState } from "react";

import { MapCanvas, useMapLibreMap } from "@/entities/map";
import { useMapPreview } from "@/features/map-preview";
import {
  TopologyForm,
  type TopologyUploadData,
  useLazyGetHealedOutputQuery,
  useTopologyResultsMap,
} from "@/features/topology";
import { AlertTriangle, LoaderCircle, RefreshCw } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { type MapToolId } from "../model/map-tools";
import { MapToolPanel } from "./map-tool-panel";
import { ToolPlaceholder } from "./tool-placeholder";

export function MapWorkbench() {
  const [searchParams] = useSearchParams();
  const { containerRef, isMapReady, mapRef } = useMapLibreMap();
  const {
    clearPreviewError,
    isPreviewing,
    previewError,
    previewFile,
    previewGeoJson,
    removePreview,
  } = useMapPreview(mapRef, isMapReady);
  const [activeTool, setActiveTool] = useState<MapToolId | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [topologyResult, setTopologyResult] = useState<TopologyUploadData | null>(null);
  const [selectedFeatureIndexes, setSelectedFeatureIndexes] = useState<number[]>([]);
  const [isHealedResultVisible, setIsHealedResultVisible] = useState(false);
  const [healedFileLoadError, setHealedFileLoadError] = useState(false);
  const [healedFileLoadAttempt, setHealedFileLoadAttempt] = useState(0);
  const requestedHealedFileId = useRef<string | null>(null);
  const [loadHealedOutput, healedOutputRequest] = useLazyGetHealedOutputQuery();
  const healedFileId = searchParams.get("healedFile");

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
    if (!healedFileId || !isMapReady || requestedHealedFileId.current === healedFileId) return;

    requestedHealedFileId.current = healedFileId;
    setHealedFileLoadError(false);
    void loadHealedOutput(`/heal/${encodeURIComponent(healedFileId)}/output`)
      .unwrap()
      .then(async (output) => {
        setTopologyResult(null);
        setSelectedFeatureIndexes([]);
        setIsHealedResultVisible(true);
        await previewGeoJson(output);
      })
      .catch(() => {
        setHealedFileLoadError(true);
      });
  }, [healedFileId, healedFileLoadAttempt, isMapReady, loadHealedOutput, previewGeoJson]);

  const retryHealedFile = () => {
    requestedHealedFileId.current = null;
    setHealedFileLoadAttempt((attempt) => attempt + 1);
  };

  const selectTool = (tool: MapToolId) => {
    setActiveTool(tool);
    setIsPanelOpen(true);
  };

  return (
    <div className="relative h-dvh min-h-[32rem] w-full overflow-hidden bg-slate-100" dir="rtl">
      <MapCanvas containerRef={containerRef} />

      {healedFileId && healedOutputRequest.isFetching && (
        <div className="absolute left-1/2 top-5 z-30 flex -translate-x-1/2 items-center gap-2 rounded-xl border border-slate-700/70 bg-slate-950/90 px-4 py-3 text-xs text-slate-100 shadow-xl backdrop-blur">
          <LoaderCircle className="size-4 animate-spin text-emerald-400" />
          در حال نمایش عوارض ترمیم‌شده...
        </div>
      )}

      {healedFileId && healedFileLoadError && !healedOutputRequest.isFetching && (
        <div className="absolute left-1/2 top-5 z-30 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-red-500/30 bg-slate-950/95 px-4 py-3 text-xs text-slate-100 shadow-xl backdrop-blur">
          <AlertTriangle className="size-4 shrink-0 text-red-400" />
          <span>نمایش خروجی ترمیم‌شده ممکن نشد.</span>
          <button
            type="button"
            onClick={retryHealedFile}
            className="flex items-center gap-1 rounded-lg bg-slate-800 px-2.5 py-1.5 font-semibold transition-colors hover:bg-slate-700"
          >
            <RefreshCw className="size-3.5" />
            تلاش دوباره
          </button>
        </div>
      )}

      <MapToolPanel
        activeTool={activeTool}
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        onSelectTool={selectTool}
      >
        <div hidden={activeTool !== "topology"}>
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
            previewFile={previewFile}
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
