import type { AppDispatch } from "@/app/store";

import { topologyApi } from "./topology-api";

export async function readHealingStatus(dispatch: AppDispatch, jobId: string, signal: AbortSignal) {
  if (signal.aborted) throw new DOMException("Cancelled", "AbortError");
  const request = dispatch(
    topologyApi.endpoints.getHealStatus.initiate(jobId, { forceRefetch: true, subscribe: false }),
  );
  const abort = () => request.abort();
  signal.addEventListener("abort", abort, { once: true });
  try {
    return (await request.unwrap()).data;
  } finally {
    signal.removeEventListener("abort", abort);
    request.unsubscribe();
  }
}
