import { distance } from "@turf/distance";
import { pointToLineDistance } from "@turf/point-to-line-distance";
import type { Position } from "geojson";

// A static BVH in unit-sphere Cartesian space. Bounds enclose entire minor great-circle
// arcs, including arcs crossing the date line or passing close to a pole.
type Vec = [number, number, number];
type Box = { min: Vec; max: Vec };
type Leaf = Box & { point: Position; end?: Position };
type Node = Box & { left?: Node; right?: Node; leaves?: Leaf[] };
const R = 6371.0088;
const vector = (p: Position): Vec => {
  const lon = (p[0] * Math.PI) / 180,
    lat = (p[1] * Math.PI) / 180;
  return [Math.cos(lat) * Math.cos(lon), Math.cos(lat) * Math.sin(lon), Math.sin(lat)];
};
function build(leaves: Leaf[]): Node {
  // Incremental bounds avoid spread argument limits on large CAD sources.
  const bounds: Box = {
    min: [Infinity, Infinity, Infinity],
    max: [-Infinity, -Infinity, -Infinity],
  };
  for (const leaf of leaves)
    for (let a = 0; a < 3; a++) {
      bounds.min[a] = Math.min(bounds.min[a], leaf.min[a]);
      bounds.max[a] = Math.max(bounds.max[a], leaf.max[a]);
    }
  if (leaves.length <= 8) return { ...bounds, leaves };
  let axis = 0;
  for (let a = 1; a < 3; a++)
    if (bounds.max[a] - bounds.min[a] > bounds.max[axis] - bounds.min[axis]) axis = a;
  leaves.sort((a, b) => a.min[axis] + a.max[axis] - (b.min[axis] + b.max[axis]));
  const middle = Math.floor(leaves.length / 2);
  return { ...bounds, left: build(leaves.slice(0, middle)), right: build(leaves.slice(middle)) };
}
export function distanceIndex(vertices: Position[], lines: Position[][]): Node {
  const leaves: Leaf[] = vertices.map((point) => ({
    point,
    min: vector(point),
    max: vector(point),
  }));
  for (const line of lines)
    for (let i = 1; i < line.length; i++) {
      const point = line[i - 1],
        end = line[i],
        a = vector(point),
        b = vector(end);
      const midpoint = a.map((v, axis) => v + b[axis]) as Vec;
      const norm = Math.hypot(...midpoint);
      if (norm < 1e-8) {
        leaves.push({ point, end, min: [-1, -1, -1], max: [1, 1, 1] });
        continue;
      }
      const center = midpoint.map((v) => v / norm) as Vec;
      const theta = Math.atan2(
        Math.hypot(a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]),
        a.reduce((sum, v, axis) => sum + v * b[axis], 0),
      );
      const radius = 2 * Math.sin(theta / 4) + 1e-12;
      leaves.push({
        point,
        end,
        min: center.map((v) => v - radius) as Vec,
        max: center.map((v) => v + radius) as Vec,
      });
    }
  return build(leaves);
}
function lowerBound(point: Vec, node: Box) {
  const chord = Math.hypot(...point.map((v, a) => Math.max(node.min[a] - v, 0, v - node.max[a])));
  return 2 * R * Math.asin(Math.min(1, chord / 2));
}
export function nearestIndexed(point: Position, tree: Node, upperBound: number): number {
  const p = vector(point);
  let best = upperBound;
  const visit = (node: Node) => {
    if (lowerBound(p, node) > best + 1e-8) return;
    if (node.leaves) {
      for (const leaf of node.leaves) {
        if (lowerBound(p, leaf) > best + 1e-8) continue;
        best = Math.min(
          best,
          leaf.end
            ? pointToLineDistance(
                point,
                { type: "LineString", coordinates: [leaf.point, leaf.end] },
                { units: "kilometers" },
              )
            : distance(point, leaf.point),
        );
      }
    } else {
      const left = node.left!,
        right = node.right!;
      if (lowerBound(p, left) < lowerBound(p, right)) {
        visit(left);
        visit(right);
      } else {
        visit(right);
        visit(left);
      }
    }
  };
  visit(tree);
  return best;
}
