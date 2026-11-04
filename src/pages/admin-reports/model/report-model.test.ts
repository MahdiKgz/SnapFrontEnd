import { describe, expect, it } from "vitest";

import {
  reportBuckets,
  reportBytes,
  reportRange,
  reportsCsv,
  validReportRange,
} from "./report-model";

const day = (date: string) => ({
  date,
  uploads: 3,
  completed: 1,
  failed: 1,
  identifiedIssues: 9,
  healedIssues: 4,
  bytes: 1024,
});

describe("system report presentation", () => {
  it("uses inclusive UTC ranges across month and year boundaries", () => {
    expect(reportRange(7, new Date("2026-01-03T22:00:00-03:00"))).toEqual({
      from: "2025-12-29",
      to: "2026-01-04",
    });
    expect(validReportRange({ from: "2024-01-01", to: "2024-12-31" })).toBe(true);
    expect(validReportRange({ from: "2024-01-01", to: "2025-01-01" })).toBe(false);
    for (const range of [
      { from: "", to: "2026-11-04" },
      { from: "2026-11-04", to: "2026-11-03" },
      { from: "2026-02-30", to: "2026-03-04" },
    ])
      expect(validReportRange(range)).toBe(false);
  });
  it("bounds chart columns while preserving every upload, repair and failed count", () => {
    const days = Array.from({ length: 90 }, (_, index) =>
      day(new Date(Date.UTC(2026, 0, index + 1)).toISOString().slice(0, 10)),
    );
    const buckets = reportBuckets(days);
    expect(buckets.length).toBe(30);
    expect(buckets[0]).toEqual({
      from: "2026-01-01",
      to: "2026-01-03",
      uploads: 9,
      failed: 3,
      healedIssues: 12,
    });
    expect(buckets.reduce((total, bucket) => total + bucket.uploads, 0)).toBe(270);
    expect(buckets.reduce((total, bucket) => total + bucket.healedIssues, 0)).toBe(360);
    expect(buckets.at(-1)?.to).toBe("2026-03-31");
    expect(reportBuckets([])).toEqual([]);
  });
  it("exports all daily values as UTF-8 ready CSV without rounding counts", () => {
    const csv = reportsCsv({ daily: [day("2026-11-04")] });
    expect(csv.split("\r\n")).toHaveLength(2);
    expect(csv.split("\r\n")[1]).toBe('"2026-11-04","3","1","1","9","4","1024"');
    expect(reportBytes(0)).toBe("۰ بایت");
    expect(reportBytes(1024)).toContain("کیلوبایت");
  });
});
