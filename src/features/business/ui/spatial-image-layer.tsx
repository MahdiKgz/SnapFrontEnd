import { type RefObject, useEffect, useState } from "react";

import maplibregl, { type Map } from "maplibre-gl";
import { FetchSource, PMTiles, Protocol, type Source } from "pmtiles";

import { useLazyGetSpatialImagePreviewQuery } from "../api/business-api";

let protocol: Protocol | undefined;
const getProtocol = () => {
  if (!protocol) {
    protocol = new Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);
  }
  return protocol;
};

interface Props {
  id: string;
  mapRef: RefObject<Map | null>;
  isMapReady: boolean;
}

export function SpatialImageLayer({ id, mapRef, isMapReady }: Props) {
  const [preview] = useLazyGetSpatialImagePreviewQuery();
  const [error, setError] = useState(false);

  useEffect(() => {
    const map = mapRef.current;
    if (!isMapReady || !map) return;

    const key = `company-image/${id}`;
    const layerId = `spatial-image-${id}`;
    const controller = new AbortController();
    const { signal } = controller;
    let signed: { source: FetchSource; expiresAt: number } | undefined;
    let signing: Promise<NonNullable<typeof signed>> | undefined;
    const source: Source = {
      getKey: () => key,
      async getBytes(offset, length, tileSignal, etag) {
        signal.throwIfAborted();
        if (!signed || signed.expiresAt <= Date.now() + 30_000) {
          if (!signing) {
            // RTK Query may share this request with a remounted layer.
            signing = preview(id)
              .unwrap()
              .then(({ data }) => {
                signed = {
                  source: new FetchSource(data.url),
                  expiresAt: Date.parse(data.expiresAt),
                };
                return signed;
              })
              .finally(() => {
                signing = undefined;
              });
          }
          signed = await signing;
        }
        return signed.source.getBytes(
          offset,
          length,
          tileSignal ? AbortSignal.any([signal, tileSignal]) : signal,
          etag,
        );
      },
    };
    const archive = new PMTiles(source);
    const registered = getProtocol();
    const onMapError = (event: { sourceId?: string }) => {
      if (event.sourceId === layerId && !signal.aborted) setError(true);
    };

    const show = async () => {
      const { minLon, minLat, maxLon, maxLat, minZoom, maxZoom } = await archive.getHeader();
      if (signal.aborted || mapRef.current !== map) return;
      const bounds: [number, number, number, number] = [minLon, minLat, maxLon, maxLat];
      if (minLon >= maxLon || minLat >= maxLat) throw new Error("Invalid image bounds");

      registered.add(archive);
      map.on("error", onMapError);
      map.addSource(layerId, {
        type: "raster",
        tiles: [`pmtiles://${key}/{z}/{x}/{y}`],
        bounds,
        tileSize: 256,
        minzoom: minZoom,
        maxzoom: maxZoom,
      });
      const above = map
        .getStyle()
        .layers.find(
          ({ id: candidate }) =>
            candidate !== "osm-tiles-layer" &&
            !candidate.startsWith("openfreemap-basemap-") &&
            !candidate.startsWith("spatial-image-"),
        );
      map.addLayer({ id: layerId, type: "raster", source: layerId }, above?.id);
      map.fitBounds(bounds, { padding: 64, maxZoom, duration: 500 });
    };

    void show().catch(() => {
      if (!signal.aborted) setError(true);
    });
    return () => {
      controller.abort();
      if (mapRef.current === map) {
        map.off("error", onMapError);
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(layerId)) map.removeSource(layerId);
      }
      registered.tiles.delete(key);
    };
  }, [id, isMapReady, mapRef, preview]);

  return error ? (
    <p role="alert" className="text-xs text-destructive">
      بارگیری تصویر روی نقشه انجام نشد. دوباره نمایش را فعال کنید.
    </p>
  ) : null;
}
