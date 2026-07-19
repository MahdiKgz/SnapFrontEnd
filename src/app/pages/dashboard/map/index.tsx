import React, { useEffect, useRef } from "react";

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

function MapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      // غیرفعال کردن کنترل بومی برای حذف استایل‌های پیش‌فرض و ناهمخوان
      attributionControl: false,
      style: {
        version: 8,
        sources: {
          "osm-tiles": {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
          },
        },
        layers: [
          {
            id: "osm-tiles-layer",
            type: "raster",
            source: "osm-tiles",
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: [51.389, 35.689],
      zoom: 11,
    });

    map.current.addControl(new maplibregl.NavigationControl(), "top-right");

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  return (
    <div className="w-full h-full relative">
      {/* کانتینر نقشه */}
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

      {/* باکس وضعیت بالای سمت چپ */}
      <div className="absolute top-4 left-4 z-10 rounded-xl border border-border/60 bg-card/90 p-4 shadow-lg backdrop-blur-md max-w-xs">
        <h3 className="text-sm font-bold text-foreground mb-1">میز کار نقشه آنلاین</h3>
        <p className="text-xs text-muted-foreground font-light leading-relaxed">
          محیط تعاملی تحلیل، کنترل کیفیت و رفع خطاهای هندسی بر پایه موتور توپولوژی.
        </p>
      </div>

      {/* اتریبیوشن سفارشی و فوق‌العاده شیک در گوشه پایین سمت راست */}
      <div className="absolute bottom-2 right-2 z-10 px-3 py-1 rounded-md border border-border/40 bg-card/70 backdrop-blur-sm shadow-sm select-none pointer-events-none">
        <p className="text-[10px] font-sans text-muted-foreground/80 tracking-wider">
          Snap<span className="text-primary font-bold">GIS</span> | Powered by MaplibreGL
        </p>
      </div>
    </div>
  );
}

export default MapPage;
