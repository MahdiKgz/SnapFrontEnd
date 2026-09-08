// @vitest-environment jsdom
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { streamHealingEvents } from "../api/heal-events";
import type { TopologyHealStatusData, TopologyUploadData } from "./types";
import { useTopologyHealing } from "./use-topology-healing";

const { dispatch, heal, load, read } = vi.hoisted(() => ({
  dispatch: vi.fn(),
  heal: vi.fn(),
  load: vi.fn(),
  read: vi.fn(),
}));
vi.mock("@/app/store/hooks", () => ({
  useAppDispatch: () => dispatch,
  useAppSelector: (select: (state: unknown) => unknown) =>
    select({ auth: { accessToken: "token" } }),
}));
vi.mock("../api/topology-api", () => ({
  useHealTopologyMutation: () => [heal, { isLoading: false }],
  useCancelHealingMutation: () => [vi.fn(), { isLoading: false }],
  useLazyGetHealedOutputQuery: () => [load, { isFetching: false }],
  buildTopologyApiUrl: (path: string) => path,
  topologyApi: {
    util: { invalidateTags: (tags: unknown) => ({ type: "invalidate", payload: tags }) },
  },
}));
vi.mock("../api/read-healing-status", () => ({ readHealingStatus: read }));
vi.mock("../api/heal-events", () => ({ streamHealingEvents: vi.fn() }));
const lifecycle = (status: string) =>
  ({
    jobId: "job",
    dryRunJobId: "job",
    status,
    progress: status === "completed" ? 100 : 40,
    links: { output: "/output" },
    result: null,
  }) as TopologyHealStatusData;
const data = { jobId: "job", name: "CAD", heal: { path: "/heal/job" } } as TopologyUploadData;
beforeEach(() => {
  vi.useFakeTimers();
  heal.mockReturnValue({ unwrap: async () => ({ data: lifecycle("queued") }) });
  load.mockReturnValue({ unwrap: async () => ({ type: "FeatureCollection", features: [] }) });
  vi.mocked(streamHealingEvents).mockImplementation(() => new Promise(() => {}));
});
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  vi.useRealTimers();
});
it("updates a stuck progress bar and applies the completed output once without reconnecting on callback changes", async () => {
  read.mockResolvedValueOnce(lifecycle("processing")).mockResolvedValue(lifecycle("completed"));
  const first = vi.fn(),
    latest = vi.fn();
  const { result, rerender } = renderHook(
    ({ callback }) => useTopologyHealing({ data, onHealingComplete: callback }),
    { initialProps: { callback: first } },
  );
  await act(async () => {
    await result.current.requestHealing();
  });
  expect(result.current.lifecycle?.progress).toBe(40);
  rerender({ callback: latest });
  expect(streamHealingEvents).toHaveBeenCalledTimes(1);
  await act(async () => {
    await vi.advanceTimersByTimeAsync(5000);
  });
  expect(result.current.lifecycle?.status).toBe("completed");
  expect(result.current.isStreaming).toBe(false);
  expect(result.current.isOutputReady).toBe(true);
  expect(first).not.toHaveBeenCalled();
  expect(latest).toHaveBeenCalledOnce();
  expect(load).toHaveBeenCalledOnce();
  expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: "invalidate" }));
  await act(async () => {
    await vi.advanceTimersByTimeAsync(15000);
  });
  expect(load).toHaveBeenCalledOnce();
});
it("does not apply a delayed output after leaving the map", async () => {
  read.mockResolvedValue(lifecycle("completed"));
  let finish!: (value: unknown) => void;
  load.mockReturnValue({
    unwrap: () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  });
  const callback = vi.fn();
  const { result, unmount } = renderHook(() =>
    useTopologyHealing({ data, onHealingComplete: callback }),
  );
  await act(async () => {
    await result.current.requestHealing();
  });
  unmount();
  await act(async () => {
    finish({ type: "FeatureCollection", features: [] });
  });
  expect(callback).not.toHaveBeenCalled();
});
