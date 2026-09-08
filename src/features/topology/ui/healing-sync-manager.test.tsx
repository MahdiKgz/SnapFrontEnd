// @vitest-environment jsdom
import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import { HealingSyncManager } from "./healing-sync-manager";

const { state, watch, dispatch } = vi.hoisted(() => ({
  state: {
    auth: { accessToken: "token" },
    healingSync: {
      jobs: { job: { id: "job", name: "CAD", status: "processing", lastEventId: null } },
      notifications: [],
    },
  },
  watch: vi.fn(),
  dispatch: vi.fn(),
}));
vi.mock("@/app/store/hooks", () => ({
  useAppDispatch: () => dispatch,
  useAppSelector: (select: (state: unknown) => unknown) => select(state),
}));
vi.mock("@/features/files/api/files-api", () => ({
  filesApi: {},
  useGetUserFilesQuery: () => ({ data: undefined }),
}));
vi.mock("../api/topology-api", () => ({
  buildTopologyApiUrl: (path: string) => path,
  topologyApi: {},
}));
vi.mock("../api/watch-healing-job", () => ({ watchHealingJob: watch }));
vi.mock("../api/read-healing-status", () => ({ readHealingStatus: vi.fn() }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
it("keeps the background connection alive across progress renders and aborts it when finished", () => {
  const { rerender } = render(<HealingSyncManager />);
  const signal = watch.mock.calls[0][0].signal as AbortSignal;
  state.healingSync.jobs = { job: { ...state.healingSync.jobs.job } };
  rerender(<HealingSyncManager />);
  expect(signal.aborted).toBe(false);
  expect(watch).toHaveBeenCalledOnce();
  state.healingSync.jobs = { job: { ...state.healingSync.jobs.job, status: "completed" } };
  rerender(<HealingSyncManager />);
  expect(signal.aborted).toBe(true);
});
