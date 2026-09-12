// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";

import { CadImportNotice } from "./cad-import-notice";

afterEach(cleanup);
it("shows partial-import scope and missing block details, without calling diagnostic counts lost-feature counts", () => {
  render(
    <CadImportNotice
      report={{
        sourceCrs: "EPSG:32639",
        targetCrs: "EPSG:4326",
        partial: true,
        warnings: [
          {
            code: "CAD_MISSING_BLOCK",
            message: "Block *X does not exist; its contents could not be imported.",
            occurrences: 3,
          },
          {
            code: "CAD_POLYGON_FALLBACK",
            message:
              "Some polygon boundaries were read using a geometry fallback; review their topology.",
            occurrences: 9,
          },
        ],
      }}
    />,
  );
  expect(screen.getByText("بخشی از محتوای CAD خوانده نشده")).toBeTruthy();
  expect(screen.getByText(/نتایج تحلیل و ترمیم فقط مربوط به عارضه‌های خوانده‌شده/)).toBeTruthy();
  fireEvent.click(screen.getByText("جزئیات هشدارها"));
  expect(
    screen
      .getByText(/Block \*X/)
      .closest("ul")
      ?.getAttribute("dir"),
  ).toBe("ltr");
});
it("does not label polygon fallback alone as missing content", () => {
  render(
    <CadImportNotice
      report={{
        sourceCrs: "EPSG:32639",
        targetCrs: "EPSG:4326",
        partial: false,
        warnings: [{ code: "CAD_POLYGON_FALLBACK", message: "Fallback", occurrences: 1 }],
      }}
    />,
  );
  expect(screen.getByText("فایل CAD با هشدار خوانده شد")).toBeTruthy();
  expect(screen.queryByText("بخشی از محتوای CAD خوانده نشده")).toBeNull();
});
it("shows no notice for existing reports without CAD diagnostics", () => {
  const { container } = render(<CadImportNotice />);
  expect(container.childElementCount).toBe(0);
});
