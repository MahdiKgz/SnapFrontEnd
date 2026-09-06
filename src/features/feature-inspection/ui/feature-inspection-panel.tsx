import type { RefObject } from "react";

import { LoaderCircle, X } from "lucide-react";
import type { Map as MapLibreMap } from "maplibre-gl";

import { featureName } from "../model/feature-details";
import { useFeatureInspection } from "../model/use-feature-inspection";
import { FeatureComparison } from "./feature-comparison";
import { InspectionAccordion } from "./inspection-accordion";
import "./inspection-animation.css";

const format = (number: number) => number.toLocaleString("fa-IR", { maximumSignificantDigits: 7 });

export function FeatureInspectionPanel({
  mapRef,
  isMapReady,
}: {
  mapRef: RefObject<MapLibreMap | null>;
  isMapReady: boolean;
}) {
  const {
    inspection,
    inspections,
    focusInspection,
    removeInspection,
    error,
    notice,
    loading,
    selectedVertex,
    selectVertex,
    close,
    isClosing,
  } = useFeatureInspection({
    mapRef,
    isMapReady,
    enabled: true,
  });
  if (!inspection && !error && !loading) return null;
  const summary = inspection?.summary;
  return (
    <section
      aria-label="اطلاعات عارضه"
      dir="rtl"
      data-closing={isClosing}
      inert={isClosing}
      className="feature-inspection-panel absolute bottom-3 left-1/2 z-40 flex max-h-[48dvh] w-[calc(100%-1.5rem)] max-w-[38rem] -translate-x-1/2 flex-col overflow-hidden rounded-2xl border border-border bg-card/95 text-foreground shadow-xl backdrop-blur sm:bottom-4"
    >
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-3 py-2.5">
        <h2 className="min-w-0 truncate text-sm font-bold">
          {inspections.length === 2
            ? "مقایسهٔ دو عارضه"
            : inspection
              ? featureName(inspection.entry)
              : "اطلاعات عارضه"}
        </h2>
        <button
          type="button"
          aria-label="بستن اطلاعات عارضه"
          onClick={close}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" />
        </button>
      </header>
      <div className="min-h-0 overflow-auto overscroll-contain p-3">
        {loading && (
          <p role="status" className="flex items-center gap-2 text-xs">
            <LoaderCircle className="size-4 animate-spin" />
            در حال خواندن اطلاعات عارضه...
          </p>
        )}
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="mb-2 text-xs leading-5 text-amber-700 dark:text-amber-300">
            {notice}
          </p>
        )}
        {inspection && summary && (
          <>
            <div className="grid grid-cols-2 gap-2" aria-label="عارضه‌های انتخاب‌شده">
              {inspections.map((item) => (
                <div
                  key={item.key}
                  className={`flex min-w-0 items-center gap-1 rounded-xl border p-1 ${item.key === inspection.key ? "border-primary/50 bg-primary/5" : "border-border"}`}
                >
                  <button
                    type="button"
                    aria-pressed={item.key === inspection.key}
                    aria-label={`جزئیات عارضه ${(item.slot + 1).toLocaleString("fa-IR")}: ${featureName(item.entry)}`}
                    onClick={() => focusInspection(item.key)}
                    title={featureName(item.entry)}
                    className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-xs focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span
                      className={`flex size-5 shrink-0 items-center justify-center rounded-full text-white ${item.slot === 0 ? "bg-orange-500" : "bg-sky-500"}`}
                    >
                      {(item.slot + 1).toLocaleString("fa-IR")}
                    </span>
                    <span className="truncate">{featureName(item.entry)}</span>
                  </button>
                  <button
                    type="button"
                    aria-label={`حذف انتخاب ${featureName(item.entry)}`}
                    onClick={() => removeInspection(item.key)}
                    className="shrink-0 rounded-lg p-1 text-muted-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
              {inspections.length === 1 && (
                <p className="flex items-center rounded-xl border border-dashed border-border px-3 py-2 text-[11px] leading-5 text-muted-foreground">
                  برای مقایسه، روی عارضهٔ دوم کلیک کنید.
                </p>
              )}
            </div>
            {inspections.length === 2 ? (
              <FeatureComparison first={inspections[0]} second={inspections[1]} />
            ) : (
              <dl className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-muted/50 p-3 text-center text-xs">
                <div>
                  <dt className="text-[11px] text-muted-foreground">رأس‌ها</dt>
                  <dd
                    className="mt-1.5 font-semibold"
                    title="رأس پایانیِ تکراری حلقه شمرده نمی‌شود"
                  >
                    {format(summary.vertices.length)}{" "}
                    <span className="text-[10px] font-normal text-muted-foreground">
                      {inspection.entry.feature.geometry?.type}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] text-muted-foreground">مساحت</dt>
                  <dd className="mt-1.5 font-semibold">
                    <bdi dir="ltr">
                      {summary.squareMeters == null ? "—" : `${format(summary.squareMeters)} m²`}
                    </bdi>
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] text-muted-foreground">
                    {summary.perimeterKm == null ? "طول" : "محیط"}
                  </dt>
                  <dd className="mt-1.5 font-semibold">
                    <bdi dir="ltr">
                      {summary.lengthKm == null
                        ? "—"
                        : `${format(summary.perimeterKm ?? summary.lengthKm)} km`}
                    </bdi>
                  </dd>
                </div>
              </dl>
            )}
            {inspections.length === 2 && (
              <p className="mt-3 text-[11px] text-muted-foreground">
                جزئیات {featureName(inspection.entry)}؛ برای تغییر، انتخاب بالای پنل را عوض کنید.
              </p>
            )}
            <div
              role="status"
              className="mt-2 flex items-center justify-between gap-3 px-1 text-[11px]"
            >
              <span
                className="shrink-0 text-muted-foreground"
                title="نزدیک‌ترین بخش هندسه در لایه‌های نمایان؛ فقط فاصله کمتر از ۱ کیلومتر"
              >
                نزدیک‌ترین همسایه
              </span>
              {inspection.loadingNeighbors ? (
                <span>در حال بررسی...</span>
              ) : inspection.neighbors.length ? (
                <span className="flex min-w-0 items-center gap-2">
                  <span className="truncate" title={inspection.neighbors[0].name}>
                    {inspection.neighbors[0].name}
                  </span>
                  <bdi dir="ltr" className="shrink-0 font-semibold">
                    {format(inspection.neighbors[0].distanceKm * 1000)} m
                  </bdi>
                </span>
              ) : (
                <span className="text-muted-foreground">
                  در فاصله کمتر از <bdi dir="ltr">۱ km</bdi> نیست
                </span>
              )}
            </div>
            {inspection.skippedNeighbors > 0 && (
              <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                بررسی بعضی هندسه‌ها ممکن نشد؛ فهرست همسایه‌ها ممکن است کامل نباشد.
              </p>
            )}
            {inspection.neighbors.length > 0 && (
              <InspectionAccordion
                className="mt-2 rounded-xl border border-border"
                title={<> همسایه‌ها ({format(inspection.neighbors.length)}) </>}
              >
                <div className="max-h-36 overflow-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="sticky top-0 bg-card">
                      <tr>
                        <th className="px-3 py-2">عارضه</th>
                        <th className="px-3 py-2">فاصله از مرز</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inspection.neighbors.map((neighbor, index) => (
                        <tr key={index} className="border-t border-border">
                          <td className="px-3 py-2">{neighbor.name}</td>
                          <td className="px-3 py-2">
                            <bdi dir="ltr">{format(neighbor.distanceKm * 1000)} m</bdi>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </InspectionAccordion>
            )}
            <InspectionAccordion
              key={`${inspection.entry.source}:${inspection.entry.index}`}
              className="group mt-2 rounded-xl border border-border"
              title={<> مختصات رأس‌ها ({format(summary.vertices.length)}) </>}
            >
              <p className="px-3 pb-2 text-[11px] text-muted-foreground">
                با انتخاب ردیف، رأس روی نقشه مشخص می‌شود.
              </p>
              <div className="max-h-52 overflow-auto overscroll-contain">
                <table className="w-full min-w-[26rem] text-right text-xs">
                  <thead className="sticky top-0 z-10 bg-card">
                    <tr>
                      <th className="px-3 py-2">رأس</th>
                      <th className="px-3 py-2">مسیر</th>
                      <th className="px-3 py-2">طول جغرافیایی</th>
                      <th className="px-3 py-2">عرض جغرافیایی</th>
                      <th className="px-3 py-2">ارتفاع (Z)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.vertices.map((vertex, index) => (
                      <tr
                        key={vertex.path}
                        aria-selected={selectedVertex === index}
                        onClick={() => selectVertex(vertex, index)}
                        className={`cursor-pointer border-t border-border hover:bg-accent ${selectedVertex === index ? "bg-orange-500/15" : ""}`}
                      >
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            aria-label={`نمایش رأس ${index + 1}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              selectVertex(vertex, index);
                            }}
                            className="rounded px-2 py-1 font-semibold text-primary focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            {format(index + 1)}
                          </button>
                        </td>
                        <td className="px-3 py-2">
                          <bdi dir="ltr">{vertex.path}</bdi>
                        </td>
                        {[0, 1, 2].map((axis) => (
                          <td key={axis} className="px-3 py-2 font-mono">
                            <bdi dir="ltr">{vertex.coordinate[axis] ?? "—"}</bdi>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </InspectionAccordion>
            {Object.keys(inspection.entry.feature.properties ?? {}).length > 0 && (
              <InspectionAccordion
                className="mt-2 rounded-xl border border-border"
                title={<> مشخصات عارضه </>}
              >
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <tbody>
                      {Object.entries(inspection.entry.feature.properties ?? {}).map(
                        ([key, value]) => (
                          <tr key={key} className="border-t border-border">
                            <th className="px-3 py-2">{key}</th>
                            <td className="max-w-md break-words px-3 py-2">
                              {typeof value === "object"
                                ? JSON.stringify(value)
                                : String(value ?? "—")}
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </InspectionAccordion>
            )}
          </>
        )}
      </div>
    </section>
  );
}
