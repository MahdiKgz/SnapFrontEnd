// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

class FakeChannel extends EventTarget {
  static instances: FakeChannel[] = [];
  name: string;
  postMessage = vi.fn();
  close = vi.fn();
  constructor(name: string) {
    super();
    this.name = name;
    FakeChannel.instances.push(this);
  }
  receive(data: unknown) {
    this.dispatchEvent(new MessageEvent("message", { data }));
  }
}

let dispose: Array<() => void> = [];

describe("theme synchronization", () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    document.documentElement.classList.remove("dark");
    FakeChannel.instances = [];
    vi.stubGlobal("BroadcastChannel", FakeChannel);
  });

  afterEach(() => {
    dispose.forEach((unsubscribe) => unsubscribe());
    dispose = [];
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("restores the saved theme and broadcasts local changes on one shared channel", async () => {
    localStorage.setItem("snapgis-theme", "dark");
    const { getTheme, setTheme, subscribeTheme } = await import("./theme-store");
    dispose.push(subscribeTheme(vi.fn()), subscribeTheme(vi.fn()));
    expect(getTheme()).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(FakeChannel.instances).toHaveLength(1);

    setTheme("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    expect(localStorage.getItem("snapgis-theme")).toBe("light");
    expect(FakeChannel.instances[0].postMessage).toHaveBeenCalledWith({
      type: "theme-change",
      theme: "light",
    });
  });

  it("applies valid messages from another tab without rebroadcasting them", async () => {
    const { getTheme, subscribeTheme } = await import("./theme-store");
    const onChange = vi.fn();
    dispose.push(subscribeTheme(onChange));
    const channel = FakeChannel.instances[0];
    channel.receive({ type: "theme-change", theme: "dark" });
    expect(getTheme()).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(localStorage.getItem("snapgis-theme")).toBe("dark");
    expect(onChange).toHaveBeenCalledOnce();
    expect(channel.postMessage).not.toHaveBeenCalled();

    for (const message of [
      null,
      "light",
      { type: "unrelated", theme: "light" },
      { type: "theme-change", theme: "invalid" },
    ]) {
      channel.receive(message);
    }
    expect(getTheme()).toBe("dark");
    expect(onChange).toHaveBeenCalledOnce();
  });

  it("uses storage events when BroadcastChannel is unavailable", async () => {
    vi.stubGlobal("BroadcastChannel", undefined);
    const { getTheme, subscribeTheme } = await import("./theme-store");
    dispose.push(subscribeTheme(vi.fn()));
    window.dispatchEvent(new StorageEvent("storage", { key: "snapgis-theme", newValue: "dark" }));
    expect(getTheme()).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("keeps switching and broadcasting when storage is blocked", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const { getTheme, setTheme, subscribeTheme } = await import("./theme-store");
    dispose.push(subscribeTheme(vi.fn()));
    expect(() => setTheme("dark")).not.toThrow();
    expect(getTheme()).toBe("dark");
    expect(FakeChannel.instances[0].postMessage).toHaveBeenCalledOnce();
  });

  it("closes the channel after the last subscriber leaves and reconnects on remount", async () => {
    const { getTheme, subscribeTheme } = await import("./theme-store");
    const first = subscribeTheme(vi.fn());
    const second = subscribeTheme(vi.fn());
    const channel = FakeChannel.instances[0];
    first();
    expect(channel.close).not.toHaveBeenCalled();
    second();
    expect(channel.close).toHaveBeenCalledOnce();
    channel.receive({ type: "theme-change", theme: "dark" });
    expect(getTheme()).toBe("light");
    dispose.push(subscribeTheme(vi.fn()));
    expect(FakeChannel.instances).toHaveLength(2);
  });
});
