import { useCallback, useEffect, useRef, useState } from "react";

import type { FeatureCollection, GeoJsonProperties, Geometry } from "geojson";

import {
  buildTopologyApiUrl,
  useGetHealStatusQuery,
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
  const [healTopology, healRequest] = useHealTopologyMutation();
  const [loadHealedOutput, outputRequest] = useLazyGetHealedOutputQuery();
  const [isPolling, setIsPolling] = useState(false);
  const [lifecycle, setLifecycle] = useState<TopologyHealStatusData | null>(null);
  const [requestError, setRequestError] = useState(false);
  const [isOutputReady, setIsOutputReady] = useState(false);
  const [outputApplicationError, setOutputApplicationError] = useState(false);
  const loadedOutputJobId = useRef<string | null>(null);
  const statusQuery = useGetHealStatusQuery(data.jobId, {
    skip: !isPolling,
    pollingInterval: isPolling ? 1_000 : 0,
    refetchOnMountOrArgChange: true,
  });

  const applyLifecycle = useCallback(
    async (next: TopologyHealStatusData) => {
      setLifecycle(next);
      if (next.status === "failed") {
        setIsPolling(false);
        return;
      }
      if (next.status !== "completed") return;

      setIsPolling(false);
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
    if (!statusQuery.data?.data) return;
    void applyLifecycle(statusQuery.data.data);
  }, [applyLifecycle, statusQuery.data]);

  const requestHealing = useCallback(async () => {
    setRequestError(false);
    setIsOutputReady(false);
    setOutputApplicationError(false);
    try {
      const response = await healTopology(data.heal.path).unwrap();
      await applyLifecycle(response.data);
      if (response.data.status === "queued" || response.data.status === "processing") {
        setIsPolling(true);
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
    isPolling,
    isRequesting: healRequest.isLoading,
    lifecycle,
    requestError,
    requestHealing,
    statusError: statusQuery.isError,
    outputError: outputRequest.isError || outputApplicationError,
  };
}
