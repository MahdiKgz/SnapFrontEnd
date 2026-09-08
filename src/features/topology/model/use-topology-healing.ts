import { useCallback, useEffect, useRef, useState } from "react";

import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import type { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";

import { readHealingStatus } from "../api/read-healing-status";
import {
  buildTopologyApiUrl,
  topologyApi,
  useCancelHealingMutation,
  useHealTopologyMutation,
  useLazyGetHealedOutputQuery,
} from "../api/topology-api";
import { watchHealingJob } from "../api/watch-healing-job";
import { receiveHealingEvent, trackHealingJob } from "./healing-sync-slice";
import type { TopologyHealStatusData, TopologyUploadData } from "./types";

interface UseTopologyHealingOptions {
  data: TopologyUploadData;
  onHealingComplete: (
    output: FeatureCollection<Geometry, GeoJsonProperties>,
  ) => Promise<void> | void;
}

export function useTopologyHealing({ data, onHealingComplete }: UseTopologyHealingOptions) {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const dispatch = useAppDispatch();
  const [healTopology, healRequest] = useHealTopologyMutation();
  const [cancelHealingRequest, cancelRequest] = useCancelHealingMutation();
  const [loadHealedOutput, outputRequest] = useLazyGetHealedOutputQuery();
  const [isStreaming, setIsStreaming] = useState(false);
  const [lifecycle, setLifecycle] = useState<TopologyHealStatusData | null>(null);
  const [requestError, setRequestError] = useState(false);
  const [streamError, setStreamError] = useState(false);
  const [isOutputReady, setIsOutputReady] = useState(false);
  const [outputApplicationError, setOutputApplicationError] = useState(false);
  const loadedOutputJobId = useRef<string | null>(null);
  const lastEventId = useRef<string | null>(null);
  const completionCallback = useRef(onHealingComplete);
  const active = useRef(false);
  const appliedLifecycle = useRef<TopologyHealStatusData | null>(null);
  useEffect(() => {
    completionCallback.current = onHealingComplete;
  }, [onHealingComplete]);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);

  const applyLifecycle = useCallback(
    async (next: TopologyHealStatusData) => {
      if (!active.current) return;
      if (
        appliedLifecycle.current &&
        ["completed", "failed", "cancelled"].includes(appliedLifecycle.current.status) &&
        !["completed", "failed", "cancelled"].includes(next.status)
      )
        return;
      appliedLifecycle.current = next;
      setLifecycle(next);
      if (next.status === "failed" || next.status === "cancelled") {
        setIsStreaming(false);
        return;
      }
      if (next.status !== "completed") return;

      setIsStreaming(false);
      const previewPath = next.result?.output?.previewPath ?? next.links.output;
      if (loadedOutputJobId.current === next.jobId) return;
      loadedOutputJobId.current = next.jobId;
      setOutputApplicationError(false);
      try {
        const output = await loadHealedOutput(previewPath).unwrap();
        if (!active.current) return;
        await completionCallback.current(output);
        if (active.current) setIsOutputReady(true);
      } catch {
        if (!active.current) return;
        loadedOutputJobId.current = null;
        setOutputApplicationError(true);
      }
    },
    [loadHealedOutput],
  );

  useEffect(() => {
    // Keep the pending job tracked while authentication refreshes; resume with the new token.
    if (!isStreaming || !accessToken) return;

    const abortController = new AbortController();
    const cleanup = watchHealingJob({
      jobId: data.jobId,
      accessToken,
      lastEventId: lastEventId.current,
      signal: abortController.signal,
      url: buildTopologyApiUrl(`/heal/${data.jobId}/events`),
      readStatus: (signal) => readHealingStatus(dispatch, data.jobId, signal),
      onError: setStreamError,
      onEvent: (event) => {
        if (event.id) lastEventId.current = event.id;
        dispatch(
          receiveHealingEvent({ eventId: event.id, jobName: data.name, lifecycle: event.data }),
        );
        if (["completed", "failed", "cancelled"].includes(event.data.status)) {
          dispatch(
            topologyApi.util.invalidateTags([
              { type: "Files", id: data.jobId },
              { type: "Files", id: "LIST" },
              { type: "Files", id: "SUMMARY" },
            ]),
          );
        }
        void applyLifecycle(event.data);
      },
    });
    return () => {
      abortController.abort();
      cleanup();
    };
  }, [accessToken, applyLifecycle, data.jobId, data.name, dispatch, isStreaming]);

  const requestHealing = useCallback(async () => {
    setRequestError(false);
    setStreamError(false);
    setIsOutputReady(false);
    setOutputApplicationError(false);
    lastEventId.current = null;
    appliedLifecycle.current = null;
    loadedOutputJobId.current = null;
    try {
      const response = await healTopology(data.heal.path).unwrap();
      dispatch(
        trackHealingJob({
          id: data.jobId,
          name: data.name,
          status: response.data.status,
          restart: true,
        }),
      );
      await applyLifecycle(response.data);
      if (response.data.status === "queued" || response.data.status === "processing") {
        setIsStreaming(true);
      }
    } catch {
      setRequestError(true);
    }
  }, [applyLifecycle, data.heal.path, data.jobId, data.name, dispatch, healTopology]);

  const cancelHealing = useCallback(async () => {
    setRequestError(false);
    try {
      const response = await cancelHealingRequest(data.jobId).unwrap();
      await applyLifecycle(response.data);
      dispatch(
        receiveHealingEvent({
          eventId: null,
          jobName: data.name,
          lifecycle: response.data,
        }),
      );
    } catch {
      setRequestError(true);
    }
  }, [applyLifecycle, cancelHealingRequest, data.jobId, data.name, dispatch]);

  const downloadUrl = lifecycle?.result?.output?.downloadPath
    ? buildTopologyApiUrl(lifecycle.result.output.downloadPath)
    : null;

  return {
    cancelHealing,
    isCancelling: cancelRequest.isLoading,
    downloadUrl,
    isLoadingOutput: outputRequest.isFetching,
    isOutputReady,
    isStreaming,
    isRequesting: healRequest.isLoading,
    lifecycle,
    requestError,
    requestHealing,
    statusError: streamError || (isStreaming && !accessToken),
    outputError: outputRequest.isError || outputApplicationError,
  };
}
