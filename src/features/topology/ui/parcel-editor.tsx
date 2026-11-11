import { type RefObject, useEffect, useEffectEvent, useRef, useState } from "react";

import { getGeoJsonBounds } from "@/shared/lib/geo";
import { Button } from "@/shared/ui/button";
import type { Feature, FeatureCollection, LineString, Position } from "geojson";
import type { GeoJSONSource, Map as MapLibreMap } from "maplibre-gl";

import {
  useGetParcelReviewGroupQuery,
  useUpdateParcelReviewGroupMutation,
} from "../api/topology-api";
import {
  type AlignmentAxis,
  type AlignmentSpan,
  type DragAlignment,
  type ScreenPoint,
  advanceDragAlignment,
  alignmentSpan,
  snapAlignedMovement,
} from "../model/parcel-alignment";
import {
  type ParcelGeometry,
  closeParcelRings,
  editableRings,
  updateParcelRing,
} from "../model/parcel-vertices";

const SOURCE = "snapgis-parcel-editor";
const FILL = `${SOURCE}-fill`;
const OUTLINE = `${SOURCE}-outline`;
const EDGES = `${SOURCE}-edges`;
const VERTICES = `${SOURCE}-vertices`;
const GUIDE = `${SOURCE}-guide`;
const SNAP = `${SOURCE}-snap`;
const modes = [
  ["parcel", "قطعه"],
  ["edge", "ضلع"],
  ["vertex", "رأس"],
] as const;
type Mode = (typeof modes)[number][0];
const hitLayers = { parcel: FILL, edge: EDGES, vertex: VERTICES };
const priorities = [VERTICES, EDGES, FILL];

const errors: Record<string, string> = {
  INVALID_PARCEL_GEOMETRY: "هندسه معتبر نیست. حلقه‌ها باید بسته و بدون تقاطع باشند.",
  STALE_PARCEL_EDIT: "هندسه تغییر کرده است. کارت را دوباره باز کنید.",
  PARCEL_HEALING_ACTIVE: "پس از پایان ترمیم خودکار می‌توانید گروه را ویرایش کنید.",
  OUTPUT_FILE_EXPIRED: "فایل عارضه‌ها دیگر در دسترس نیست.",
};

function errorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object" && "data" in error) {
    const data = error.data;
    if (data && typeof data === "object" && "code" in data && typeof data.code === "string") {
      const message = errors[data.code];
      if (typeof message === "string") return message;
    }
  }
  return fallback;
}

interface ParcelEditorProps {
  mapRef: RefObject<MapLibreMap | null>;
  jobId: string;
  groupId: string;
  onReady: (outputIndexes: number[]) => void;
  onCancel: () => void;
  onConfirmed: (featureIndexes: number[]) => void;
}

interface Draft {
  featureIndex: number;
  outputIndex?: number;
  revision: string | null;
  type: ParcelGeometry["type"];
  rings: Position[][][];
  dirty: boolean;
}

interface Handle {
  kind: Mode;
  featureIndex: number;
  polygon: number;
  ring: number;
  vertex: number;
}

export function ParcelEditor(props: ParcelEditorProps) {
  const query = useGetParcelReviewGroupQuery({ jobId: props.jobId, groupId: props.groupId });
  const parcels = query.currentData?.data;
  if (parcels?.length && !query.isError) {
    return (
      <ParcelDraft
        {...props}
        initial={parcels.map(({ geometry, featureIndex, revision, outputIndex }) => ({
          type: geometry.type,
          rings: editableRings(geometry),
          featureIndex,
          outputIndex,
          revision,
          dirty: false,
        }))}
      />
    );
  }
  return (
    <EditorPanel>
      <p role={query.isError || parcels ? "alert" : "status"} className="text-sm">
        {query.isError
          ? errorMessage(query.error, "دریافت عارضه‌های کارت انجام نشد.")
          : parcels
            ? "عارضهٔ پلیگونی برای ویرایش پیدا نشد."
            : "در حال دریافت عارضه‌ها…"}
      </p>
      <Button size="sm" variant="outline" onClick={props.onCancel}>
        بستن
      </Button>
    </EditorPanel>
  );
}

function EditorPanel({
  children,
  panelRef,
}: {
  children: React.ReactNode;
  panelRef?: RefObject<HTMLElement | null>;
}) {
  return (
    <section
      ref={panelRef}
      aria-label="اصلاح دستی عارضه‌ها"
      className="absolute bottom-6 left-1/2 z-40 w-[min(27rem,calc(100vw-3rem))] -translate-x-1/2 space-y-3 rounded-xl border bg-card p-4 text-card-foreground shadow-xl"
    >
      {children}
    </section>
  );
}

