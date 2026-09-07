import type { InspectionTask, runInspectionTask } from "./inspection-task";

/** Termination cancels CPU work immediately, including a single large geometry pair. */
export function inspectInWorker<T = ReturnType<typeof runInspectionTask>>(
  task: InspectionTask,
  signal: AbortSignal,
): Promise<T> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException("Cancelled", "AbortError"));
      return;
    }
    const worker = new Worker(new URL("./inspection.worker.ts", import.meta.url), {
      type: "module",
    });
    const cleanup = () => {
      signal.removeEventListener("abort", abort);
      worker.terminate();
    };
    const abort = () => {
      cleanup();
      reject(new DOMException("Cancelled", "AbortError"));
    };
    signal.addEventListener("abort", abort, { once: true });
    worker.onmessage = (event) => {
      cleanup();
      if (event.data.error) reject(new Error(event.data.error));
      else resolve(event.data.result as T);
    };
    worker.onerror = () => {
      cleanup();
      reject(new Error("Geometry worker failed"));
    };
    worker.onmessageerror = () => {
      cleanup();
      reject(new Error("Geometry worker response failed"));
    };
    try {
      worker.postMessage(task);
    } catch (error) {
      cleanup();
      reject(error);
    }
  });
}
