import { useEffect, useRef } from "react";

import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { useGetUserFilesQuery } from "@/features/files";
import { CheckCircle2, CircleX, Info, X } from "lucide-react";

import { streamHealingEvents } from "../api/heal-events";
import { buildTopologyApiUrl, topologyApi } from "../api/topology-api";
import {
  dismissHealingNotification,
  receiveHealingEvent,
  trackHealingJob,
} from "../model/healing-sync-slice";

export function HealingSyncManager() {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const jobs = useAppSelector((state) => state.healingSync.jobs);
  const notifications = useAppSelector((state) => state.healingSync.notifications);
  const { data } = useGetUserFilesQuery({ skip: 0, limit: 50 }, { skip: !accessToken });
  const connections = useRef(new Map<string, AbortController>());

  useEffect(() => {
    for (const file of data?.data.items ?? []) {
      if (file.status === "queued" || file.status === "processing") {
        dispatch(trackHealingJob({ id: file.id, name: file.name, status: file.status }));
      }
    }
  }, [data, dispatch]);

  useEffect(() => {
    if (!accessToken) return;
    const activeIds = new Set(
      Object.values(jobs)
        .filter(({ status }) => status === "queued" || status === "processing")
        .map(({ id }) => id),
    );

    for (const [jobId, controller] of connections.current) {
      if (!activeIds.has(jobId)) {
        controller.abort();
        connections.current.delete(jobId);
      }
    }

    for (const jobId of activeIds) {
      if (connections.current.has(jobId)) continue;
      const controller = new AbortController();
      connections.current.set(jobId, controller);
      const job = jobs[jobId]!;
      let lastEventId = job.lastEventId;

      const connect = async (): Promise<void> => {
        try {
          await streamHealingEvents({
            accessToken,
            lastEventId,
            onEvent: (event) => {
              lastEventId = event.id ?? lastEventId;
              dispatch(
                receiveHealingEvent({
                  eventId: event.id,
                  jobName: job.name,
                  lifecycle: event.data,
                }),
              );
              if (["completed", "failed", "cancelled"].includes(event.data.status)) {
                dispatch(
                  topologyApi.util.invalidateTags([
                    { type: "Files", id: jobId },
                    { type: "Files", id: "LIST" },
                    { type: "Files", id: "SUMMARY" },
                  ]),
                );
              }
            },
            signal: controller.signal,
            url: buildTopologyApiUrl(`/heal/${jobId}/events`),
          });
        } catch {
          // A short reconnect loop handles transient proxy/network failures.
        }
        if (!controller.signal.aborted) {
          window.setTimeout(() => void connect(), 2_000);
        }
      };
      void connect();
    }
  }, [accessToken, dispatch, jobs]);

  useEffect(() => () => {
    for (const controller of connections.current.values()) controller.abort();
    connections.current.clear();
  });

  return (
    <div className="pointer-events-none fixed top-5 left-5 z-[80] flex w-[min(24rem,calc(100vw-2.5rem))] flex-col gap-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          role="status"
          className="pointer-events-auto flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-950/95 px-4 py-3 text-sm text-slate-100 shadow-2xl backdrop-blur"
        >
          {notification.kind === "completed" ? (
            <CheckCircle2 className="size-5 shrink-0 text-emerald-400" />
          ) : notification.kind === "failed" ? (
            <CircleX className="size-5 shrink-0 text-red-400" />
          ) : (
            <Info className="size-5 shrink-0 text-amber-400" />
          )}
          <span className="min-w-0 flex-1">{notification.message}</span>
          <button
            type="button"
            aria-label="بستن اعلان"
            className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            onClick={() => dispatch(dismissHealingNotification(notification.id))}
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
