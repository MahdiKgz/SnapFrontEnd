import { type RefObject, useEffect, useRef, useState } from "react";

import type { Map, StyleSpecification } from "maplibre-gl";

export type Basemap = "osm" | "openfreemap";
const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";
const PREFIX = "openfreemap-basemap-";
const OSM_LAYER = "osm-tiles-layer";
const LOAD_ERROR = "نقشهٔ جایگزین بارگذاری نشد؛ نقشهٔ OSM فعال است. دوباره تلاش کنید.";

export function useBasemap(mapRef: RefObject<Map | null>, isMapReady: boolean) {
  const [requested, setRequested] = useState<Basemap>("osm");
  const [active, setActive] = useState<Basemap>("osm");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const styleRef = useRef<StyleSpecification | null>(null);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapReady || requested !== "openfreemap") return;
    const controller = new AbortController();
    const layers: string[] = [];
    const sources: string[] = [];
    let disposed = false;
    let installed = false;
    let resourcesChanged = false;
    const previousStyle = map.getStyle();
    const alive = () => !disposed && !controller.signal.aborted && mapRef.current === map;
    const fail = () => {
      if (disposed || mapRef.current !== map) return;
      controller.abort();
      setError(LOAD_ERROR);
      setRequested("osm");
      setActive("osm");
      setLoading(false);
    };
    const timeout = setTimeout(fail, 20000);
    const onReady = () => {
      if (!alive() || !installed) return;
      clearTimeout(timeout);
      map.setLayoutProperty(OSM_LAYER, "visibility", "none");
      setActive("openfreemap");
      setLoading(false);
      map.off("idle", onReady);
    };
    const onTileError = (event: { sourceId?: string; error?: Error }) => {
      if (
        event.sourceId?.startsWith(PREFIX) ||
        event.error?.message.includes("tiles.openfreemap.org")
      )
        fail();
    };
    map.on("error", onTileError);
    map.on("idle", onReady);

    const load = async () => {
      setLoading(true);
      try {
        let style = styleRef.current;
        if (!style) {
          const response = await fetch(STYLE_URL, { signal: controller.signal });
          if (!response.ok) throw new Error("Basemap style unavailable");
          const data = await response.json();
          if (
            data.version !== 8 ||
            !data.sources ||
            !Array.isArray(data.layers) ||
            !data.layers.length ||
            typeof data.glyphs !== "string" ||
            typeof data.sprite !== "string"
          ) {
            throw new Error("Invalid basemap style");
          }
          style = data as StyleSpecification;
          if (!alive()) return;
          styleRef.current = style;
        }
        if (!alive()) return;
        // Import only the basemap resources. setStyle() would reset the user's overlays.
        resourcesChanged = true;
        map.setGlyphs(style.glyphs);
        map.setSprite(style.sprite as string);
        for (const [id, source] of Object.entries(style.sources)) {
          const sourceId = `${PREFIX}${id}`;
          sources.push(sourceId);
          map.addSource(sourceId, source);
        }
        for (const layer of style.layers) {
          const layerId = `${PREFIX}${layer.id}`;
          layers.push(layerId);
          map.addLayer(
            {
              ...layer,
              id: layerId,
              ...("source" in layer ? { source: `${PREFIX}${layer.source}` } : {}),
            },
            OSM_LAYER,
          );
        }
        installed = true;
      } catch {
        if (alive()) fail();
      }
    };
    void load();

    return () => {
      disposed = true;
      controller.abort();
      clearTimeout(timeout);
      // Parent cleanup invalidates mapRef before map.remove(). Never query that dead map.
      if (mapRef.current !== map) return;
      map.off("idle", onReady);
      map.off("error", onTileError);
      if (map.getLayer(OSM_LAYER)) map.setLayoutProperty(OSM_LAYER, "visibility", "visible");
      for (const id of layers.reverse()) if (map.getLayer(id)) map.removeLayer(id);
      for (const id of sources) if (map.getSource(id)) map.removeSource(id);
      if (resourcesChanged) {
        map.setSprite(typeof previousStyle.sprite === "string" ? previousStyle.sprite : null);
        map.setGlyphs(previousStyle.glyphs);
      }
    };
  }, [isMapReady, mapRef, requested]);

  const select = (value: Basemap) => {
    setError(null);
    setRequested(value);
    if (value === "osm") {
      setActive("osm");
      setLoading(false);
    }
  };
  return { active, loading, error, select };
}
