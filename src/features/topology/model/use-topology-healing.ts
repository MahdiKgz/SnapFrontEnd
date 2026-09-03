import { useCallback, useEffect, useRef, useState } from "react";

import { useAppSelector } from "@/app/store/hooks";
import type { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";

import { streamHealingEvents } from "../api/heal-events";
import {
  buildTopologyApiUrl,
  useHealTopologyMutation,
  useLazyGetHealedOutputQuery,
} from "../api/topology-api";
import type { TopologyHealStatusData, TopologyUploadData } from "./types";

interface UseTopologyHealingOptions {
  data: TopologyUploadData;
  onHealingComplete: (
    output: FeatureCollection<Geometry, GeoJsonProperties>,
  ) => Promise<void> | void;
}

export function useTopologyHealing({ data, onHealingComplete }: UseTopologyHealingOptions) {
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const [healTopology, healRequest] = useHealTopologyMutation();
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
      if (next.status === "failed") {
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
            terminalEventReceived =
              event.data.status === "completed" || event.data.status === "failed";
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
  }, [accessToken, applyLifecycle, data.jobId, isStreaming]);

  const requestHealing = useCallback(async () => {
    setRequestError(false);
    setStreamError(false);
    setIsOutputReady(false);
    setOutputApplicationError(false);
    lastEventId.current = null;
    try {
      const response = await healTopology(data.heal.path).unwrap();
      await applyLifecycle(response.data);
      if (response.data.status === "queued" || response.data.status === "processing") {
        setIsStreaming(true);
      }
    } catch {
      setRequestError(true);
    }
  }, [applyLifecycle, data.heal.path, healTopology]);

  const downloadUrl = lifecycle?.result?.output?.downloadPath
    ? buildTopologyApiUrl(lifecycle.result.output.downloadPath)
    : null;

  return {
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
