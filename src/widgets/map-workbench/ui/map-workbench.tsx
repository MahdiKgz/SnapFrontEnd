import { useEffect, useState } from "react";

import { MapCanvas, useMapLibreMap } from "@/entities/map";
import { useMapPreview } from "@/features/map-preview";
import { TopologyForm } from "@/features/topology";

import { type MapToolId } from "../model/map-tools";
import { MapToolPanel } from "./map-tool-panel";
import { ToolPlaceholder } from "./tool-placeholder";

export function MapWorkbench() {
  const { containerRef, mapRef } = useMapLibreMap();
  const { clearPreviewError, isPreviewing, previewError, previewFile, removePreview } =
    useMapPreview(mapRef);
  const [activeTool, setActiveTool] = useState<MapToolId | null>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

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
        <div hidden={activeTool !== "topology"}>
          <TopologyForm
            clearPreviewError={clearPreviewError}
            isPreviewing={isPreviewing}
            previewError={previewError}
            previewFile={previewFile}
            removePreview={removePreview}
          />
        </div>

        {activeTool === "smart-analysis" && <ToolPlaceholder tool="smart-analysis" />}
        {activeTool === "layer-quality" && <ToolPlaceholder tool="layer-quality" />}
      </MapToolPanel>
    </div>
  );
}