function ParcelDraft({
  mapRef,
  jobId,
  groupId,
  initial,
  onReady,
  onCancel,
  onConfirmed,
}: ParcelEditorProps & { initial: Draft[] }) {
  const [drafts, setDrafts] = useState(initial);
  const panelRef = useRef<HTMLElement | null>(null);
  const [guides, setGuides] = useState<Feature<LineString>[]>([]);
  const [mode, setMode] = useState<Mode | null>(null);
  const [selected, setSelected] = useState<Handle | null>(null);
  const [error, setError] = useState<string>();
  const [dragging, setDragging] = useState(false);
  const [save, { isLoading }] = useUpdateParcelReviewGroupMutation();
  const changed = drafts.filter((draft) => draft.dirty);
  const ready = useEffectEvent(() =>
    onReady(drafts.flatMap(({ outputIndex }) => (outputIndex === undefined ? [] : [outputIndex]))),
  );
  const initialData = useEffectEvent(() => editorFeatures(drafts, null));
  const findHandle = useEffectEvent((map: MapLibreMap, point: [number, number]) => {
    if (isLoading) return null;
    const layers = mode ? [hitLayers[mode]] : priorities;
    const hits = map.queryRenderedFeatures(point, { layers });
    for (const layer of layers) {
      const hit = hits.find((item) => item.layer.id === layer && item.properties.editable);
      if (!hit) continue;
      const handle = hit.properties as Handle;
      const draft = drafts.find((item) => item.featureIndex === handle.featureIndex);
      if (draft) return { handle, draft };
    }
    return null;
  });

  const prepareAlignment = useEffectEvent(
    (map: MapLibreMap, draft: Draft, handle: Handle, axis: AlignmentAxis) => {
      const project = (position: Position): ScreenPoint => {
        const point = map.project([position[0], position[1]]);
        return [point.x, point.y];
      };
      const spans = (ring: Position[]) => {
        const projected = ring.map(project);
        return projected.flatMap((first, index) => {
          const span = alignmentSpan(axis, first, projected[(index + 1) % projected.length]);
          return span ? [span] : [];
        });
      };
      let moving: AlignmentSpan[] = [];
      if (handle.kind === "parcel") {
        moving = draft.rings.flatMap(([exterior]) => (exterior ? spans(exterior) : []));
      } else {
        const ring = draft.rings[handle.polygon]?.[handle.ring];
        const position = ring?.[handle.vertex];
        if (ring && position) {
          const point = project(position);
          const span =
            handle.kind === "vertex"
              ? alignmentSpan(axis, point)
              : alignmentSpan(axis, point, project(ring[(handle.vertex + 1) % ring.length]));
          if (span) moving = [span];
        }
      }
      const targets = drafts
        .filter((item) => item.featureIndex !== draft.featureIndex)
        .flatMap((item) => item.rings.flatMap(([exterior]) => (exterior ? spans(exterior) : [])))
        .sort((a, b) => a.coordinate - b.coordinate);
      return { moving, targets };
    },
  );

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const data = initialData();
    map.addSource(SOURCE, { type: "geojson", data });
    map.addLayer({
      id: FILL,
      source: SOURCE,
      type: "fill",
      filter: ["==", "kind", "parcel"],
      paint: {
        "fill-color": ["case", ["get", "editable"], "#0ea5e9", "#f59e0b"],
        "fill-opacity": 0.29,
      },
    });
    map.addLayer({
      id: OUTLINE,
      source: SOURCE,
      type: "line",
      filter: ["==", "kind", "parcel"],
      paint: { "line-color": ["case", ["get", "editable"], "#0284c7", "#f59e0b"], "line-width": 3 },
    });
    map.addLayer({
      id: EDGES,
      source: SOURCE,
      type: "line",
      filter: ["==", "kind", "edge"],
      paint: {
        "line-color": ["case", ["get", "selected"], "#f59e0b", "#0284c7"],
        "line-width": 12,
        "line-opacity": ["case", ["get", "selected"], 0.85, 0.015],
      },
    });
    map.addLayer({
      id: VERTICES,
      source: SOURCE,
      type: "circle",
      filter: ["==", "kind", "vertex"],
      paint: {
        "circle-color": ["case", ["get", "selected"], "#f59e0b", "#0369a1"],
        "circle-radius": 5,
        "circle-stroke-color": "#fff",
        "circle-stroke-width": 1.5,
      },
    });
    map.addLayer({
      id: GUIDE,
      source: SOURCE,
      type: "line",
      filter: ["==", "kind", "axis-guide"],
      paint: { "line-color": "#0891b2", "line-width": 2, "line-dasharray": [3, 3] },
    });
    map.addLayer({
      id: SNAP,
      source: SOURCE,
      type: "line",
      filter: ["==", "kind", "snap-guide"],
      paint: { "line-color": "#f59e0b", "line-width": 4 },
    });
    const canvas = map.getCanvas();
    const bounds = getGeoJsonBounds(data);
    if (bounds) {
      const side = Math.min(105, canvas.clientWidth * 0.14);
      const bottom = Math.min(
        (panelRef.current?.offsetHeight ?? 166) + 52,
        canvas.clientHeight * 0.62,
      );
      map.fitBounds(bounds, {
        padding: { top: 55, bottom, left: side, right: side },
        maxZoom: 19,
        duration: 500,
      });
    }
    ready();
    const surface = map.getCanvasContainer();
    const priorCursor = canvas.style.cursor;
    let drag: {
      pointerId: number;
      start: [number, number];
      handle: Handle;
      draft: Draft;
      panEnabled: boolean;
      tracking: DragAlignment;
      alignments: Map<AlignmentAxis, ReturnType<typeof prepareAlignment>>;
      moved: boolean;
    } | null = null;
    const coordinates = (event: PointerEvent): [number, number] => {
      const rect = canvas.getBoundingClientRect();
      return [event.clientX - rect.left, event.clientY - rect.top];
    };
    const down = (event: PointerEvent) => {
      if (event.button !== 0 || drag) return;
      const start = coordinates(event);
      const target = findHandle(map, start);
      if (!target) return;
      event.preventDefault();
      event.stopPropagation();
      map.stop();
      const panEnabled = map.dragPan.isEnabled();
      if (panEnabled) map.dragPan.disable();
      drag = {
        ...target,
        pointerId: event.pointerId,
        start,
        panEnabled,
        moved: false,
        tracking: { point: start, directionSample: start, movement: [0, 0], axis: null },
        alignments: new Map(),
      };
      surface.setPointerCapture(event.pointerId);
      canvas.style.cursor = "grabbing";
      setSelected(target.handle);
      setDragging(true);
    };
    const move = (event: PointerEvent) => {
      if (!drag) {
        canvas.style.cursor = findHandle(map, coordinates(event)) ? "grab" : priorCursor;
        return;
      }
      if (drag.pointerId !== event.pointerId) return;
      const point = coordinates(event);
      const { start, draft, handle, alignments } = drag;
      if (!drag.moved && Math.hypot(point[0] - start[0], point[1] - start[1]) < 2) return;
      drag.moved = true;
      drag.tracking = advanceDragAlignment(drag.tracking, point);
      const { axis, movement } = drag.tracking;
      let [dx, dy] = movement;

      const findSnap = (direction: AlignmentAxis) => {
        let alignment = alignments.get(direction);
        if (!alignment) {
          alignment = prepareAlignment(map, draft, handle, direction);
          alignments.set(direction, alignment);
        }
        const horizontal = direction === "horizontal";
        const distance = horizontal ? dx : dy;
        return {
          direction,
          distance,
          snap: snapAlignedMovement(
            distance,
            alignment.moving,
            alignment.targets,
            horizontal ? dy : dx,
          ),
        };
      };
      // A nearby matching edge can also suggest a snap during a diagonal drag.
      const candidates = (
        axis ? [findSnap(axis)] : [findSnap("horizontal"), findSnap("vertical")]
      ).filter(({ snap }) => snap.target);
      const closest = candidates.reduce<(typeof candidates)[number] | undefined>(
        (best, candidate) =>
          !best ||
          Math.abs(candidate.snap.distance - candidate.distance) <
            Math.abs(best.snap.distance - best.distance)
            ? candidate
            : best,
        undefined,
      );

      if (closest?.direction === "horizontal") dx = closest.snap.distance;
      if (closest?.direction === "vertical") dy = closest.snap.distance;

      const line = (
        kind: string,
        first: ScreenPoint,
        second: ScreenPoint,
      ): Feature<LineString> => ({
        type: "Feature",
        properties: { kind },
        geometry: {
          type: "LineString",
          coordinates: [map.unproject(first).toArray(), map.unproject(second).toArray()],
        },
      });
      const nextGuides: Feature<LineString>[] = [];
      if (closest?.snap.target) {
        const { coordinate, start, end, crossCoordinate } = closest.snap.target;
        if (closest.direction === "horizontal") {
          nextGuides.push(
            line("snap-guide", [coordinate, start], [coordinate, end]),
            line("axis-guide", [0, crossCoordinate], [canvas.clientWidth, crossCoordinate]),
          );
        } else {
          nextGuides.push(
            line("snap-guide", [start, coordinate], [end, coordinate]),
            line("axis-guide", [crossCoordinate, 0], [crossCoordinate, canvas.clientHeight]),
          );
        }
      } else if (axis === "horizontal") {
        const y = start[1] + dy;
        nextGuides.push(line("axis-guide", [0, y], [canvas.clientWidth, y]));
      } else if (axis === "vertical") {
        const x = start[0] + dx;
        nextGuides.push(line("axis-guide", [x, 0], [x, canvas.clientHeight]));
      }
      setGuides(nextGuides);
      const rings = dragParcel(draft.rings, handle, (position) => {
        const point = map.project([position[0], position[1]]);
        const { lng, lat } = map.unproject([point.x + dx, point.y + dy]).wrap();
        return [lng, lat, ...position.slice(2)];
      });
      setDrafts((current) =>
        current.map((item) =>
          item.featureIndex === draft.featureIndex ? { ...item, rings, dirty: true } : item,
        ),
      );
    };
    const finish = (event: PointerEvent) => {
      if (!drag || drag.pointerId !== event.pointerId) return;
      if (event.type === "pointerup") move(event);
      if (drag.panEnabled) map.dragPan.enable();
      if (surface.hasPointerCapture(event.pointerId))
        surface.releasePointerCapture(event.pointerId);
      drag = null;
      canvas.style.cursor = priorCursor;
      setDragging(false);
      setGuides([]);
    };
    surface.addEventListener("pointerdown", down, true);
    surface.addEventListener("pointermove", move);
    surface.addEventListener("pointerup", finish);
    surface.addEventListener("pointercancel", finish);
    surface.addEventListener("lostpointercapture", finish);
    return () => {
      surface.removeEventListener("pointerdown", down, true);
      surface.removeEventListener("pointermove", move);
      surface.removeEventListener("pointerup", finish);
      surface.removeEventListener("pointercancel", finish);
      surface.removeEventListener("lostpointercapture", finish);
      // eslint-disable-next-line react-hooks/exhaustive-deps -- The parent can dispose the map first.
      if (mapRef.current !== map) return;
      if (drag?.panEnabled) map.dragPan.enable();
      canvas.style.cursor = priorCursor;
      for (const id of [SNAP, GUIDE, VERTICES, EDGES, OUTLINE, FILL])
        if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(SOURCE)) map.removeSource(SOURCE);
    };
  }, [mapRef]);

  useEffect(() => {
    mapRef.current
      ?.getSource<GeoJSONSource>(SOURCE)
      ?.setData(editorFeatures(drafts, selected, guides));
  }, [drafts, guides, mapRef, selected]);

  const selectedRing =
    selected &&
    drafts.find(({ featureIndex }) => featureIndex === selected.featureIndex)?.rings[
      selected.polygon
    ]?.[selected.ring];
  const editSelectedVertex = () => {
    if (!selected || !selectedRing || selected.kind === "parcel") return;
    const add = selected.kind === "edge";
    if (!add && selectedRing.length <= 3) return;
    const rings = (ring: Position[]) => {
      if (!add) return ring.filter((_, index) => index !== selected.vertex);
      const first = ring[selected.vertex];
      const second = ring[(selected.vertex + 1) % ring.length];
      const middle = first.map((value, index) => (value + (second[index] ?? value)) / 2);
      return [...ring.slice(0, selected.vertex + 1), middle, ...ring.slice(selected.vertex + 1)];
    };
    setDrafts((current) =>
      current.map((draft) =>
        draft.featureIndex === selected.featureIndex
          ? { ...draft, dirty: true, rings: updateParcelRing(draft.rings, selected, rings) }
          : draft,
      ),
    );
    setSelected(null);
  };

  const confirm = async () => {
    setError(undefined);
    try {
      const edits = changed.flatMap(({ revision, featureIndex, rings, type }) =>
        revision ? [{ revision, featureIndex, geometry: closeParcelRings(type, rings) }] : [],
      );
      const result = await save({ jobId, groupId, edits }).unwrap();
      onConfirmed(result.data.featureIndexes);
    } catch (error) {
      setError(errorMessage(error, "ثبت اصلاحات انجام نشد. دوباره تلاش کنید."));
    }
  };

  return (
    <EditorPanel panelRef={panelRef}>
      <h2 className="text-sm font-bold">
        اصلاح دستی {drafts.length.toLocaleString("fa-IR")} عارضه
      </h2>
      <p className="text-xs leading-5 text-muted-foreground">
        قطعه، ضلع یا رأس را بکشید. هنگام حرکت نزدیک محور افقی یا عمودی، خط تراز خودکار ظاهر می‌شود.
      </p>
      <div className="flex flex-wrap gap-2" aria-label="نوع جابه‌جایی">
        {modes.map(([key, label]) => (
          <Button
            key={key}
            size="sm"
            variant={mode === key ? "default" : "outline"}
            aria-pressed={mode === key}
            disabled={isLoading || dragging}
            onClick={() => {
              setSelected(null);
              setMode(mode === key ? null : key);
            }}
          >
            {label}
          </Button>
        ))}
      </div>
      {drafts.some((draft) => !draft.revision) && (
        <p role="status" className="text-xs text-amber-700 dark:text-amber-300">
          عارضه‌های زرد در خروجی قبلی به‌طور یکتا شناسایی نشدند.
        </p>
      )}
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={!changed.length || dragging || isLoading}
          onClick={() => void confirm()}
        >
          {isLoading ? "در حال ثبت…" : "تأیید اصلاحات عارضه‌ها"}
        </Button>
        {selectedRing &&
          selected &&
          (selected.kind === "edge" || (selected.kind === "vertex" && selectedRing.length > 3)) && (
            <Button
              size="sm"
              variant="outline"
              disabled={dragging || isLoading}
              onClick={editSelectedVertex}
            >
              {selected.kind === "edge" ? "افزودن رأس" : "حذف رأس"}
            </Button>
          )}
        <Button size="sm" variant="ghost" disabled={isLoading} onClick={onCancel}>
          انصراف
        </Button>
      </div>
    </EditorPanel>
  );
}

