import type { RefObject } from "react";

import { Popover } from "@base-ui/react/popover";
import { Check, ChevronUp, Globe2, Layers2, LoaderCircle, Map as MapIcon } from "lucide-react";
import type { Map } from "maplibre-gl";

import { useBasemap } from "../model/use-basemap";

export function BasemapPicker({
  mapRef,
  isMapReady,
}: {
  mapRef: RefObject<Map | null>;
  isMapReady: boolean;
}) {
  const { active, loading, error, select } = useBasemap(mapRef, isMapReady);
  return (
    <div className="absolute bottom-10 left-4 z-50 sm:left-6" dir="rtl">
      <Popover.Root>
        <Popover.Trigger
          type="button"
          aria-label="انتخاب نقشهٔ زمینه"
          title="انتخاب نقشهٔ زمینه"
          className="flex h-11 items-center gap-2 rounded-xl border border-border bg-card/95 px-3 text-xs font-medium text-foreground shadow-lg backdrop-blur transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-primary"
        >
          <Layers2 className="size-4 text-primary" />
          <span dir="ltr">{active === "openfreemap" ? "Liberty" : "OSM"}</span>
          {loading ? (
            <LoaderCircle className="size-3.5 animate-spin" />
          ) : (
            <ChevronUp className="size-3.5 text-muted-foreground" />
          )}
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner
            side="top"
            align="end"
            sideOffset={10}
            collisionPadding={12}
            positionMethod="fixed"
            className="z-50"
          >
            <Popover.Popup
              dir="rtl"
              className="w-64 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-border bg-popover p-3 text-popover-foreground shadow-xl"
            >
              <Popover.Title className="px-1 pb-3 text-xs font-semibold">نقشهٔ زمینه</Popover.Title>
              <div className="space-y-1" role="group" aria-label="نقشه‌های زمینه">
                {(
                  [
                    {
                      id: "osm",
                      title: "OpenStreetMap",
                      subtitle: "نقشهٔ باز شهری",
                      icon: MapIcon,
                    },
                    {
                      id: "openfreemap",
                      title: "OpenFreeMap · Liberty",
                      subtitle: "نمای شهری جایگزین · رایگان",
                      icon: Globe2,
                    },
                  ] as const
                ).map(({ id, title, subtitle, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={active === id}
                    disabled={!isMapReady}
                    onClick={() => select(id)}
                    className="flex w-full items-center gap-3 rounded-xl border border-transparent p-3 text-right transition-colors hover:bg-accent aria-pressed:border-primary/25 aria-pressed:bg-primary/10 focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50"
                  >
                    <Icon className="size-5 shrink-0 text-primary" />
                    <span className="flex-1">
                      <span dir="ltr" className="block text-xs font-medium text-right">
                        {title}
                      </span>
                      <span className="mt-1 block text-[10px] text-muted-foreground">
                        {subtitle}
                      </span>
                    </span>
                    {id === "openfreemap" && loading ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : active === id ? (
                      <Check className="size-4 text-primary" />
                    ) : null}
                  </button>
                ))}
              </div>
              {loading && (
                <p role="status" className="px-1 pt-3 text-xs text-muted-foreground">
                  در حال بارگذاری نقشهٔ جایگزین…
                </p>
              )}
              {error && (
                <p role="alert" className="px-1 pt-3 text-xs leading-5 text-destructive">
                  {error}
                </p>
              )}
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
