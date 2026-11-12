import { type RefObject, useEffect, useEffectEvent, useState } from "react";

import {
  Check,
  Magnet,
  MousePointer2,
  Pentagon,
  Redo2,
  Save,
  Spline,
  Square,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import type { Map } from "maplibre-gl";
import { useBlocker } from "react-router-dom";

import { DrawingExportButton } from "@features/conversion";

import { Button } from "@shared/ui/button";

import {
  useGetCadastralDrawingQuery,
  useGetSpatialImagesQuery,
  useSaveCadastralDrawingMutation,
} from "../api/business-api";
import {
  type Drawing,
  MAX_DRAWING_VERTICES,
  MAX_SHAPES,
  MAX_SHAPE_VERTICES,
  MIN_VERTICES,
  type Mode,
  type Shape,
  type Vertex,
  completeAtIntersection,
  dimensions,
  drawingGeoJson,
  equal,
  rectangle,
  validShape,
} from "../model/cadastral-drawing";
import { businessError, count } from "../model/types";
import { useCadastralMap } from "../model/use-cadastral-map";
import { BusinessMessage, ConfirmBusinessAction } from "./business-feedback";
import { SpatialImageLayer } from "./spatial-image-layer";

interface MapProps {
  mapRef: RefObject<Map | null>;
  active: boolean;
  isMapReady: boolean;
}
const tools = [
  { mode: "select", text: "انتخاب", key: "V", icon: MousePointer2 },
  { mode: "line", text: "چندخطی", key: "L", icon: Spline },
  { mode: "parcel", text: "قطعه", key: "P", icon: Pentagon },
  { mode: "rectangle", text: "مستطیل", key: "R", icon: Square },
] as const;
const prompts: Record<Mode, string> = {
  select: "یک عارضه را انتخاب کنید و رأس‌های آن را بکشید.",
  line: "رأس‌های خط را روی نقشه بگذارید و ترسیم را پایان دهید.",
  parcel: "رأس‌های قطعه را به‌ترتیب بگذارید. با انتخاب رأس اول یا دکمهٔ پایان، قطعه بسته می‌شود.",
  rectangle: "دو گوشهٔ مقابل مستطیل را روی نقشه انتخاب کنید.",
};
const formatMeasure = (value: number) =>
  value.toLocaleString("fa-IR", { maximumFractionDigits: 2 });

interface History {
  past: Shape[][];
  present: Shape[];
  future: Shape[][];
}

function Workspace({
  id,
  initial,
  mapRef,
  active,
  onPendingChange,
  onReload,
}: {
  id: string;
  initial: Drawing;
  mapRef: MapProps["mapRef"];
  active: boolean;
  onPendingChange: (pending: boolean) => void;
  onReload: () => void;
}) {
  const [history, setHistory] = useState<History>({
    past: [],
    present: initial.features,
    future: [],
  });
  const [saved, setSaved] = useState(initial);
  const [mode, setMode] = useState<Mode>("select");
  const [vertices, setVertices] = useState<Vertex[]>([]);
  const [intersection, setIntersection] = useState<Vertex[]>();
  const [selectedId, setSelectedId] = useState<string>();
  const [snapping, setSnapping] = useState(true);
  const [ortho, setOrtho] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean }>();
  const [conflict, setConflict] = useState(false);
  const [confirmReload, setConfirmReload] = useState(false);
  const [save, saving] = useSaveCadastralDrawingMutation();
  const shapes = history.present;
  const selected = shapes.find(({ id }) => id === selectedId);
  const intersectionPath =
    mode === "select" && selected?.kind === "line" ? selected.vertices : vertices;
  const canSuggestIntersection = mode !== "rectangle" && intersectionPath.length >= 4;
  const dirty = shapes !== saved.features;
  const pending = dirty || vertices.length > 0 || saving.isLoading;
  const navigation = useBlocker(
    ({ currentLocation, nextLocation }) =>
      pending && currentLocation.pathname !== nextLocation.pathname,
  );
  useEffect(() => {
    onPendingChange(pending);
    if (!pending) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [pending, onPendingChange]);

  const commit = (next: Shape[]) => {
    setHistory(({ past, present }) => ({
      past: [...past.slice(-49), present],
      present: next,
      future: [],
    }));
    setMessage(undefined);
  };

  const create = (kind: Shape["kind"], points: Vertex[]) => {
    const shape = { id: crypto.randomUUID(), kind, vertices: points };
    if (!validShape(shape)) {
      setMessage({
        error: true,
        text: "رأس‌های تکراری، مرز خودمتقاطع یا قطعهٔ بدون مساحت را اصلاح کنید.",
      });
      return;
    }
    if (
      shapes.length >= MAX_SHAPES ||
      shapes.reduce((n, item) => n + item.vertices.length, points.length) > MAX_DRAWING_VERTICES
    ) {
      setMessage({ error: true, text: "ظرفیت این ترسیم پر شده است." });
      return;
    }
    commit([...shapes, shape]);
    setVertices([]);
    setIntersection(undefined);
  };

  const finish = () => {
    if (intersection) {
      if (mode === "select" && selected?.kind === "line") {
        const parcel: Shape = { ...selected, kind: "parcel", vertices: intersection };
        commit(shapes.map((shape) => (shape.id === parcel.id ? parcel : shape)));
        setIntersection(undefined);
      } else {
        create("parcel", intersection);
      }
      return;
    }
    if (mode === "line" || mode === "parcel") create(mode, vertices);
  };
  const suggestIntersection = () => {
    if (!canSuggestIntersection) return;
    if (intersection) {
      finish();
      return;
    }
    const completed = completeAtIntersection(intersectionPath);
    if (!completed) {
      setMessage({
        error: true,
        text: "تقاطع مناسبی پیدا نشد. جهت یا طول ضلع اول و آخر را بررسی کنید.",
      });
      return;
    }
    setIntersection(completed);
    setMessage(undefined);
  };
  const onPoint = (point: Vertex) => {
    if (mode === "select" || intersection) return;
    setMessage(undefined);
    const first = vertices[0];
    if (mode === "rectangle" && first) {
      create("parcel", rectangle(first, point));
      return;
    }
    if (mode === "parcel" && vertices.length >= 3 && equal(first, point)) {
      finish();
      return;
    }
    if (vertices.some((vertex) => equal(vertex, point))) return;
    if (vertices.length >= MAX_SHAPE_VERTICES) {
      setMessage({
        error: true,
        text: "سقف تعداد رأس‌های این عارضه رسیده است. ترسیم را پایان دهید.",
      });
      return;
    }
    setVertices([...vertices, point]);
  };

  const changeMode = (value: Mode) => {
    if (vertices.length || !active) return;
    setMode(value);
    setIntersection(undefined);
    setSelectedId(undefined);
    setMessage(undefined);
  };
  const cancel = () => {
    if (intersection) {
      setIntersection(undefined);
      setMessage(undefined);
      return;
    }
    setVertices([]);
    setSelectedId(undefined);
    setMessage(undefined);
  };
  const undo = () => {
    if (intersection) {
      setIntersection(undefined);
    } else if (vertices.length) {
      setVertices(vertices.slice(0, -1));
    } else if (history.past.length) {
      setHistory({
        past: history.past.slice(0, -1),
        present: history.past[history.past.length - 1],
        future: [shapes, ...history.future],
      });
    }
    setMessage(undefined);
  };
  const redo = () => {
    if (!intersection && !vertices.length && history.future.length) {
      setHistory({
        past: [...history.past, shapes],
        present: history.future[0],
        future: history.future.slice(1),
      });
      setMessage(undefined);
    }
  };
  const remove = () => {
    if (intersection || !selected) return;
    commit(shapes.filter(({ id }) => id !== selected.id));
    setSelectedId(undefined);
  };
  const onMoveVertex = (id: string, index: number, point: Vertex) => {
    const shape = shapes.find((candidate) => candidate.id === id);
    if (!shape || equal(shape.vertices[index], point)) return;
    const updated = {
      ...shape,
      vertices: shape.vertices.map((vertex, i) => (i === index ? point : vertex)),
    };
    if (!validShape(updated)) {
      setMessage({ error: true, text: "جابجایی رأس، هندسهٔ عارضه را نامعتبر می‌کند." });
      return;
    }
    commit(shapes.map((item) => (item.id === id ? updated : item)));
  };

  const saveDrawing = async () => {
    if (!active || !dirty || saving.isLoading || conflict || vertices.length) return;
    setMessage(undefined);
    try {
      const { data } = await save({
        id,
        drawing: { revision: saved.revision, features: shapes },
      }).unwrap();
      setSaved({ revision: data.revision, features: shapes });
      setMessage({ text: "ترسیم ذخیره شد." });
    } catch (error) {
      if ((error as { data?: { code?: string } })?.data?.code === "DRAWING_CONFLICT")
        setConflict(true);
      setMessage({ error: true, text: businessError(error) });
    }
  };

  const keyboard = useEffectEvent((event: KeyboardEvent) => {
    const key = (event.key ?? "").toLowerCase();
    if (
      event.defaultPrevented ||
      event.repeat ||
      event.altKey ||
      (event.target instanceof Element &&
        (event.target.closest("input, textarea, select, [contenteditable=true], [role=dialog]") ||
          (key === "enter" && event.target.closest("button"))))
    )
      return;
    const command = event.ctrlKey || event.metaKey;
    if (command && key === "z") {
      if (event.shiftKey) redo();
      else undo();
    } else if (command && key === "y") redo();
    else if (command && key === "s") void saveDrawing();
    else if (command) return;
    else if (key === "escape") cancel();
    else if (
      key === "enter" &&
      (intersection ||
        ((mode === "line" || mode === "parcel") && vertices.length >= MIN_VERTICES[mode]))
    )
      finish();
    else if (key === "backspace" && vertices.length) undo();
    else if (key === "delete") remove();
    else if (key === "f3") setSnapping((value) => !value);
    else if (key === "f7" && canSuggestIntersection) suggestIntersection();
    else if (key === "f8") setOrtho((value) => !value);
    else {
      const tool = tools.find((item) => item.key.toLowerCase() === key);
      if (!tool) return;
      changeMode(tool.mode);
    }
    event.preventDefault();
  });

  useEffect(() => {
    if (!active) return;
    const listener = (event: KeyboardEvent) => keyboard(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [active]);
  useCadastralMap({
    mapRef,
    active,
    mode,
    shapes,
    vertices,
    intersection,
    selected,
    snapping,
    ortho,
    onPoint,
    onSelect: setSelectedId,
    onMoveVertex,
  });
  const measure = selected ? dimensions(selected) : undefined;
  const canFinish = (mode === "line" || mode === "parcel") && vertices.length >= MIN_VERTICES[mode];

  return (
    <div className="space-y-3">
      <fieldset className="space-y-3" disabled={!active}>
        <div className="grid grid-cols-2 gap-2" aria-label="ابزارهای ترسیم">
          {tools.map(({ mode: value, text, key, icon: Icon }) => (
            <Button
              key={value}
              variant={mode === value ? "default" : "outline"}
              size="sm"
              aria-pressed={mode === value}
              aria-keyshortcuts={key}
              disabled={vertices.length > 0 && mode !== value}
              onClick={() => changeMode(value)}
            >
              <Icon className="size-4" />
              {text}
              <kbd className="ms-auto opacity-65" dir="ltr">
                {key}
              </kbd>
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={snapping ? "secondary" : "outline"}
            aria-pressed={snapping}
            aria-keyshortcuts="F3"
            onClick={() => setSnapping(!snapping)}
          >
            <Magnet className="size-4" />
            چفت‌شدن
          </Button>
          <Button
            size="sm"
            variant={ortho ? "secondary" : "outline"}
            aria-pressed={ortho}
            aria-keyshortcuts="F8"
            onClick={() => setOrtho(!ortho)}
          >
            افقی و عمودی
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={intersection ? "default" : "outline"}
            aria-keyshortcuts={intersection ? "F7 Enter" : "F7"}
            disabled={!canSuggestIntersection}
            onClick={suggestIntersection}
          >
            {intersection ? "تأیید تقاطع" : "پیشنهاد تقاطع"}
            <kbd dir="ltr" className="opacity-65">
              F7
            </kbd>
          </Button>
          {intersection && (
            <Button
              size="icon"
              variant="ghost"
              aria-label="لغو پیشنهاد تقاطع"
              title="لغو پیشنهاد تقاطع"
              onClick={cancel}
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
        <p className="min-h-9 text-xs leading-5 text-muted-foreground">
          {intersection
            ? "گوشهٔ پیشنهادی روی نقشه مشخص است. برای ثبت Enter و برای بازگشت Esc را بزنید."
            : mode === "select" && !canSuggestIntersection
              ? "عارضه‌ای را برای ویرایش انتخاب کنید. برای پیشنهاد تقاطع، یک چندخطی با دست‌کم ۴ رأس انتخاب کنید."
              : prompts[mode]}
        </p>
        {vertices.length > 0 && !intersection && (
          <div className="flex flex-wrap items-center gap-2 rounded-lg border p-2">
            <span className="me-auto text-xs text-muted-foreground">
              {count(vertices.length)} رأس
            </span>
            {mode !== "rectangle" && (
              <Button size="sm" disabled={!canFinish} onClick={finish}>
                <Check className="size-4" />
                پایان ترسیم
              </Button>
            )}
            <Button
              size="icon"
              variant="ghost"
              aria-label="لغو ترسیم"
              title="لغو ترسیم"
              onClick={cancel}
            >
              <X className="size-4" />
            </Button>
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            size="icon"
            variant="outline"
            title="واگرد"
            aria-label="واگرد"
            disabled={!intersection && !vertices.length && !history.past.length}
            onClick={undo}
          >
            <Undo2 />
          </Button>
          <Button
            size="icon"
            variant="outline"
            title="بازانجام"
            aria-label="بازانجام"
            disabled={!!intersection || !!vertices.length || !history.future.length}
            onClick={redo}
          >
            <Redo2 />
          </Button>
          <Button
            size="icon"
            variant="outline"
            title="حذف عارضه"
            aria-label="حذف عارضه"
            disabled={!selected}
            onClick={remove}
          >
            <Trash2 />
          </Button>
        </div>
        {measure && (
          <dl className="flex flex-wrap gap-x-4 gap-y-1 rounded-lg border p-2 text-xs">
            <div>
              <dt className="text-muted-foreground">
                {measure.squareMeters === undefined ? "طول" : "محیط"}
              </dt>
              <dd>{formatMeasure(measure.meters)} متر</dd>
            </div>
            {measure.squareMeters !== undefined && (
              <div>
                <dt className="text-muted-foreground">مساحت</dt>
                <dd>{formatMeasure(measure.squareMeters)} مترمربع</dd>
              </div>
            )}
          </dl>
        )}
        <div className="flex flex-wrap items-center gap-2 border-t pt-3">
          <Button
            size="sm"
            disabled={!dirty || !!vertices.length || saving.isLoading || conflict}
            onClick={() => void saveDrawing()}
          >
            <Save className="size-4" />
            {saving.isLoading ? "در حال ذخیره…" : "ذخیرهٔ ترسیم"}
          </Button>
          <DrawingExportButton
            filename={`cadastral-${id}`}
            disabled={!shapes.length}
            readDrawing={() => drawingGeoJson(shapes)}
          />
          <span className="text-xs text-muted-foreground">
            {count(shapes.length)} عارضه{dirty ? " · ذخیره‌نشده" : ""}
          </span>
        </div>
      </fieldset>
      {message && <BusinessMessage error={message.error}>{message.text}</BusinessMessage>}
      {conflict && (
        <Button variant="outline" size="sm" onClick={() => setConfirmReload(true)}>
          دریافت نسخهٔ ذخیره‌شده
        </Button>
      )}
      {confirmReload && (
        <ConfirmBusinessAction
          title="دریافت ترسیم ذخیره‌شده"
          description="با دریافت نسخهٔ سرور، تغییرات ذخیره‌نشدهٔ این پنجره کنار گذاشته می‌شود."
          busy={false}
          onClose={() => setConfirmReload(false)}
          onConfirm={() => {
            setConfirmReload(false);
            onReload();
          }}
        />
      )}
      {navigation.state === "blocked" && (
        <ConfirmBusinessAction
          title="خروج از ترسیم"
          description="تغییرات ذخیره‌نشده با خروج از نقشه کنار گذاشته می‌شود."
          busy={saving.isLoading}
          onClose={navigation.reset}
          onConfirm={navigation.proceed}
        />
      )}
      <details className="text-xs leading-6 text-muted-foreground">
        <summary className="cursor-pointer">میانبرها</summary>
        <p>
          F7 تقاطع امتداد ضلع اول و آخر را برای چندخطی انتخاب‌شده یا ترسیم در حال انجام پیشنهاد
          می‌دهد.
        </p>
        <p>
          پایان با Enter، لغو با Esc، حذف با Delete، واگرد با Ctrl+Z و بازانجام با Ctrl+Shift+Z.
        </p>
        <p>
          برای قفل موقت افقی و عمودی هنگام ترسیم، Shift را نگه دارید. چفت‌شدن با F3 و قفل دائمی با
          F8 تغییر می‌کند.
        </p>
      </details>
    </div>
  );
}

function ImageSession({
  id,
  active,
  isMapReady,
  mapRef,
  onPendingChange,
}: MapProps & {
  id: string;
  onPendingChange: (pending: boolean) => void;
}) {
  const [imageStatus, setImageStatus] = useState<"loading" | "ready" | "failed">("loading");
  const [attempt, setAttempt] = useState(0);
  const [reloading, setReloading] = useState(false);
  const drawing = useGetCadastralDrawingQuery(id, { refetchOnMountOrArgChange: true });
  const data = drawing.currentData?.data;
  const reload = () => {
    setReloading(true);
    void drawing.refetch().finally(() => {
      setReloading(false);
    });
  };

  return (
    <>
      {active && (
        <SpatialImageLayer
          id={id}
          mapRef={mapRef}
          isMapReady={isMapReady}
          key={attempt}
          onStatus={setImageStatus}
        />
      )}
      {active && imageStatus === "failed" && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setImageStatus("loading");
            setAttempt((value) => value + 1);
          }}
        >
          بارگیری دوبارهٔ تصویر
        </Button>
      )}
      {drawing.isError && (
        <BusinessMessage error>
          دریافت ترسیم انجام نشد.{" "}
          <button type="button" className="underline" onClick={reload}>
            تلاش دوباره
          </button>
        </BusinessMessage>
      )}
      {(drawing.isFetching ||
        reloading ||
        (active && imageStatus === "loading" && !drawing.isError)) && (
        <p role="status" className="text-xs text-muted-foreground">
          در حال آماده‌سازی تصویر و ترسیم…
        </p>
      )}
      {data && (
        <Workspace
          key={data.revision}
          id={id}
          initial={data}
          mapRef={mapRef}
          active={active && imageStatus === "ready" && !reloading}
          onPendingChange={onPendingChange}
          onReload={reload}
        />
      )}
    </>
  );
}

export function CadastralDrawingPanel(props: MapProps) {
  const list = useGetSpatialImagesQuery(undefined, { pollingInterval: props.active ? 15000 : 0 });
  const [imageId, setImageId] = useState("");
  const [nextImage, setNextImage] = useState<string>();
  const [pending, setPending] = useState(false);
  const restricted =
    list.error && "status" in list.error && [401, 403].includes(Number(list.error.status));
  const ready = (list.currentData?.data.images ?? []).filter((image) => image.status === "ready");
  const selected = ready.find(({ id }) => id === imageId);
  const switchTo = (id: string) => {
    setPending(false);
    setImageId(id);
    setNextImage(undefined);
  };

  if (restricted)
    return <BusinessMessage>ترسیم کاداستری در پلن شرکتی فعال در دسترس است.</BusinessMessage>;
  return (
    <div className="space-y-3">
      {list.isLoading && (
        <p role="status" className="text-sm">
          در حال دریافت تصاویر مکانی…
        </p>
      )}
      {list.isError && (
        <BusinessMessage error>
          دریافت تصاویر انجام نشد.{" "}
          <button type="button" className="underline" onClick={() => void list.refetch()}>
            تلاش دوباره
          </button>
        </BusinessMessage>
      )}
      {!list.isLoading && !list.isError && !ready.length && (
        <BusinessMessage>
          ابتدا یک GeoTIFF را در تب تصاویر مکانی بارگذاری کنید و منتظر آماده‌شدن آن بمانید.
        </BusinessMessage>
      )}
      {!!ready.length && (
        <label className="block space-y-1.5 text-xs">
          <span className="font-semibold">تصویر مبنای ترسیم</span>
          <select
            value={selected?.id ?? ""}
            className="block w-full rounded-lg border bg-background p-2 text-sm"
            onChange={(event) =>
              pending ? setNextImage(event.target.value) : switchTo(event.target.value)
            }
          >
            <option value="">تصویر را انتخاب کنید</option>
            {ready.map(({ id, name }) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
      )}
      {selected && (
        <ImageSession key={selected.id} {...props} id={selected.id} onPendingChange={setPending} />
      )}
      {nextImage !== undefined && (
        <ConfirmBusinessAction
          title="تغییر تصویر مبنا"
          description="با تغییر تصویر، تغییرات ذخیره‌نشدهٔ ترسیم فعلی کنار گذاشته می‌شود."
          busy={false}
          onClose={() => setNextImage(undefined)}
          onConfirm={() => switchTo(nextImage)}
        />
      )}
    </div>
  );
}
