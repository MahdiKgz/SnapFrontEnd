import { type RefObject, useState } from "react";

import { Tooltip } from "@/components/ui/tooltip";
import { LandPlot, LoaderCircle, RotateCcw, Ruler, SquareDashed, X } from "lucide-react";
import type { Map as MapLibreMap } from "maplibre-gl";

import type { MeasurementTool } from "../model/measurement";
import { DEFAULT_UNITS, formatMeasurement } from "../model/measurement-units";
import { useDistanceLabel } from "../model/use-distance-label";
import { useMapMeasurement } from "../model/use-map-measurement";
import { MeasurementSettings } from "./measurement-settings";

const TOOLS = [
  { id: "distance", label: "اندازه‌گیری طول", icon: Ruler },
  { id: "area", label: "اندازه‌گیری مساحت", icon: LandPlot },
  { id: "perimeter", label: "اندازه‌گیری محیط", icon: SquareDashed },
] satisfies Array<{ id: MeasurementTool; label: string; icon: typeof Ruler }>;

export function MapMeasurementTools({
  mapRef,
  isMapReady,
  onActiveChange,
}: {
  mapRef: RefObject<MapLibreMap | null>;
  isMapReady: boolean;
  onActiveChange: (active: boolean) => void;
}) {
  const { tool, state, changeTool, reset } = useMapMeasurement({
    mapRef,
    isMapReady,
    onActiveChange,
  });
  const [units, setUnits] = useState(DEFAULT_UNITS);
  const formattedResult = state.result ? formatMeasurement(state.result, units) : null;
  useDistanceLabel({
    mapRef,
    points: state.points,
    label: tool === "distance" ? formattedResult : null,
  });
  const instruction =
    tool === "distance"
      ? state.points.length === 1
        ? "حالا نقطه دوم را روی نقشه انتخاب کنید."
        : "دو نقطه روی نقشه انتخاب کنید تا فاصله آن‌ها محاسبه شود."
      : "روی عارضه سطحی موردنظر در نقشه کلیک کنید.";

  return (
    <>
      <aside
        aria-label="ابزارهای اندازه‌گیری"
        className="absolute left-4 top-1/2 z-30 flex -translate-y-1/2 flex-col gap-2 rounded-2xl border border-border bg-card/95 p-2 shadow-xl backdrop-blur sm:left-6"
      >
        <MeasurementSettings units={units} onChange={setUnits} />
        <div className="h-px bg-border" />
        {TOOLS.map(({ id, label, icon: Icon }) => (
          <Tooltip key={id} content={label} side="right">
            <button
              type="button"
              aria-label={label}
              aria-pressed={tool === id}
              disabled={!isMapReady}
              onClick={() => changeTool(tool === id ? null : id)}
              className={`flex size-10 items-center justify-center rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40 ${tool === id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-accent hover:text-foreground"}`}
            >
              <Icon className="size-5" />
            </button>
          </Tooltip>
        ))}
      </aside>
      {tool && (
        <section
          aria-label="نتیجه اندازه‌گیری"
          className="absolute bottom-20 left-4 z-30 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-border bg-card/95 p-4 text-foreground shadow-xl backdrop-blur sm:bottom-auto sm:left-24 sm:top-1/2 sm:w-64 sm:-translate-y-1/2"
        >
          <header className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold">{TOOLS.find((item) => item.id === tool)?.label}</h2>
            <button
              type="button"
              aria-label="بستن اندازه‌گیری"
              onClick={() => changeTool(null)}
              className="rounded-lg p-1 text-muted-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-4" />
            </button>
          </header>
          <div role="status" aria-live="polite" aria-atomic="true">
            {state.isLoading ? (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <LoaderCircle className="size-4 animate-spin" />
                در حال اندازه‌گیری عارضه...
              </p>
            ) : state.error ? (
              <p className="text-xs leading-6 text-amber-700 dark:text-amber-300">{state.error}</p>
            ) : state.result ? (
              <>
                {state.result.name && (
                  <p
                    className="mb-2 truncate text-xs text-muted-foreground"
                    title={state.result.name}
                  >
                    {state.result.name}
                  </p>
                )}
                <p
                  dir="ltr"
                  className="rounded-xl bg-primary/10 px-3 py-3 text-center text-xl font-bold text-foreground [direction:ltr!important]"
                >
                  {formattedResult}
                </p>
                <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
                  {tool === "distance"
                    ? "فاصله مستقیم دو نقطه؛ برای اندازه‌گیری بعدی دوباره روی نقشه کلیک کنید."
                    : tool === "area"
                      ? "مساحت کامل عارضه با کسر حفره‌های داخلی."
                      : "مجموع طول مرزهای بیرونی و داخلی عارضه."}
                </p>
              </>
            ) : (
              <p className="text-xs leading-6 text-muted-foreground">{instruction}</p>
            )}
          </div>
          {tool !== "distance" && !state.result && (
            <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
              مساحت و محیط برای عارضه‌های لایه‌های بارگذاری‌شده محاسبه می‌شود.
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <RotateCcw className="size-3.5" />
            شروع دوباره
          </button>
        </section>
      )}
    </>
  );
}
