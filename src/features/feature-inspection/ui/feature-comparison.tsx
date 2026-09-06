import { useMemo } from "react";

import { featureDistance } from "../model/feature-details";
import type { Inspection } from "../model/use-feature-inspection";

const format = (value: number, unit = "") =>
  `${value.toLocaleString("fa-IR", { maximumSignificantDigits: 7 })}${unit ? ` ${unit}` : ""}`;
export function FeatureComparison({ first, second }: { first: Inspection; second: Inspection }) {
  const separation = useMemo(() => {
    try {
      const value = featureDistance(first.entry.feature, second.entry.feature);
      return Number.isFinite(value) ? value : null;
    } catch {
      return null;
    }
  }, [first.entry.feature, second.entry.feature]);
  const rows = [
    {
      label: "نوع",
      values: [first, second].map((item) => item.entry.feature.geometry?.type ?? "—"),
    },
    {
      label: "تعداد رأس",
      values: [first, second].map((item) => format(item.summary.vertices.length)),
    },
    {
      label: "مساحت",
      values: [first, second].map((item) =>
        item.summary.squareMeters == null ? "—" : format(item.summary.squareMeters, "m²"),
      ),
    },
    {
      label: "محیط / طول",
      values: [first, second].map((item) =>
        item.summary.lengthKm == null
          ? "—"
          : format(item.summary.perimeterKm ?? item.summary.lengthKm, "km"),
      ),
    },
  ];
  const areaDifference =
    first.summary.squareMeters != null && second.summary.squareMeters != null
      ? Math.abs(first.summary.squareMeters - second.summary.squareMeters)
      : null;
  return (
    <div className="mt-3 space-y-2">
      <div className="overflow-x-auto rounded-xl border border-border">
        <table aria-label="مقایسه دو عارضه" className="w-full text-right text-xs">
          <thead className="bg-muted/60">
            <tr>
              <th className="px-3 py-2">مشخصه</th>
              {[first, second].map((item) => (
                <th
                  key={item.key}
                  className={`px-3 py-2 text-center ${item.slot === 0 ? "text-orange-700 dark:text-orange-300" : "text-sky-700 dark:text-sky-300"}`}
                >
                  عارضه {(item.slot + 1).toLocaleString("fa-IR")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-border">
                <th className="px-3 py-2 font-normal text-muted-foreground">{row.label}</th>
                {row.values.map((value, index) => (
                  <td
                    key={index === 0 ? first.key : second.key}
                    className="px-2 py-2 text-center font-medium"
                  >
                    <bdi dir="ltr">{value}</bdi>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <dl className="grid grid-cols-2 gap-2 rounded-xl bg-muted/50 p-3 text-xs">
        <div>
          <dt className="text-[11px] text-muted-foreground">کمترین فاصلهٔ دو عارضه</dt>
          <dd className="mt-1.5 font-bold">
            <bdi dir="ltr">
              {separation == null ? "محاسبه نشد" : format(separation * 1000, "m")}
            </bdi>
            {separation === 0 && (
              <span className="ms-2 text-[10px] font-normal text-muted-foreground">
                تماس یا هم‌پوشانی
              </span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] text-muted-foreground">اختلاف مساحت</dt>
          <dd className="mt-1.5 font-bold">
            <bdi dir="ltr">{areaDifference == null ? "—" : format(areaDifference, "m²")}</bdi>
          </dd>
        </div>
      </dl>
    </div>
  );
}
