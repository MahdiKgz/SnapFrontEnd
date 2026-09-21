import { useEffect, useState } from "react";
import type { FormEvent } from "react";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import {
  useCreateArticleMutation,
  useDeleteArticleMutation,
  useGetArticleCategoriesQuery,
  useGetMyArticlesQuery,
  useLazyGetMyArticleQuery,
  useUpdateArticleMutation,
} from "@features/articles";
import type { ArticleDetail, ArticleInput, ArticleStatus } from "@features/articles";
import { FilePenLine, LoaderCircle, Pencil, Plus, Search, Trash2, X } from "lucide-react";

const emptyArticle: ArticleInput = {
  title: "",
  excerpt: "",
  content: "",
  coverImageUrl: "",
  category: "",
  keywords: [],
  status: "draft",
};
const messageOf = (error: unknown) => {
  if (error && typeof error === "object" && "data" in error) {
    const data = error.data;
    if (data && typeof data === "object" && "message" in data && typeof data.message === "string")
      return data.message;
  }
  return "انجام عملیات ممکن نشد.";
};
const formatDate = (value: string) =>
  new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );

function ArticleDialog({ article, onClose }: { article?: ArticleDetail; onClose: () => void }) {
  const [form, setForm] = useState<ArticleInput>(
    article ? { ...article, coverImageUrl: article.coverImageUrl ?? "" } : emptyArticle,
  );
  const [keywords, setKeywords] = useState(article?.keywords.join("، ") ?? "");
  const [error, setError] = useState("");
  const [create, creating] = useCreateArticleMutation();
  const [update, updating] = useUpdateArticleMutation();
  const { data: categories } = useGetArticleCategoriesQuery();
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    const body = {
      ...form,
      keywords: keywords
        .split(/[,،]/)
        .map((item) => item.trim())
        .filter(Boolean),
    };
    try {
      if (article) await update({ id: article.id, body }).unwrap();
      else await create(body).unwrap();
      onClose();
    } catch (reason) {
      setError(messageOf(reason));
    }
  };
  const busy = creating.isLoading || updating.isLoading;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="بستن پنجره"
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <form
        role="dialog"
        aria-modal="true"
        aria-label={article ? "ویرایش مقاله" : "مقاله جدید"}
        onSubmit={(event) => void submit(event)}
        className="relative z-10 max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl"
      >
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 px-5 py-4 backdrop-blur">
          <h2 className="font-bold">{article ? "ویرایش مقاله" : "مقاله جدید"}</h2>
          <Button type="button" size="icon" variant="ghost" aria-label="بستن" onClick={onClose}>
            <X />
          </Button>
        </header>
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          <label className="space-y-2 sm:col-span-2">
            <span className="text-xs font-semibold">عنوان</span>
            <Input
              aria-label="عنوان مقاله"
              required
              minLength={4}
              maxLength={180}
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold">دسته‌بندی</span>
            <Input
              aria-label="دسته‌بندی مقاله"
              required
              minLength={2}
              maxLength={80}
              list="article-categories"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
            <datalist id="article-categories">
              {categories?.data.map((item) => (
                <option key={item.name} value={item.name} />
              ))}
            </datalist>
          </label>
          <label className="space-y-2">
            <span className="text-xs font-semibold">وضعیت</span>
            <select
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value as ArticleStatus })}
            >
              <option value="draft">پیش‌نویس</option>
              <option value="published">منتشرشده</option>
            </select>
          </label>
          <label className="space-y-2 sm:col-span-2">
            <span className="text-xs font-semibold">خلاصه</span>
            <textarea
              aria-label="خلاصه مقاله"
              required
              minLength={20}
              maxLength={360}
              rows={3}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
            />
          </label>
          <label className="space-y-2 sm:col-span-2">
            <span className="text-xs font-semibold">متن مقاله</span>
            <textarea
              aria-label="متن مقاله"
              required
              minLength={50}
              rows={12}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm leading-7"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
          </label>
          <label className="space-y-2 sm:col-span-2">
            <span className="text-xs font-semibold">کلمات کلیدی</span>
            <Input
              aria-label="کلمات کلیدی مقاله"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="GIS، توپولوژی، نقشه"
            />
            <span className="block text-[11px] text-muted-foreground">
              هر کلمه را با ویرگول جدا کنید؛ این مقادیر برای فیلتر دقیق مقاله‌ها استفاده می‌شوند.
            </span>
          </label>
          <label className="space-y-2 sm:col-span-2">
            <span className="text-xs font-semibold">نشانی تصویر شاخص (اختیاری)</span>
            <Input
              dir="ltr"
              type="url"
              value={form.coverImageUrl}
              onChange={(e) => setForm({ ...form, coverImageUrl: e.target.value })}
            />
          </label>
          {error && (
            <p role="alert" className="sm:col-span-2 text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
        <footer className="sticky bottom-0 flex justify-end gap-2 border-t border-border bg-card/95 p-4 backdrop-blur">
          <Button type="button" variant="outline" onClick={onClose}>
            انصراف
          </Button>
          <Button type="submit" disabled={busy}>
            {busy && <LoaderCircle className="animate-spin" />}
            {article ? "ذخیره تغییرات" : "افزودن مقاله"}
          </Button>
        </footer>
      </form>
    </div>
  );
}