function dragParcel(rings: Position[][][], handle: Handle, move: (position: Position) => Position) {
  if (handle.kind === "parcel")
    return rings.map((polygon) => polygon.map((ring) => ring.map(move)));
  return updateParcelRing(rings, handle, (ring) =>
    ring.map((position, index) =>
      index === handle.vertex ||
      (handle.kind === "edge" && index === (handle.vertex + 1) % ring.length)
        ? move(position)
        : position,
    ),
  );
}

function editorFeatures(
  drafts: Draft[],
  selected: Handle | null,
  guides: Feature<LineString>[] = [],
): FeatureCollection {
  const features: FeatureCollection["features"] = [...guides];
  for (const { featureIndex, revision, type, rings } of drafts) {
    const editable = revision !== null;
    const polygons = rings
      .filter(([outer]) => outer?.length >= 3)
      .map((polygon) => polygon.filter((ring) => ring.length >= 3));
    if (polygons.length)
      features.push({
        type: "Feature",
        properties: { featureIndex, editable, kind: "parcel" },
        geometry: closeParcelRings(type, polygons),
      });
    if (!editable) continue;
    rings.forEach((parts, polygon) =>
      parts.forEach((positions, ring) =>
        positions.forEach((position, vertex) => {
          const address = { featureIndex, editable, polygon, ring, vertex };
          const active =
            selected?.featureIndex === featureIndex &&
            selected.polygon === polygon &&
            selected.ring === ring &&
            selected.vertex === vertex;
          features.push({
            type: "Feature",
            properties: {
              ...address,
              kind: "vertex",
              selected: active && selected.kind === "vertex",
            },
            geometry: { type: "Point", coordinates: position },
          });
          if (positions.length < 2) return;
          features.push({
            type: "Feature",
            properties: { ...address, kind: "edge", selected: active && selected.kind === "edge" },
            geometry: {
              type: "LineString",
              coordinates: [position, positions[(vertex + 1) % positions.length]],
            },
          });
        }),
      ),
    );
  }
  return { type: "FeatureCollection", features };
}
