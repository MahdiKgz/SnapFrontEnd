// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { FeatureCollection } from "geojson";
import type { Map as MapLibreMap } from "maplibre-gl";
import { afterEach, expect, it, vi } from "vitest";

import { ParcelEditor } from "./parcel-editor";

const { save, geometry, otherGeometry } = vi.hoisted(() => ({
  save: vi.fn(),
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [10, 10, 9],
        [12, 10, 8],
        [12, 12, 7],
        [10, 10, 9],
      ],
    ],
  },
  otherGeometry: {
    type: "Polygon",
    coordinates: [
      [
        [20, 20],
        [22, 20],
        [22, 22],
        [20, 20],
      ],
    ],
  },
}));
vi.mock("../api/topology-api", () => ({
  useGetParcelReviewGroupQuery: () => ({
    currentData: {
      data: [
        { geometry, featureIndex: 3, revision: "revision-1", outputIndex: 7 },
        { geometry: otherGeometry, featureIndex: 9, revision: "revision-2", outputIndex: 4 },
      ],
    },
  }),
  useUpdateParcelReviewGroupMutation: () => [save, { isLoading: false }],
}));
afterEach(cleanup);

it.each([
  [
    "vertex",
    "vertices",
    [
      [11, 9, 9],
      [12, 10, 8],
      [12, 12, 7],
      [11, 9, 9],
    ],
  ],
  [
    "edge",
    "edges",
    [
      [11, 9, 9],
      [13, 9, 8],
      [12, 12, 7],
      [11, 9, 9],
    ],
  ],
  [
    "parcel",
    "fill",
    [
      [11, 9, 9],
      [13, 9, 8],
      [13, 11, 7],
      [11, 9, 9],
    ],
  ],
  [
    "parcel",
    "fill",
    [
      [11, 10, 9],
      [13, 10, 8],
      [13, 12, 7],
      [11, 10, 9],
    ],
    "افقی",
    "gaps:POLYGON_GAP",
  ],
  [
    "parcel",
    "fill",
    [
      [10, 9, 9],
      [12, 9, 8],
      [12, 11, 7],
      [10, 9, 9],
    ],
    "عمودی",
    "slivers:SLIVER_POLYGON",
  ],
  [
    "parcel after changing direction",
    "fill",
    [
      [12, 9, 9],
      [14, 9, 8],
      [14, 11, 7],
      [12, 9, 9],
    ],
    "افقی",
    "gaps:POLYGON_GAP",
    [
      [60, 40],
      [70, 38],
    ],
  ],
  [
    "parcel diagonally into a vertical edge",
    "fill",
    [
      [20, 19.5, 9],
      [22, 19.5, 8],
      [22, 21.5, 7],
      [20, 19.5, 9],
    ],
    undefined,
    "gaps:POLYGON_GAP",
    [[147, 145]],
    [
      [0, 20.75],
      [30, 20.75],
    ],
  ],
  [
    "parcel diagonally into a horizontal edge",
    "fill",
    [
      [19.5, 20, 9],
      [21.5, 20, 8],
      [21.5, 22, 7],
      [19.5, 20, 9],
    ],
    undefined,
    "gaps:POLYGON_GAP",
    [[145, 147]],
    [
      [20.75, 0],
      [20.75, 30],
    ],
  ],
])(
  "drags a %s while all group parcels stay visible",
  async (
    kind,
    suffix,
    expected,
    axis?: string,
    groupId = "overlaps:POLYGON_OVERLAP",
    path?: number[][],
    expectedCrossGuide?: number[][],
  ) => {
    save.mockReset().mockReturnValue({ unwrap: async () => ({ data: { featureIndexes: [3] } }) });
    const onConfirmed = vi.fn();
    const onReady = vi.fn();
    const canvas = document.createElement("div");
    Object.defineProperties(canvas, { clientWidth: { value: 300 }, clientHeight: { value: 300 } });
    Object.assign(canvas, {
      setPointerCapture: vi.fn(),
      hasPointerCapture: () => true,
      releasePointerCapture: vi.fn(),
    });
    const setData = vi.fn<(data: FeatureCollection) => void>();
    const map = {
      addSource: vi.fn(),
      addLayer: vi.fn(),
      getLayer: vi.fn(() => true),
      removeLayer: vi.fn(),
      fitBounds: vi.fn(),
      getCanvas: () => canvas,
      getCanvasContainer: () => canvas,
      getSource: () => ({ setData }),
      removeSource: vi.fn(),
      stop: vi.fn(),
      dragPan: { isEnabled: () => true, disable: vi.fn(), enable: vi.fn() },
      queryRenderedFeatures: () => [
        {
          layer: { id: `snapgis-parcel-editor-${suffix}` },
          properties: {
            featureIndex: 3,
            editable: true,
            polygon: 0,
            ring: 0,
            vertex: 0,
            kind: suffix === "fill" ? "parcel" : kind,
          },
        },
      ],
      project: ([x, y]: [number, number]) => ({ x: x * 10, y: y * 10 }),
      unproject: ([x, y]: [number, number]) => ({
        wrap: () => ({ lng: x / 10, lat: y / 10 }),
        toArray: () => [x / 10, y / 10],
      }),
    } as unknown as MapLibreMap;
    render(
      <ParcelEditor
        mapRef={{ current: map }}
        jobId="job"
        groupId={groupId}
        onReady={onReady}
        onCancel={vi.fn()}
        onConfirmed={onConfirmed}
      />,
    );
    expect(onReady).toHaveBeenCalledWith([7, 4]);
    expect(screen.queryByRole("button", { name: "افقی" })).toBeNull();
    expect(screen.queryByRole("button", { name: "عمودی" })).toBeNull();
    const confirm = screen.getByRole<HTMLButtonElement>("button", {
      name: "تأیید اصلاحات عارضه‌ها",
    });
    expect(confirm.disabled).toBe(true);
    const pointer = (type: string, x: number, y: number) =>
      act(() =>
        canvas.dispatchEvent(
          new PointerEvent(type, { clientX: x, clientY: y, pointerId: 1, button: 0 }),
        ),
      );
    pointer("pointerdown", 50, 50);
    const points = path ?? [[axis === "عمودی" ? 52 : 60, axis === "افقی" ? 48 : 40]];
    const hasGuide = (guide: string) =>
      setData.mock.lastCall?.[0].features.some((item) => item.properties?.kind === guide);
    points.forEach(([x, y], index) => {
      pointer("pointermove", x, y);
      if (points.length > 1 && index === 0) expect(hasGuide("axis-guide")).toBe(false);
    });
    expect(hasGuide("axis-guide")).toBe(Boolean(axis || expectedCrossGuide));
    expect(hasGuide("snap-guide")).toBe(Boolean(expectedCrossGuide));
    if (expectedCrossGuide) {
      const guide = setData.mock.lastCall?.[0].features.find(
        (item) => item.properties?.kind === "axis-guide",
      );
      expect(guide?.geometry).toEqual({ type: "LineString", coordinates: expectedCrossGuide });
    }
    const [x, y] = points.at(-1)!;
    pointer("pointerup", x, y);
    expect(save).not.toHaveBeenCalled();
    expect(
      setData.mock.lastCall?.[0].features
        .filter((feature) => feature.geometry.type === "Polygon")
        .map(({ geometry }) => geometry),
    ).toEqual([{ type: "Polygon", coordinates: [expected] }, otherGeometry]);
    fireEvent.click(confirm);
    await waitFor(() => expect(onConfirmed).toHaveBeenCalledWith([3]));
    expect(save).toHaveBeenCalledWith({
      jobId: "job",
      groupId,
      edits: [
        {
          featureIndex: 3,
          revision: "revision-1",
          geometry: { type: "Polygon", coordinates: [expected] },
        },
      ],
    });
  },
);
