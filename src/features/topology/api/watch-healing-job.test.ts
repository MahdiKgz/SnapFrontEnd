// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { TopologyHealStatusData } from "../model/types";
import { streamHealingEvents } from "./heal-events";
import { watchHealingJob } from "./watch-healing-job";

vi.mock("./heal-events", () => ({ streamHealingEvents: vi.fn() }));
const status = (value: string, progress = 40) =>
  ({ jobId: "job", dryRunJobId: "job", status: value, progress }) as TopologyHealStatusData;
const controllers: AbortController[] = [];
function start(readStatus = vi.fn(async () => status("processing"))) {
  const controller = new AbortController();
  controllers.push(controller);
  const onEvent = vi.fn();
  watchHealingJob({
    jobId: "job",
    accessToken: "token",
    url: "/events",
    signal: controller.signal,
    readStatus,
    onEvent,
  });
  return { controller, onEvent, readStatus };
}
beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(streamHealingEvents).mockImplementation(() => new Promise(() => {}));
});
afterEach(() => {
  controllers.forEach((c) => c.abort());
  controllers.length = 0;
  vi.clearAllMocks();
  vi.useRealTimers();
});
describe("healing status reconciliation", () => {
  it("recovers completion when SSE stays open but never sends the final event", async () => {
    const readStatus = vi
      .fn()
      .mockResolvedValueOnce(status("processing"))
      .mockResolvedValue(status("completed", 100));
    const run = start(readStatus);
    await vi.advanceTimersByTimeAsync(5000);
    expect(run.onEvent).toHaveBeenLastCalledWith(
      expect.objectContaining({ data: status("completed", 100) }),
    );
    expect(vi.mocked(streamHealingEvents).mock.calls[0][0].signal.aborted).toBe(true);
    await vi.advanceTimersByTimeAsync(15000);
    expect(readStatus).toHaveBeenCalledTimes(2);
  });
  it("does not regress to a late snapshot after newer streamed progress or completion", async () => {
    let resolve!: (v: TopologyHealStatusData) => void;
    const run = start(
      vi.fn(
        () =>
          new Promise((done) => {
            resolve = done;
          }),
      ),
    );
    const stream = vi.mocked(streamHealingEvents).mock.calls[0][0];
    stream.onEvent({ id: "2", event: "progress", data: status("processing", 80) });
    resolve(status("processing", 40));
    await vi.advanceTimersByTimeAsync(0);
    expect(run.onEvent).toHaveBeenCalledTimes(1);
    stream.onEvent({ id: "3", event: "completed", data: status("completed", 100) });
    stream.onEvent({ id: "1", event: "progress", data: status("processing", 20) });
    expect(run.onEvent).toHaveBeenCalledTimes(2);
  });
  it("refreshes on return to the tab, and stops timers/listeners on unmount", async () => {
    const run = start();
    await vi.advanceTimersByTimeAsync(0);
    window.dispatchEvent(new Event("focus"));
    await vi.advanceTimersByTimeAsync(0);
    expect(run.readStatus).toHaveBeenCalledTimes(2);
    run.controller.abort();
    window.dispatchEvent(new Event("focus"));
    await vi.advanceTimersByTimeAsync(20000);
    expect(run.readStatus).toHaveBeenCalledTimes(2);
  });
  it("still reaches terminal status when the stream connection fails", async () => {
    vi.mocked(streamHealingEvents).mockRejectedValue(new Error("offline stream"));
    const run = start(vi.fn(async () => status("cancelled")));
    await vi.advanceTimersByTimeAsync(5000);
    expect(run.onEvent).toHaveBeenCalledTimes(1);
    expect(run.onEvent.mock.calls[0][0].data.status).toBe("cancelled");
    expect(streamHealingEvents).toHaveBeenCalledTimes(1);
  });
});
