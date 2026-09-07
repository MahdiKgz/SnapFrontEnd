# CAD map performance review — 2026-09-07

Baseline: frontend `7c3f9ae`, backend `50bebd4`, both on `main`.
The format/CRS conversion changes are committed separately. The investigation below is the baseline; the implementation follow-up at the end records the subsequently authorized fixes.

## Findings

### 1. Distance calculations can block the UI for seconds

`src/features/feature-inspection/model/feature-details.ts`, `featureDistance`, compares every vertex with every target line and every target vertex, then repeats in the other direction. Turf's point-to-line operation itself traverses line segments. Dense disjoint polygons therefore require roughly quadratic work in vertex counts.

`src/features/feature-inspection/model/use-feature-inspection.ts`, `findNeighbors`, calls that function for every feature in visible sources, without first excluding features outside the 1 km search area. Its timer yields only once per 20 features; it cannot interrupt a single expensive comparison. `src/features/feature-inspection/ui/feature-comparison.tsx` also calculates the distance of the selected pair synchronously inside a memo during rendering.

Measured with the actual exported `featureDistance` in Node v24.12.0 on this workstation, after a small warm-up:

| Vertices per polygon | Synchronous calculation | Zero-delay timer delayed by |
| --- | ---: | ---: |
| 100 | 132 ms | 133 ms |
| 500 | 2,703 ms | 2,715 ms |
| 1,000 | 10,326 ms | 10,334 ms |
| 2,000 | 42,220 ms | 42,222 ms |

Inputs: two disjoint regular polygons centered at (51.4, 35.7) and (51.404, 35.7), each with a 0.001-degree radius and a repeated closing coordinate. Their minimum distance is about 0.1806 km. Timing surrounds only `featureDistance`; input generation precedes it. A `setTimeout(..., 0)` scheduled immediately before the calculation measures event-loop blockage.

These are single-run synthetic CPU measurements, not browser frame-time measurements of the user's session. They demonstrate blocking in the same synchronous application function; exact browser timings vary. Existing normalized DWG data contains features with 3,601 coordinate positions, so this density is relevant to real uploads.

**Priority:** spatially index feature bounds; reject candidates conservatively outside the search radius before exact geometry work; cache geometry preparation; perform exact distance calculations in a cancellable worker. Preserve the existing strict less-than-1-km rule and correct handling of holes, intersecting geometries, mixed geometries and segment interiors. A centroid-distance filter alone is insufficient. Changing `async` syntax or wrapping the calculation in a timer will not remove the blocking work.

### 2. A small DWG produces a very large public report

An existing stored analysis whose affected geometries match the dense normalized DWG files has:

| Item | Measured size/count |
| --- | ---: |
| Original upload | 19,695 bytes |
| Normalized GeoJSON | 1,080,109 bytes |
| Features | 30 |
| Coordinate positions, including ring closure | 25,265 |
| Largest feature | 3,601 positions |
| Dry-run report, compact JSON | 60,423,937 bytes |
| Report issues | 50,561 |
| `EXCESSIVE_COORDINATE_PRECISION` issues | 50,529 |

Most serialized report data is in `issues` (about 40.2 MB) and `checks` (about 19.2 MB); the affected feature collection is about 1.0 MB. Sizes are uncompressed serialized bytes, not measured network transfer sizes. The full stored analysis is about 79.6 MB, but that entire stored object is **not** the public payload.

Backend `src/controllers/upload.controller.ts` returns the complete `report`. `src/controllers/file.controller.ts` also includes it in file details. Consequently the heavy report reaches the frontend both during upload analysis and when loading details. Parsing just the compact report with `JSON.parse` took approximately 300 ms in Node in a single sample; browser allocation, Redux processing and rendering add work beyond that.

Backend CAD conversion uses `OGR_ARC_STEPSIZE = 0.1` degrees in `scripts/cad_convert.py`. Curved CAD geometry can therefore yield thousands of positions per feature. This setting and precision diagnostics help explain why original CAD file size is a poor predictor of response cost. Do not reduce analytical geometry fidelity merely to improve display speed.

**Priority:** return a compact summary and group counts initially; paginate detailed issues; keep verbose check diagnostics server-side or expose them only on demand. Preserve all results in server storage. Separate map geometry/preview loading from diagnostic report loading. For larger datasets, introduce a bounded display representation or vector tiles while retaining exact geometry for analysis and inspection.

The public healing completion result is already summarized by `buildPublicHealResult`; do not confuse its compact SSE/status response with the full dry-run report.

### 3. Inspection tables and redundant loading amplify the problem

