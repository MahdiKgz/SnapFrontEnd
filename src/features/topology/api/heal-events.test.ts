import { afterEach, describe, expect, it, vi } from "vitest";

import { parseHealingSseBlock, streamHealingEvents } from "./heal-events";

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

afterEach(() => vi.unstubAllGlobals());
it("handles CRLF boundaries split between network chunks and a final event at EOF", async () => {
  const encoder = new TextEncoder();
  const chunks = [
    "event: progress\r",
    '\ndata: {"status":"processing","progress":40}\r',
    "\n\r",
    '\nevent: completed\r\ndata: {"status":"completed","progress":100}',
  ];
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(
          new ReadableStream({
            start(controller) {
              chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
              controller.close();
            },
          }),
        ),
    ),
  );
  const onEvent = vi.fn();
  await streamHealingEvents({
    accessToken: "token",
    url: "/events",
    signal: new AbortController().signal,
    onEvent,
  });
  expect(onEvent.mock.calls.map(([event]) => event.data.status)).toEqual([
    "processing",
    "completed",
  ]);
});
