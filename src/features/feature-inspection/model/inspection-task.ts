import type { Feature, Position } from "geojson";

import {
  featureDistance,
  featureName,
  featureSummary,
  isNeighborDistance,
  resolveFeature,
} from "./feature-details";
import type { FeatureEntry, Neighbor } from "./feature-details";

export type InspectionTask =
  | {
      type: "resolve";
      features: Feature[];
      hit: { id?: string | number; properties?: Record<string, unknown> | null };
      point: Position;
      tolerance: number;
    }
  | { type: "summary"; feature: Feature }
  | { type: "distance"; first: Feature; second: Feature }
  | {
      type: "neighbors";
      entry: FeatureEntry;
      datasets: Array<{ source: string; features: Feature[] }>;
    };
export function runInspectionTask(task: InspectionTask) {
  if (task.type === "resolve")
    return resolveFeature(task.features, task.hit, task.point, task.tolerance);
  if (task.type === "summary") return featureSummary(task.feature);
  if (task.type === "distance") return featureDistance(task.first, task.second);
  const neighbors: Neighbor[] = [];
  let skippedNeighbors = 0;
  for (const { source, features } of task.datasets)
    features.forEach((feature, index) => {
      if (source === task.entry.source && index === task.entry.index) return;
      try {
        const distanceKm = featureDistance(task.entry.feature, feature, 1);
        if (isNeighborDistance(distanceKm))
          neighbors.push({ name: featureName({ source, index, feature }), distanceKm });
      } catch {
        skippedNeighbors++;
      }
    });
  neighbors.sort((a, b) => a.distanceKm - b.distanceKm);
  return { neighbors, skippedNeighbors };
}
