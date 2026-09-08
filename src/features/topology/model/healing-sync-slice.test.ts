import { describe, expect, it } from "vitest";

import reducer, {
  dismissHealingNotification,
  receiveHealingEvent,
  trackHealingJob,
} from "./healing-sync-slice";
import type { TopologyHealStatusData } from "./types";

const lifecycle = (status: TopologyHealStatusData["status"]): TopologyHealStatusData => ({
  jobId: "job-1",
  dryRunJobId: "job-1",
  status,
  progress: status === "completed" ? 100 : 50,
  queuedAt: null,
  startedAt: null,
  completedAt: null,
  failedAt: null,
  error: null,
  progressDetail: null,
  result: null,
  links: {
    status: "/heal/job-1",
    original: "/heal/job-1/original",
    output: "/heal/job-1/output",
    download: "/heal/job-1/download",
    cancel: "/heal/job-1/cancel",
  },
});

describe("healing sync state", () => {
  it("retains replay position and emits only one terminal notification", () => {
    let state = reducer(
      undefined,
      trackHealingJob({ id: "job-1", name: "Parcels", status: "processing" }),
    );
    state = reducer(
      state,
      receiveHealingEvent({ eventId: "8", jobName: "Parcels", lifecycle: lifecycle("completed") }),
    );
    state = reducer(
      state,
      receiveHealingEvent({ eventId: "8", jobName: "Parcels", lifecycle: lifecycle("completed") }),
    );

    expect(state.jobs["job-1"]?.lastEventId).toBe("8");
    expect(state.notifications).toHaveLength(1);
    expect(state.notifications[0]?.message).toContain("Parcels");

    state = reducer(state, dismissHealingNotification(state.notifications[0]!.id));
    expect(state.notifications).toHaveLength(0);
  });
  it("ignores stale processing events and file-list discovery after completion, but allows explicit retry", () => {
    let state = reducer(
      undefined,
      receiveHealingEvent({ eventId: "9", lifecycle: lifecycle("completed") }),
    );
    state = reducer(
      state,
      receiveHealingEvent({ eventId: "8", lifecycle: lifecycle("processing") }),
    );
    state = reducer(state, trackHealingJob({ id: "job-1", status: "processing" }));
    expect(state.jobs["job-1"].status).toBe("completed");
    expect(state.notifications).toHaveLength(1);
    state = reducer(state, trackHealingJob({ id: "job-1", status: "queued", restart: true }));
    expect(state.jobs["job-1"].status).toBe("queued");
  });
});