- `src/features/feature-inspection/ui/feature-inspection-panel.tsx` creates rows for every vertex with `summary.vertices.map`, with no pagination or virtualization. Opening the accordion mounts the entire table. Row expressions are also evaluated by the parent render even when the accordion is closed; this does not mean closed panels necessarily mount those rows in the DOM.
- `src/widgets/map-workbench/ui/map-workbench.tsx` fetches both original and healed geometry in `Promise.all` before previewing a healed file, even though the original overlay starts hidden. Load original geometry on first explicit request instead.
- `src/features/topology/model/use-healed-review-map.ts` rebuilds the review marker source when selected issue or interactivity changes. The points are a WebGL circle layer, not thousands of HTML markers. Separate immutable marker geometry from selection styling to avoid repeated source work.
- `src/features/topology/model/topology-report.ts` prepares/copies properties for the entire affected feature collection even when deriving an empty or small selection. Index once and retrieve selected features directly.
- Default Redux Toolkit development checks are enabled in `src/app/store/index.ts`; large cached responses can make local development slower still. This was established by code inspection, not independently timed. Disabling checks would not address the production payload or distance-computation problems.

The installed MapLibre implementation returns in-memory GeoJSON directly from `getData()` and passes object data to its worker; it does not perform the sometimes-reported `JSON.stringify` call in `GeoJSONSource.setData`. Do not attribute this incident to that outdated implementation detail.

## Scope and next validation

Feature inspection runs only when measurement is inactive and the right-hand tool panel is closed. Its distance bottleneck explains freezes after selecting/comparing features, but it cannot by itself explain initial result loading while that panel is open. The full report and map source processing need separate browser profiling for that stage.

Recommended implementation order:

1. Compact/paginated diagnostic responses and frontend on-demand details.
2. Spatial candidate filtering and cancellable worker distance calculations.
3. Virtualized/paginated vertex rows and lazy original-geometry loading.
4. Eliminate redundant source rebuilding; then profile whether a display LOD/tile endpoint is needed.

Validation should separately trace upload-result arrival, pan/zoom, single selection, comparison, vertex-table expansion, cancellation and map unmount. Compare development and production builds using the existing dense CAD case and larger synthetic data. Add correctness regression cases for the strict 1 km boundary, holes, crossing/touching polygons, long segments, duplicate IDs and changed sources; ensure optimization never silently drops valid neighbors.

No browser performance trace or end-to-end fix is claimed by this review. Conversion commits remain separate; this document is the investigation deliverable.


## Implementation follow-up — 2026-09-07

Implemented in this task:

- Map upload and file-detail queries request `report=compact`; detailed issues are
  fetched only when expanded, with server pagination and group filtering. Full
  analytical results stay server-side. Stable original issue indices survive the
  compact projection and are used for review links and markers.
- Exact distance uses a cached BVH over vertices and great-circle segment bounds
  in unit-sphere Cartesian space. Queries prune nodes beyond the current best
  distance; neighbor queries start with a 1 km bound. No geometry simplification
  is applied. The same Turf predicates and exact segment distance remain in use.
- Resolution, summaries, neighbor search and two-feature comparison execute in
  dedicated module Workers. Closing/unmounting cancels work by terminating the
  Worker. Source-content changes invalidate selections and pending calculations.
  There is no expensive synchronous fallback on Worker failure.
- Vertex tables render at most 50 rows; selecting later pages preserves the
  original vertex index and coordinate. Original geometry loads on demand.
- Review markers use the already available affected geometry and its original
  feature indices. Changing the selected marker updates paint properties without
  rebuilding source geometry. Affected-feature preparation is cached per immutable
  collection, and empty selections avoid preparing it entirely.

Measured on the same synthetic inputs as the baseline:

| Vertices per polygon | Before | After | Exact returned distance |
| --- | ---: | ---: | ---: |
| 100 | 132 ms | 8 ms | 0.1805993858558697 km |
| 500 | 2,703 ms | 30 ms | 0.1805993858558697 km |
| 1,000 | 10,326 ms | 62 ms | 0.1805993858558697 km |
| 2,000 | 42,220 ms | 85 ms | 0.18059864876297638 km |

Actual stored CAD report: **60,423,937 → 1,041,315 bytes**, with all geometry and
50,561 issue counts preserved. Sixteen compact manual markers are retained; full
issue details are available from `/api/heal/:jobId/issues` in pages of up to 100.

Validation:

- Frontend full suite: 97 tests passed; two subsequent details-UI tests also passed.
- Backend full suite: 238 passed, 11 native opt-in tests skipped. Both builds pass.
- Distance parity regression tests cover deterministic global/local samples,
  date-line crossing, polar and long arcs, repeated/isolated points; existing
  tests cover holes, touching polygons and strict 1 km exclusion.
- Headless Chrome with actual MapLibre and module Worker: a 5,000-vertex pair
  completed in about 604 ms while a 16 ms UI heartbeat ran 29 times (maximum
  observed interval 104 ms, including startup/transfer/render scheduling).
  Both-feature inspection, 50-row pagination, correct vertex 51 marker and map
  unmount passed with no browser page errors. This is a local synthetic browser
  test, not a trace of every CAD upload or a guarantee for every device.
- Full TypeScript checking still reports the same 11 pre-existing unused React
  imports in unrelated files. No new type errors. New computation/worker/detail
  code passes lint with the already broken `import/order` rule disabled; existing
  unrelated lint findings remain. No global checks were disabled in the repository.

Temporary browser harness files were removed. Future server storage indexing or
vector tiles may still be needed for larger datasets; these changes specifically
remove the measured report and synchronous distance bottlenecks without reducing
analysis precision.
