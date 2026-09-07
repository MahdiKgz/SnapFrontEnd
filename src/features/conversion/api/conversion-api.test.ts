import { afterEach, describe, expect, it, vi } from "vitest";

import { CONVERSION_MAX_BYTES, validateConversion } from "../model/types";
import { readConversionResponse } from "./conversion-api";

afterEach(() => vi.restoreAllMocks());
describe("conversion responses", () => {
  it("downloads binary ZIP data without trying to parse it as GeoJSON", async () => {
    const report = { features: 2, sourceCRS: "EPSG:4326", targetCRS: "EPSG:32639", warnings: [] };
    const create = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");
    const response = new Response(new Uint8Array([80, 75, 3, 4]), {
      headers: {
        "Content-Disposition": 'attachment; filename="converted.zip"',
        "X-Conversion-Result": encodeURIComponent(JSON.stringify(report)),
      },
    });
    const result = await readConversionResponse(response);
    expect(result).toEqual({
      kind: "download",
      url: "blob:test",
      filename: "converted.zip",
      report,
    });
    expect(create.mock.calls[0][0]).toBeInstanceOf(Blob);
  });
  it("keeps 202 job receipts and JSON errors as JSON", async () => {
    for (const status of [202, 400, 401, 422, 503]) {
      const data = status === 202 ? { data: { jobId: "job" } } : { code: "INVALID_SOURCE_CRS" };
      expect(await readConversionResponse(new Response(JSON.stringify(data), { status }))).toEqual(
        data,
      );
    }
  });
  it("rejects corrupt success metadata before creating a download URL", async () => {
    await expect(readConversionResponse(new Response("bad"))).rejects.toThrow(
      "Invalid conversion report",
    );
  });
});
it("validates supported formats, size and explicit EPSG codes", () => {
  expect(validateConversion(null, "", "")).toBeTruthy();
  expect(validateConversion({ name: "a.dwg", size: 3 } as File, "", "")).toBeTruthy();
  expect(
    validateConversion({ name: "a.zip", size: CONVERSION_MAX_BYTES + 1 } as File, "", ""),
  ).toBeTruthy();
  expect(validateConversion({ name: "a.dxf", size: 5 } as File, "", "")).toBeTruthy();
  expect(validateConversion({ name: "a.dxf", size: 5 } as File, "EPSG:32639", "")).toBeNull();
  expect(validateConversion({ name: "a.geojson", size: 5 } as File, "", "EPSG:4326")).toBeNull();
});
