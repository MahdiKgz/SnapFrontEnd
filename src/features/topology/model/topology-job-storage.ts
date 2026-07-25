const TOPOLOGY_JOB_STORAGE_KEY = "snapgis:last-topology-job-id";

export function storeTopologyJobId(jobId: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(TOPOLOGY_JOB_STORAGE_KEY, jobId);
}

export function getStoredTopologyJobId() {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(TOPOLOGY_JOB_STORAGE_KEY);
}
