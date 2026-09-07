import { runInspectionTask } from "./inspection-task";
import type { InspectionTask } from "./inspection-task";

self.onmessage = (event: MessageEvent<InspectionTask>) => {
  try {
    self.postMessage({ result: runInspectionTask(event.data) });
  } catch {
    self.postMessage({ error: "Geometry calculation failed" });
  }
};
