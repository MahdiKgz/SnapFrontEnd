import type { TopologyHealStatusData } from "../model/types";
import { streamHealingEvents } from "./heal-events";
import type { HealingSseEvent } from "./heal-events";

const terminal = (status: string) => ["completed", "failed", "cancelled"].includes(status);
export const HEALING_RECONCILE_INTERVAL = 5_000;

/** SSE supplies live progress; periodic authoritative snapshots recover missed terminal events. */
export function watchHealingJob(options: {
  jobId: string;
  accessToken: string;
  url: string;
  lastEventId?: string | null;
  signal: AbortSignal;
  readStatus: (signal: AbortSignal) => Promise<TopologyHealStatusData>;
  onEvent: (event: HealingSseEvent) => void;
  onError?: (failed: boolean) => void;
}) {
  const connection = new AbortController();
  let stopped = false,
    streamFailed = false,
    revision = 0;
  let latest: TopologyHealStatusData | null = null;
  let lastEventId = options.lastEventId;
  let pollTimer: ReturnType<typeof setTimeout> | undefined;
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined;
  let poll: AbortController | null = null;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    clearTimeout(pollTimer);
    clearTimeout(reconnectTimer);
    connection.abort();
    poll?.abort();
    options.signal.removeEventListener("abort", stop);
    window.removeEventListener("online", resume);
    window.removeEventListener("focus", resume);
    document.removeEventListener("visibilitychange", visibility);
  };
  const accept = (event: HealingSseEvent, startRevision?: number) => {
    if (stopped || (event.data.dryRunJobId || event.data.jobId) !== options.jobId) return;
    // A late snapshot must not undo fresher progress. A terminal snapshot always wins.
    if (!terminal(event.data.status) && startRevision !== undefined && startRevision !== revision)
      return;
    if (latest && !terminal(event.data.status)) {
      if (latest.status === "processing" && event.data.status === "queued") return;
      if (event.data.status === latest.status && event.data.progress < latest.progress) return;
    }
    latest = event.data;
    revision++;
    if (event.id) lastEventId = event.id;
    options.onError?.(false);
    if (terminal(event.data.status)) stop();
    options.onEvent(event);
  };
  const reconcile = async () => {
    if (stopped) return;
    const controller = new AbortController();
    poll = controller;
    const startedAt = revision;
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
      const data = await options.readStatus(controller.signal);
      accept({ id: null, event: "snapshot", data }, startedAt);
    } catch {
      if (!stopped && streamFailed) options.onError?.(true);
    } finally {
      clearTimeout(timeout);
      if (poll === controller) poll = null;
      if (!stopped) pollTimer = setTimeout(() => void reconcile(), HEALING_RECONCILE_INTERVAL);
    }
  };
  const connect = async () => {
    try {
      await streamHealingEvents({
        accessToken: options.accessToken,
        lastEventId,
        signal: connection.signal,
        url: options.url,
        onEvent: (event) => {
          streamFailed = false;
          accept(event);
        },
      });
    } catch {
      streamFailed = true;
    }
    if (!stopped) reconnectTimer = setTimeout(() => void connect(), 2_000);
  };
  const resume = () => {
    if (!stopped && !poll) {
      clearTimeout(pollTimer);
      void reconcile();
    }
  };
  const visibility = () => {
    if (document.visibilityState === "visible") resume();
  };
  if (options.signal.aborted) return stop;
  options.signal.addEventListener("abort", stop, { once: true });
  window.addEventListener("online", resume);
  window.addEventListener("focus", resume);
  document.addEventListener("visibilitychange", visibility);
  void connect();
  void reconcile();
  return stop;
}
