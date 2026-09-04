import { useCallback, useEffect, useRef, useState } from "react";

import { useAppDispatch, useAppSelector } from "@/app/store/hooks";
import type { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";

import { streamHealingEvents } from "../api/heal-events";
import {
  buildTopologyApiUrl,
  useCancelHealingMutation,
  useHealTopologyMutation,
  useLazyGetHealedOutputQuery,
} from "../api/topology-api";
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

  const applyLifecycle = useCallback(
    async (next: TopologyHealStatusData) => {
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
        await onHealingComplete(output);
        setIsOutputReady(true);
      } catch {
        loadedOutputJobId.current = null;
        setOutputApplicationError(true);
      }
    },
    [loadHealedOutput, onHealingComplete],
  );

  useEffect(() => {
    if (!isStreaming) return;
    if (!accessToken) {
      setStreamError(true);
      setIsStreaming(false);
      return;
    }

    const abortController = new AbortController();
    let reconnectTimer: number | null = null;
    let stopped = false;

    const connect = async (): Promise<void> => {
      let terminalEventReceived = false;
      try {
        await streamHealingEvents({
          accessToken,
          lastEventId: lastEventId.current,
          onEvent: (event) => {
            if (event.id) lastEventId.current = event.id;
            setStreamError(false);
            terminalEventReceived = ["completed", "failed", "cancelled"].includes(
              event.data.status,
            );
            dispatch(
              receiveHealingEvent({
                eventId: event.id,
                jobName: data.name,
                lifecycle: event.data,
              }),
            );
            void applyLifecycle(event.data);
          },
          signal: abortController.signal,
          url: buildTopologyApiUrl(`/heal/${data.jobId}/events`),
        });
      } catch (error) {
        if (abortController.signal.aborted) return;
        setStreamError(true);
      }

      if (!stopped && !terminalEventReceived && !abortController.signal.aborted) {
        reconnectTimer = window.setTimeout(() => void connect(), 2_000);
      }
    };

    void connect();
    return () => {
      stopped = true;
      abortController.abort();
      if (reconnectTimer !== null) window.clearTimeout(reconnectTimer);
    };
  }, [accessToken, applyLifecycle, data.jobId, data.name, dispatch, isStreaming]);

  const requestHealing = useCallback(async () => {
    setRequestError(false);
    setStreamError(false);
    setIsOutputReady(false);
    setOutputApplicationError(false);
    lastEventId.current = null;
    try {
      const response = await healTopology(data.heal.path).unwrap();
      dispatch(trackHealingJob({ id: data.jobId, name: data.name, status: response.data.status }));
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
    statusError: streamError,
    outputError: outputRequest.isError || outputApplicationError,
  };
}
