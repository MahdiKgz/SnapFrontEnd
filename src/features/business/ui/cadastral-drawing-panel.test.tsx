// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { RouterProvider, createMemoryRouter } from "react-router-dom";
import { afterEach, expect, it, vi } from "vitest";

import type { Shape } from "../model/cadastral-drawing";
import type { useCadastralMap } from "../model/use-cadastral-map";
import { CadastralDrawingPanel } from "./cadastral-drawing-panel";

const { mapHook, save } = vi.hoisted(() => ({
  mapHook: vi.fn<typeof useCadastralMap>(),
  save: vi.fn(),
}));
const line: Shape = {
  id: "roof",
  kind: "line",
  vertices: [
    [51.001, 35.01],
    [51.004, 35.01],
    [51.004, 35],
    [51, 35],
    [51, 35.008],
  ],
};
vi.mock("../api/business-api", () => ({
  useGetSpatialImagesQuery: () => ({
    currentData: { data: { images: [{ id: "image", name: "roof.tiff", status: "ready" }] } },
  }),
  useGetCadastralDrawingQuery: () => ({ currentData: { data: { revision: 1, features: [line] } } }),
  useSaveCadastralDrawingMutation: () => [save, { isLoading: false }],
}));
vi.mock("../model/use-cadastral-map", () => ({ useCadastralMap: mapHook }));
vi.mock("./spatial-image-layer", async () => {
  const { useEffect } = await import("react");
  return {
    SpatialImageLayer: ({ onStatus }: { onStatus: (status: "ready") => void }) => {
      useEffect(() => {
        onStatus("ready");
      }, [onStatus]);
      return null;
    },
  };
});
afterEach(cleanup);

it("shows intersection before selection and can replace an existing polyline with a parcel", async () => {
  save.mockImplementation(({ drawing }) => ({
    unwrap: async () => ({ data: { ...drawing, revision: 2 } }),
  }));
  const router = createMemoryRouter([
    {
      path: "/",
      element: <CadastralDrawingPanel active isMapReady mapRef={{ current: null }} />,
    },
  ]);
  render(<RouterProvider router={router} />);
  fireEvent.click(screen.getByRole("combobox"));
  const image = await screen.findByRole("option", { name: "roof.tiff" });
  fireEvent.pointerDown(image, { pointerType: "mouse" });
  fireEvent.click(image);

  const suggest = await screen.findByRole<HTMLButtonElement>("button", { name: /پیشنهاد تقاطع/ });
  expect(suggest.disabled).toBe(true);

  act(() => mapHook.mock.lastCall?.[0].onSelect(line.id));
  expect(suggest.disabled).toBe(false);
  fireEvent.click(suggest);
  expect(mapHook.mock.lastCall?.[0].intersection?.[0][0]).toBeCloseTo(51, 10);
  expect(mapHook.mock.lastCall?.[0].shapes[0]).toEqual(line);

  fireEvent.keyDown(suggest, { key: "Escape" });
  expect(mapHook.mock.lastCall?.[0].intersection).toBeUndefined();
  expect(mapHook.mock.lastCall?.[0].selected).toEqual(line);
  fireEvent.keyDown(window, { key: "F7" });
  fireEvent.keyDown(window, { key: "Enter" });
  expect(mapHook.mock.lastCall?.[0].selected?.kind).toBe("parcel");
  expect(mapHook.mock.lastCall?.[0].shapes).toHaveLength(1);

  fireEvent.click(screen.getByRole("button", { name: "ذخیرهٔ ترسیم" }));
  await waitFor(() =>
    expect(save).toHaveBeenCalledWith({
      id: "image",
      drawing: {
        revision: 1,
        features: [expect.objectContaining({ id: line.id, kind: "parcel" })],
      },
    }),
  );
  fireEvent.click(screen.getByRole("button", { name: "واگرد" }));
  expect(mapHook.mock.lastCall?.[0].selected).toEqual(line);
});
