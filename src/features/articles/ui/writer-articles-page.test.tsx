// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import WriterArticlesPage from "./writer-articles-page";

const { createArticle } = vi.hoisted(() => ({ createArticle: vi.fn() }));
vi.mock("../api/articles-api", () => ({
  useGetMyArticlesQuery: () => ({
    data: { data: { items: [], pagination: { total: 0, hasMore: false } } },
  }),
  useGetArticleCategoriesQuery: () => ({ data: { data: [{ name: "GIS", count: 1 }] } }),
  useCreateArticleMutation: () => [createArticle, { isLoading: false }],
  useUpdateArticleMutation: () => [vi.fn(), { isLoading: false }],
  useDeleteArticleMutation: () => [vi.fn(), { isLoading: false }],
  useLazyGetMyArticleQuery: () => [vi.fn(), { isFetching: false }],
}));

beforeEach(() => {
  createArticle.mockReset();
  createArticle.mockReturnValue({ unwrap: () => Promise.resolve({ data: {} }) });
});
afterEach(cleanup);

it("creates a draft with individually parsed keywords", async () => {
  render(<WriterArticlesPage />);
  fireEvent.click(screen.getByRole("button", { name: "افزودن مقاله" }));
  const dialog = within(screen.getByRole("dialog", { name: "مقاله جدید" }));
  fireEvent.change(dialog.getByRole("textbox", { name: "عنوان مقاله" }), {
    target: { value: "عنوان مقاله آزمایشی" },
  });
  fireEvent.change(dialog.getByRole("combobox", { name: "دسته‌بندی مقاله" }), {
    target: { value: "GIS" },
  });
  fireEvent.change(dialog.getByRole("textbox", { name: "خلاصه مقاله" }), {
    target: { value: "این خلاصه برای معرفی مقاله آزمایشی به خواننده نوشته شده است." },
  });
  fireEvent.change(dialog.getByRole("textbox", { name: "متن مقاله" }), {
    target: { value: "این متن کامل مقاله است و به اندازه کافی توضیح برای ثبت شدن در سامانه دارد." },
  });
  fireEvent.change(dialog.getByRole("textbox", { name: "کلمات کلیدی مقاله" }), {
    target: { value: "توپولوژی، GIS" },
  });
  fireEvent.submit(screen.getByRole("dialog", { name: "مقاله جدید" }));
  await vi.waitFor(() =>
    expect(createArticle).toHaveBeenCalledWith(
      expect.objectContaining({ status: "draft", keywords: ["توپولوژی", "GIS"] }),
    ),
  );
});
