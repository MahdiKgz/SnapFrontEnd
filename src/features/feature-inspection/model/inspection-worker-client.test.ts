import { afterEach, describe, expect, it, vi } from "vitest";

import type { InspectionTask } from "./inspection-task";
import { inspectInWorker } from "./inspection-worker-client";

const instances: FakeWorker[] = [];
class FakeWorker {
  constructor() {
    instances.push(this);
  }
  onmessage?: (event: { data: unknown }) => void;
  onerror?: () => void;
  onmessageerror?: () => void;
  postMessage = vi.fn();
  terminate = vi.fn();
}
const task: InspectionTask = {
  type: "summary",
  feature: { type: "Feature", properties: {}, geometry: { type: "Point", coordinates: [0, 0] } },
};
afterEach(() => {
  vi.unstubAllGlobals();
  instances.length = 0;
});
describe("inspection worker lifecycle", () => {
  it("terminates ongoing CPU work on cancellation and ignores late responses", async () => {
    vi.stubGlobal("Worker", FakeWorker);
    const controller = new AbortController();
    const promise = inspectInWorker(task, controller.signal);
    controller.abort();
    await expect(promise).rejects.toMatchObject({ name: "AbortError" });
    expect(instances[0].terminate).toHaveBeenCalledOnce();
  });
  it("terminates after success or failure and never falls back to the UI thread", async () => {
    vi.stubGlobal("Worker", FakeWorker);
    const promise = inspectInWorker(task, new AbortController().signal);
    instances[0].onmessage?.({ data: { result: 12 } });
    await expect(promise).resolves.toBe(12);
    expect(instances[0].terminate).toHaveBeenCalledOnce();
    const failed = inspectInWorker(task, new AbortController().signal);
    instances[1].onerror?.();
    await expect(failed).rejects.toThrow("Geometry worker failed");
    expect(instances[1].terminate).toHaveBeenCalledOnce();
  });
});
