// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";

import { IssueDetails } from "./issue-details";

const { query, refetch } = vi.hoisted(() => ({ query: vi.fn(), refetch: vi.fn() }));
vi.mock("../api/topology-api", () => ({ useGetAnalysisIssuesQuery: query }));
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
it("does not fetch closed details, then requests the selected group and subsequent server pages", () => {
  query.mockReturnValue({
    currentData: { data: { items: [], total: 70, limit: 25, page: 1 } },
    isFetching: false,
  });
  render(<IssueDetails jobId="job" code="GAP" />);
  expect(query).toHaveBeenLastCalledWith({ jobId: "job", code: "GAP", page: 1 }, { skip: true });
  fireEvent.click(screen.getByRole("button", { name: "جزئیات خطاها" }));
  expect(query).toHaveBeenLastCalledWith({ jobId: "job", code: "GAP", page: 1 }, { skip: false });
  fireEvent.click(screen.getByRole("button", { name: "بعدی" }));
  expect(query).toHaveBeenLastCalledWith({ jobId: "job", code: "GAP", page: 2 }, { skip: false });
});
it("shows a retry action when details cannot be loaded", () => {
  query.mockReturnValue({ isError: true, refetch });
  render(<IssueDetails jobId="job" />);
  fireEvent.click(screen.getByRole("button", { name: "جزئیات خطاها" }));
  fireEvent.click(screen.getByRole("button", { name: "تلاش دوباره" }));
  expect(refetch).toHaveBeenCalledOnce();
});
