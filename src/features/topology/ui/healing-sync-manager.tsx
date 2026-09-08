import { useEffect, useRef } from "react";

import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import { filesApi, useGetUserFilesQuery } from "@/features/files/api/files-api";
import { CheckCircle2, CircleX, Info, X } from "lucide-react";

import { readHealingStatus } from "../api/read-healing-status";
import { buildTopologyApiUrl, topologyApi } from "../api/topology-api";
import { watchHealingJob } from "../api/watch-healing-job";
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
    if (!data) return;
    let stopped = false;
    const trackPage = (page: typeof data.data) => {
      for (const file of page.items) {
        if (file.status === "queued" || file.status === "processing") {
          dispatch(trackHealingJob({ id: file.id, name: file.name, status: file.status }));
        }
      }
    };
    const discoverAllActiveJobs = async () => {
      let page = data.data;
      trackPage(page);
      while (!stopped && page.pagination.hasMore) {
        const next = await dispatch(
          filesApi.endpoints.getUserFiles.initiate(
            { skip: page.pagination.skip + page.items.length, limit: 50 },
            { forceRefetch: true, subscribe: false },
          ),
        ).unwrap();
        page = next.data;
        trackPage(page);
      }
    };
    void discoverAllActiveJobs().catch(() => undefined);
    return () => {
      stopped = true;
    };
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
      watchHealingJob({
        jobId,
        accessToken,
        lastEventId: job.lastEventId,
        signal: controller.signal,
        url: buildTopologyApiUrl(`/heal/${jobId}/events`),
        readStatus: (signal) => readHealingStatus(dispatch, jobId, signal),
        onEvent: (event) => {
          dispatch(
            receiveHealingEvent({ eventId: event.id, jobName: job.name, lifecycle: event.data }),
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
      });
    }
  }, [accessToken, dispatch, jobs]);

  useEffect(
    () => () => {
      for (const controller of connections.current.values()) controller.abort();
      connections.current.clear();
    },
    [accessToken],
  );

  return (
    <div className="pointer-events-none fixed inset-x-0 top-5 z-80 mx-auto flex w-[min(24rem,calc(100vw-2.5rem))] flex-col gap-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          role="status"
          className="pointer-events-auto flex items-center gap-3 rounded-xl border border-border bg-popover/95 px-4 py-3 text-sm text-popover-foreground shadow-2xl backdrop-blur"
        >
          {notification.kind === "completed" ? (
            <CheckCircle2 className="size-5 shrink-0 text-emerald-700 dark:text-emerald-400" />
          ) : notification.kind === "failed" ? (
            <CircleX className="size-5 shrink-0 text-destructive" />
          ) : (
            <Info className="size-5 shrink-0 text-amber-700 dark:text-amber-400" />
          )}
          <span className="min-w-0 flex-1">{notification.message}</span>
          <button
            type="button"
            aria-label="بستن اعلان"
            className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => dispatch(dismissHealingNotification(notification.id))}
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
