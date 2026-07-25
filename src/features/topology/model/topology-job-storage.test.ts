// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";

import { getStoredTopologyJobId, storeTopologyJobId } from "./topology-job-storage";

describe("topology job storage", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("persists the latest dry-run job for the repair flow", () => {
    storeTopologyJobId("job-456");

    expect(getStoredTopologyJobId()).toBe("job-456");
  });
});