export default function WriterArticlesPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(0);
  const [limit, setLimit] = useState(10);
  const [dialog, setDialog] = useState<"new" | ArticleDetail | null>(null);
  const [actionError, setActionError] = useState("");
  const [loadArticle, loadingArticle] = useLazyGetMyArticleQuery();
  const [remove, removing] = useDeleteArticleMutation();
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(0);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);
  const query = useGetMyArticlesQuery({
    search,
    status,
    category,
    keyword: keyword.trim(),
    skip: page * limit,
    limit,
  });
  const items = query.data?.data.items ?? [];
  const pagination = query.data?.data.pagination;
  return (
    <div className="h-full overflow-hidden p-6 lg:p-8">
      <div className="mx-auto flex h-full max-w-7xl flex-col gap-5">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-primary">فضای نویسندگی</p>
            <h1 className="mt-1 text-2xl font-black">مدیریت مقالات</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              پیش‌نویس‌ها و مقالات منتشرشده خودتان را مدیریت کنید.
            </p>
          </div>
          <Button onClick={() => setDialog("new")}>
            <Plus />
            افزودن مقاله
          </Button>
        </header>
        {(actionError || query.isError) && (
          <p
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            {actionError || messageOf(query.error)}
          </p>
        )}
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="grid gap-3 border-b border-border p-4 md:grid-cols-4">
            <label className="relative md:col-span-2">
              <Search className="absolute right-3 top-2.5 size-4 text-muted-foreground" />
              <Input
                className="pr-9"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="جست‌وجوی سریع عنوان، خلاصه یا کلمه کلیدی"
              />
            </label>
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(0);
              }}
            >
              <option value="">همه وضعیت‌ها</option>
              <option value="draft">پیش‌نویس</option>
              <option value="published">منتشرشده</option>
            </select>
            <Input
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(0);
              }}
              placeholder="فیلتر کلمه کلیدی"
            />
          </div>
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <Input
              className="max-w-xs"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(0);
              }}
              placeholder="فیلتر دسته‌بندی"
            />
            <span className="text-xs text-muted-foreground">
              {pagination?.total.toLocaleString("fa-IR") ?? "۰"} مقاله
            </span>
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full min-w-[760px] text-right text-sm">
              <thead className="sticky top-0 z-10 bg-muted">
                <tr>
                  <th className="p-3">عنوان</th>
                  <th className="p-3">دسته‌بندی</th>
                  <th className="p-3">وضعیت</th>
                  <th className="p-3">آخرین تغییر</th>
                  <th className="p-3">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {items.map((article) => (
                  <tr key={article.id} className="border-b border-border/60">
                    <td className="p-3">
                      <p className="max-w-sm truncate font-semibold">{article.title}</p>
                      <p className="mt-1 max-w-sm truncate text-xs text-muted-foreground">
                        {article.keywords.join("، ") || "بدون کلمه کلیدی"}
                      </p>
                    </td>
                    <td className="p-3">{article.category}</td>
                    <td className="p-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${article.status === "published" ? "bg-primary/10 text-primary" : "bg-amber-500/10 text-amber-600"}`}
                      >
                        {article.status === "published" ? "منتشرشده" : "پیش‌نویس"}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {formatDate(article.updatedAt)}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="outline"
                          aria-label={`ویرایش ${article.title}`}
                          disabled={loadingArticle.isFetching}
                          onClick={async () => {
                            setActionError("");
                            try {
                              setDialog((await loadArticle(article.id).unwrap()).data);
                            } catch (error) {
                              setActionError(messageOf(error));
                            }
                          }}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          aria-label={`حذف ${article.title}`}
                          disabled={removing.isLoading}
                          onClick={async () => {
                            if (!window.confirm("این مقاله حذف شود؟")) return;
                            setActionError("");
                            try {
                              await remove(article.id).unwrap();
                            } catch (error) {
                              setActionError(messageOf(error));
                            }
                          }}
                        >
                          <Trash2 className="text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {query.isFetching && (
              <div className="flex justify-center p-8">
                <LoaderCircle className="animate-spin text-primary" />
              </div>
            )}
            {!query.isFetching && !items.length && (
              <div className="grid place-items-center gap-2 p-12 text-center text-muted-foreground">
                <FilePenLine className="size-9" />
                <p>مقاله‌ای با این فیلترها پیدا نشد.</p>
              </div>
            )}
          </div>
          <footer className="flex items-center justify-between border-t border-border p-3 text-xs">
            <label className="flex items-center gap-2">
              تعداد در صفحه
              <select
                className="rounded-md border border-input bg-background p-1"
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(0);
                }}
              >
                <option value={10}>۱۰</option>
                <option value={20}>۲۰</option>
                <option value={50}>۵۰</option>
              </select>
            </label>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page === 0}
                onClick={() => setPage((value) => value - 1)}
              >
                قبلی
              </Button>
              <span>صفحه {(page + 1).toLocaleString("fa-IR")}</span>
              <Button
                size="sm"
                variant="outline"
                disabled={!pagination?.hasMore}
                onClick={() => setPage((value) => value + 1)}
              >
                بعدی
              </Button>
            </div>
          </footer>
        </section>
      </div>
      {dialog &&
        (dialog === "new" ? (
          <ArticleDialog onClose={() => setDialog(null)} />
        ) : (
          <ArticleDialog article={dialog} onClose={() => setDialog(null)} />
        ))}
    </div>
  );
}
