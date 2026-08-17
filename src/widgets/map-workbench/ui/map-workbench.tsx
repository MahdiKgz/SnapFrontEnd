import { useEffect, useState } from "react";

import { MapCanvas, useMapLibreMap } from "@/entities/map";
import { useMapPreview } from "@/features/map-preview";
import { TopologyForm, type TopologyUploadData, useTopologyResultsMap } from "@/features/topology";

import { type MapToolId } from "../model/map-tools";
import { MapToolPanel } from "./map-tool-panel";
import { ToolPlaceholder } from "./tool-placeholder";

export function MapWorkbench() {
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

  const selectTool = (tool: MapToolId) => {
    setActiveTool(tool);
    setIsPanelOpen(true);
  };

  return (
    <div className="relative h-dvh min-h-[32rem] w-full overflow-hidden bg-slate-100" dir="rtl">
      <MapCanvas containerRef={containerRef} />

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
