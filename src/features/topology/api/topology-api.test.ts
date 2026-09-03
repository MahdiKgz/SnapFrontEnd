import { describe, expect, it } from "vitest";

import { buildTopologyApiUrl, normalizeTopologyApiPath } from "./topology-api";

describe("topology API paths", () => {
  it("does not duplicate the API prefix returned by the backend", () => {
    expect(normalizeTopologyApiPath("/api/heal/job-1/output")).toBe("/heal/job-1/output");
    expect(buildTopologyApiUrl("/api/heal/job-1/download")).toBe(
      "http://localhost:3000/api/heal/job-1/download",
    );
  });

  it("keeps already-relative and absolute endpoints usable", () => {
    expect(normalizeTopologyApiPath("/heal/job-1")).toBe("/heal/job-1");
    expect(normalizeTopologyApiPath("https://files.example/output.geojson")).toBe(
      "https://files.example/output.geojson",
    );
  });
});
