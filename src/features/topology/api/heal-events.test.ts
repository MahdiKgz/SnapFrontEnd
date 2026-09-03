import { describe, expect, it } from "vitest";

import { parseHealingSseBlock } from "./heal-events";

describe("healing SSE parser", () => {
  it("ignores heartbeats and parses lifecycle events with their event id", () => {
    expect(parseHealingSseBlock(": heartbeat")).toBeNull();

    const event = parseHealingSseBlock(
      [
        "id: 7",
        "event: progress",
        'data: {"status":"processing","progress":60,"progressDetail":{"stage":"healing"}}',
      ].join("\n"),
    );

    expect(event).toEqual({
      id: "7",
      event: "progress",
      data: {
        status: "processing",
        progress: 60,
        progressDetail: { stage: "healing" },
      },
    });
  });

  it("drops malformed or unsupported server events", () => {
    expect(parseHealingSseBlock("event: stream-error\ndata: {}")).toBeNull();
    expect(parseHealingSseBlock("event: completed\ndata: not-json")).toBeNull();
  });
});
