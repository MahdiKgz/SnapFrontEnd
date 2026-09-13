// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import BlogPage from ".";

const { fetchArticles } = vi.hoisted(() => ({ fetchArticles: vi.fn() }));
vi.mock("@/features/articles/api/articles-api", () => ({
  useGetArticleCategoriesQuery: () => ({ data: { data: [{ name: "آموزش GIS", count: 1 }] } }),
  useLazyListPublishedArticlesQuery: () => [fetchArticles],
}));

const article = {
  id: "1",
  title: "کنترل توپولوژی در پروژه‌های واقعی",
  slug: "topology-1",
  excerpt: "خلاصه مقاله برای نمایش در کارت عمومی.",
  coverImageUrl: null,
  category: "آموزش GIS",
  keywords: ["توپولوژی"],
  status: "published",
  publishedAt: "2026-09-13T10:00:00.000Z",
  createdAt: "2026-09-13T10:00:00.000Z",
  updatedAt: "2026-09-13T10:00:00.000Z",
  author: { id: "writer", name: "نویسنده تست" },
};

describe("public article feed", () => {
  beforeEach(() => {
    fetchArticles.mockReset();
    fetchArticles.mockReturnValue({
      unwrap: () => Promise.resolve({ data: { items: [article], nextCursor: null } }),
    });
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        disconnect() {}
      },
    );
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("loads published articles using a shareable exact keyword filter", async () => {
    render(
      <MemoryRouter initialEntries={["/blog?keyword=توپولوژی"]}>
        <BlogPage />
      </MemoryRouter>,
    );
    expect(await screen.findByRole("heading", { name: article.title })).toBeTruthy();
    expect(fetchArticles).toHaveBeenCalledWith(
      expect.objectContaining({ keyword: "توپولوژی", limit: 8 }),
    );
    expect(
      screen.getByRole("link", { name: new RegExp(article.title) }).getAttribute("href"),
    ).toContain("/blog/topology-1");
    expect(screen.queryByText("همه مقاله‌ها نمایش داده شدند.")).toBeNull();
  });
});
