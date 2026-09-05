export const LENGTH_UNITS = {
  km: { label: "کیلومتر", factor: 1 },
  m: { label: "متر", factor: 1000 },
  mi: { label: "مایل", factor: 1 / 1.609344 },
  ft: { label: "فوت", factor: 1000 / 0.3048 },
};

export const AREA_UNITS = {
  "m²": { label: "متر مربع", factor: 1 },
  "km²": { label: "کیلومتر مربع", factor: 1 / 1_000_000 },
  ha: { label: "هکتار", factor: 1 / 10_000 },
  acre: { label: "ایکر", factor: 1 / 4046.8564224 },
};

export interface MeasurementUnits {
  length: keyof typeof LENGTH_UNITS;
  area: keyof typeof AREA_UNITS;
}

export const DEFAULT_UNITS: MeasurementUnits = { length: "km", area: "m²" };

export function formatMeasurement(
  result: { value: number; unit: "km" | "m²" },
  units: MeasurementUnits,
) {
  const unit = result.unit === "km" ? units.length : units.area;
  const factor =
    result.unit === "km" ? LENGTH_UNITS[units.length].factor : AREA_UNITS[units.area].factor;
  const value = (result.value * factor).toLocaleString("fa-IR", { maximumSignificantDigits: 6 });
  return `${value} ${unit}`;
}
