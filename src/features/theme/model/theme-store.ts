export type Theme = "light" | "dark";

export const THEME_STORAGE_KEY = "snapgis-theme";
export const THEME_CHANNEL_NAME = "snapgis-theme";

const isTheme = (value: unknown): value is Theme => value === "light" || value === "dark";

function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (isTheme(stored)) return stored;
  } catch {
    // Keep theme switching available when browser storage is blocked.
  }
  return typeof document !== "undefined" && document.documentElement.classList.contains("dark")
    ? "dark"
    : "light";
}

let theme = readTheme();
let channel: BroadcastChannel | null = null;
const listeners = new Set<() => void>();

function applyTheme(nextTheme: Theme, persist: boolean) {
  document.documentElement.classList.toggle("dark", nextTheme === "dark");
  if (persist) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    } catch {
      // The current tab and BroadcastChannel can still update without storage.
    }
  }
  if (theme === nextTheme) return;
  theme = nextTheme;
  listeners.forEach((listener) => listener());
}

function receiveTheme(event: MessageEvent<unknown>) {
  const message = event.data;
  if (
    typeof message === "object" &&
    message !== null &&
    "type" in message &&
    message.type === "theme-change" &&
    "theme" in message &&
    isTheme(message.theme)
  ) {
    // Apply remote changes without broadcasting them again.
    applyTheme(message.theme, true);
  }
}

function receiveStoredTheme(event: StorageEvent) {
  if (event.key === THEME_STORAGE_KEY && isTheme(event.newValue)) {
    applyTheme(event.newValue, false);
  }
}

export const getTheme = () => theme;

export function setTheme(nextTheme: Theme) {
  applyTheme(nextTheme, true);
  try {
    channel?.postMessage({ type: "theme-change", theme: nextTheme });
  } catch {
    // Storage events provide a fallback if the channel is unavailable.
  }
}

export function subscribeTheme(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    window.addEventListener("storage", receiveStoredTheme);
    try {
      if (typeof BroadcastChannel !== "undefined") {
        channel = new BroadcastChannel(THEME_CHANNEL_NAME);
        channel.addEventListener("message", receiveTheme);
      }
    } catch {
      channel = null;
    }
    applyTheme(readTheme(), false);
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      window.removeEventListener("storage", receiveStoredTheme);
      channel?.removeEventListener("message", receiveTheme);
      channel?.close();
      channel = null;
    }
  };
}
