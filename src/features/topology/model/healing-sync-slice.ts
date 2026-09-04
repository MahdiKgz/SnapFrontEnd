import { type PayloadAction, createSlice } from "@reduxjs/toolkit";

import type { TopologyHealStatus, TopologyHealStatusData } from "./types";

export interface TrackedHealingJob {
  id: string;
  name: string;
  status: TopologyHealStatus;
  lastEventId: string | null;
}

export interface HealingNotification {
  id: string;
  jobId: string;
  kind: "completed" | "failed" | "cancelled";
  message: string;
}

interface HealingSyncState {
  jobs: Record<string, TrackedHealingJob>;
  notifications: HealingNotification[];
}

const initialState: HealingSyncState = { jobs: {}, notifications: [] };

const healingSyncSlice = createSlice({
  name: "healingSync",
  initialState,
  reducers: {
    trackHealingJob(
      state,
      action: PayloadAction<{ id: string; name?: string; status: TopologyHealStatus }>,
    ) {
      const current = state.jobs[action.payload.id];
      state.jobs[action.payload.id] = {
        id: action.payload.id,
        name: action.payload.name ?? current?.name ?? action.payload.id,
        status: action.payload.status,
        lastEventId: current?.lastEventId ?? null,
      };
    },
    receiveHealingEvent(
      state,
      action: PayloadAction<{
        eventId: string | null;
        jobName?: string;
        lifecycle: TopologyHealStatusData;
      }>,
    ) {
      const { eventId, jobName, lifecycle } = action.payload;
      const current = state.jobs[lifecycle.dryRunJobId] ?? state.jobs[lifecycle.jobId];
      const id = lifecycle.dryRunJobId || lifecycle.jobId;
      const wasTerminal =
        current?.status === "completed" ||
        current?.status === "failed" ||
        current?.status === "cancelled";
      state.jobs[id] = {
        id,
        name: jobName ?? current?.name ?? id,
        status: lifecycle.status,
        lastEventId: eventId ?? current?.lastEventId ?? null,
      };

      if (!wasTerminal && ["completed", "failed", "cancelled"].includes(lifecycle.status)) {
        const name = jobName ?? current?.name ?? "فایل";
        const kind = lifecycle.status as HealingNotification["kind"];
        const suffix =
          kind === "completed"
            ? "با موفقیت ترمیم شد."
            : kind === "cancelled"
              ? "لغو شد."
              : "با خطا متوقف شد.";
        state.notifications.push({
          id: `${id}:${eventId ?? lifecycle.status}`,
          jobId: id,
          kind,
          message: `${name} ${suffix}`,
        });
        state.notifications = state.notifications.slice(-4);
      }
    },
    dismissHealingNotification(state, action: PayloadAction<string>) {
      state.notifications = state.notifications.filter(({ id }) => id !== action.payload);
    },
    resetHealingSync: () => initialState,
  },
});

export const {
  dismissHealingNotification,
  receiveHealingEvent,
  resetHealingSync,
  trackHealingJob,
} = healingSyncSlice.actions;
export default healingSyncSlice.reducer;
