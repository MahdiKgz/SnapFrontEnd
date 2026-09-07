// @vitest-environment jsdom
import type { FormEvent } from "react";

import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useTopologyUpload } from "./use-topology-upload";

const { upload, unwrap, storeJob } = vi.hoisted(() => ({
  upload: vi.fn(),
  unwrap: vi.fn(),
  storeJob: vi.fn(),
}));
vi.mock("../api/topology-api", () => ({
  useUploadTopologyMutation: () => [upload, { isError: false, isLoading: false, reset: vi.fn() }],
}));
vi.mock("./topology-job-storage", () => ({ storeTopologyJobId: storeJob }));

function setup(filename = "parcels.geojson") {
  const onAnalysisComplete = vi.fn();
  const file = new File(["This file must only be parsed on the server"], filename);
  const readText = vi.fn(() => {
    throw new Error("Local parsing is forbidden");
  });
  const readBuffer = vi.fn(() => {
    throw new Error("Local parsing is forbidden");
  });
  Object.defineProperties(file, { text: { value: readText }, arrayBuffer: { value: readBuffer } });
  const hook = renderHook(() =>
    useTopologyUpload({
      clearPreviewError: vi.fn(),
      removePreview: vi.fn(),
      onAnalysisReset: vi.fn(),
      onAnalysisComplete,
    }),
  );
  act(() => {
    hook.result.current.changeName("قطعات");
    hook.result.current.changeTolerance("25");
    hook.result.current.selectFile(file);
  });
  const submit = () =>
    hook.result.current.submit({
      preventDefault: vi.fn(),
    } as unknown as FormEvent<HTMLFormElement>);
  return { ...hook, file, readText, readBuffer, onAnalysisComplete, submit };
}

describe("server-only topology upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    upload.mockReturnValue({ unwrap });
  });
  afterEach(cleanup);

  it("waits for the server and passes only its returned analysis to the map", async () => {
    const data = {
      jobId: "server-job",
      report: { affectedFeatureCollection: { type: "FeatureCollection", features: [] } },
    };
    let resolve!: (value: unknown) => void;
    unwrap.mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const hook = setup();
    let pending!: Promise<void>;
    act(() => {
      pending = hook.submit();
    });
    expect(upload).toHaveBeenCalledOnce();
    expect(upload.mock.calls[0][0].get("file")).toMatchObject({
      name: hook.file.name,
      size: hook.file.size,
    });
    expect(hook.onAnalysisComplete).not.toHaveBeenCalled();
    await act(async () => {
      resolve({ data });
      await pending;
    });
    expect(hook.onAnalysisComplete).toHaveBeenCalledExactlyOnceWith(data);
    expect(storeJob).toHaveBeenCalledWith("server-job");
    expect(hook.readText).not.toHaveBeenCalled();
    expect(hook.readBuffer).not.toHaveBeenCalled();
  });

  it("does not publish geometry or remember a job when upload fails", async () => {
    unwrap.mockRejectedValue({ status: 422 });
    const hook = setup();
    await act(async () => {
      await hook.submit();
    });
    expect(hook.onAnalysisComplete).not.toHaveBeenCalled();
    expect(storeJob).not.toHaveBeenCalled();
    expect(hook.readText).not.toHaveBeenCalled();
    expect(hook.readBuffer).not.toHaveBeenCalled();
  });

  it.each(["parcels.SHP", "parcels.ZIP"])("sends %s intact to the server", async (filename) => {
    unwrap.mockResolvedValue({ data: { jobId: "shape-job" } });
    const hook = setup(filename);
    expect(hook.result.current.fileError).toBe("");
    await act(async () => {
      await hook.submit();
    });
    expect(upload.mock.calls[0][0].get("file")).toMatchObject({
      name: hook.file.name,
      size: hook.file.size,
    });
    expect(hook.readBuffer).not.toHaveBeenCalled();
  });

  it("rejects a format the backend cannot yet convert", async () => {
    const hook = setup("parcels.txt");
    expect(hook.result.current.fileError).not.toBe("");
    await act(async () => {
      await hook.submit();
    });
    expect(upload).not.toHaveBeenCalled();
  });
  it.each(["drawing.DWG", "drawing.DGN"])(
    "uploads %s with an explicit source CRS",
    async (filename) => {
      const hook = setup(filename);
      await act(async () => {
        await hook.submit();
      });
      expect(upload).not.toHaveBeenCalled();
      expect(hook.result.current.validationError).toContain("EPSG");
      act(() => hook.result.current.changeSourceCrs("EPSG:32639"));
      unwrap.mockResolvedValue({ data: { jobId: "cad-job" } });
      await act(async () => {
        await hook.submit();
      });
      expect(upload.mock.calls[0][0].get("sourceCrs")).toBe("EPSG:32639");
      expect(upload.mock.calls[0][0].get("file").name).toBe(filename);
      expect(hook.readBuffer).not.toHaveBeenCalled();
      expect(hook.readText).not.toHaveBeenCalled();
    },
  );
});
