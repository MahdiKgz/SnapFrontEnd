export type AlignmentAxis = "horizontal" | "vertical";
export type ScreenPoint = [number, number];

export interface AlignmentSpan {
  coordinate: number;
  start: number;
  end: number;
}

const SNAP_DISTANCE = 8;

export function suggestAlignment(
  dx: number,
  dy: number,
  previous: AlignmentAxis | null,
): AlignmentAxis | null {
  const horizontal = Math.abs(dx);
  const vertical = Math.abs(dy);
  if (Math.max(horizontal, vertical) < 5) return null;
  // A wider release angle prevents the guide from flickering near its threshold.
  if (horizontal > 0 && vertical <= horizontal * (previous === "horizontal" ? 0.4 : 0.25)) {
    return "horizontal";
  }
  if (vertical > 0 && horizontal <= vertical * (previous === "vertical" ? 0.4 : 0.25)) {
    return "vertical";
  }
  return null;
}

export interface DragAlignment {
  point: ScreenPoint;
  directionSample: ScreenPoint;
  movement: ScreenPoint;
  axis: AlignmentAxis | null;
}

export function advanceDragAlignment(previous: DragAlignment, point: ScreenPoint): DragAlignment {
  const dx = point[0] - previous.directionSample[0];
  const dy = point[1] - previous.directionSample[1];
  const sampled = Math.max(Math.abs(dx), Math.abs(dy)) >= 5;
  const axis = sampled ? suggestAlignment(dx, dy, previous.axis) : previous.axis;
  return {
    point,
    directionSample: sampled ? point : previous.directionSample,
    movement: [
      previous.movement[0] + (axis === "vertical" ? 0 : point[0] - previous.point[0]),
      previous.movement[1] + (axis === "horizontal" ? 0 : point[1] - previous.point[1]),
    ],
    axis,
  };
}

export function alignmentSpan(
  axis: AlignmentAxis,
  first: ScreenPoint,
  second: ScreenPoint = first,
): AlignmentSpan | null {
  const along = axis === "horizontal" ? 0 : 1;
  const across = along === 0 ? 1 : 0;
  if (
    first !== second &&
    (Math.abs(first[along] - second[along]) > 1 || Math.abs(first[across] - second[across]) < 2)
  ) {
    return null;
  }
  return {
    coordinate: (first[along] + second[along]) / 2,
    start: Math.min(first[across], second[across]),
    end: Math.max(first[across], second[across]),
  };
}

export function snapAlignedMovement(
  distance: number,
  moving: AlignmentSpan[],
  targets: AlignmentSpan[],
  crossMovement = 0,
): { distance: number; target?: AlignmentSpan & { crossCoordinate: number } } {
  let best: (AlignmentSpan & { crossCoordinate: number }) | undefined;
  let bestOffset = distance;
  let bestError = SNAP_DISTANCE;
  for (const source of moving) {
    const proposed = source.coordinate + distance;
    let low = 0;
    let high = targets.length;
    while (low < high) {
      const middle = (low + high) >>> 1;
      if (targets[middle].coordinate < proposed - bestError) low = middle + 1;
      else high = middle;
    }

    for (let index = low; index < targets.length; index++) {
      const target = targets[index];
      if (target.coordinate > proposed + bestError) break;
      const commonStart = Math.max(target.start, source.start + crossMovement);
      const commonEnd = Math.min(target.end, source.end + crossMovement);
      if (commonStart > commonEnd) continue;
      const error = Math.abs(target.coordinate - proposed);
      if (error > bestError || (best && error === bestError)) continue;
      best = { ...target, crossCoordinate: (commonStart + commonEnd) / 2 };
      bestError = error;
      bestOffset = target.coordinate - source.coordinate;
    }
  }
  return { distance: bestOffset, target: best };
}
