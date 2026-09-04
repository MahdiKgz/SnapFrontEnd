import type { TopologyHealStatusData } from "../model/types";

export type HealingSseEventName = "snapshot" | "progress" | "completed" | "failed" | "cancelled";

export interface HealingSseEvent {
  id: string | null;
  event: HealingSseEventName;
  data: TopologyHealStatusData;
}

const EVENT_NAMES = new Set<HealingSseEventName>([
  "snapshot",
  "progress",
  "completed",
  "failed",
  "cancelled",
]);

export const parseHealingSseBlock = (block: string): HealingSseEvent | null => {
  const lines = block.split(/\r?\n/);
  let id: string | null = null;
  let event = "message";
  const dataLines: string[] = [];

  for (const line of lines) {
    if (!line || line.startsWith(":")) continue;
    const separator = line.indexOf(":");
    const field = separator === -1 ? line : line.slice(0, separator);
    const rawValue = separator === -1 ? "" : line.slice(separator + 1);
    const value = rawValue.startsWith(" ") ? rawValue.slice(1) : rawValue;
    if (field === "id") id = value;
    if (field === "event") event = value;
    if (field === "data") dataLines.push(value);
  }

  if (!EVENT_NAMES.has(event as HealingSseEventName) || dataLines.length === 0) {
    return null;
  }

  let data: TopologyHealStatusData;
  try {
    data = JSON.parse(dataLines.join("\n")) as TopologyHealStatusData;
  } catch {
    return null;
  }
  if (!data || typeof data !== "object" || typeof data.status !== "string") {
    return null;
  }
  return { id, event: event as HealingSseEventName, data };
};

interface StreamHealingEventsOptions {
  accessToken: string;
  lastEventId?: string | null;
  onEvent: (event: HealingSseEvent) => void;
  signal: AbortSignal;
  url: string;
}

export const streamHealingEvents = async ({
  accessToken,
  lastEventId,
  onEvent,
  signal,
  url,
}: StreamHealingEventsOptions): Promise<void> => {
  const response = await fetch(url, {
    headers: {
      Accept: "text/event-stream",
      Authorization: `Bearer ${accessToken}`,
      ...(lastEventId ? { "Last-Event-ID": lastEventId } : {}),
    },
    signal,
  });
  if (!response.ok || !response.body) {
    throw new Error(`Healing event stream failed with status ${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (!signal.aborted) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done }).replace(/\r\n/g, "\n");
    let boundary = buffer.indexOf("\n\n");
    while (boundary !== -1) {
      const block = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const event = parseHealingSseBlock(block);
      if (event) onEvent(event);
      boundary = buffer.indexOf("\n\n");
    }
    if (done) break;
  }
};
