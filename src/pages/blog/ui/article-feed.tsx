import { useEffect, useRef, useState } from "react";

import { Button } from "@/shared/ui/button";
import { useLazyListPublishedArticlesQuery } from "@features/articles";
import type { ArticleSummary } from "@features/articles";
import { Calendar, Layers, LoaderCircle, User } from "lucide-react";
import { Link } from "react-router-dom";

const formatDate = (value: string | null) =>
  value ? new Intl.DateTimeFormat("fa-IR", { dateStyle: "medium" }).format(new Date(value)) : "—";

export function ArticleFeed({
  search,
  category,
  keyword,
}: {
  search: string;
  category: string;
  keyword: string;
}) {
  const [items, setItems] = useState<ArticleSummary[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);
  const sentinel = useRef<HTMLDivElement>(null);
  const active = useRef(true);
  const [fetchArticles] = useLazyListPublishedArticlesQuery();

  useEffect(() => {
    active.current = true;
    void fetchArticles({ search, category, keyword, limit: 8 })
      .unwrap()
      .then((response) => {
        if (!active.current) return;
        setItems(response.data.items);
        setCursor(response.data.nextCursor);
        setHasMore(Boolean(response.data.nextCursor));
        setFailed(false);
      })
      .catch(() => {
        if (active.current) {
          setFailed(true);
          setHasMore(false);
        }
      })
      .finally(() => {
        if (active.current) setLoading(false);
      });
    return () => {
      active.current = false;
    };
  }, [category, fetchArticles, keyword, retry, search]);

  useEffect(() => {
    const node = sentinel.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || loading || !hasMore || !cursor) return;
        setLoading(true);
        void fetchArticles({ search, category, keyword, cursor, limit: 8 })
          .unwrap()
          .then((response) => {
            if (!active.current) return;
            setItems((existing) => [
              ...existing,
              ...response.data.items.filter((item) => !existing.some((old) => old.id === item.id)),
            ]);
            setCursor(response.data.nextCursor);
            setHasMore(Boolean(response.data.nextCursor));
          })
          .catch(() => {
            if (active.current) setFailed(true);
          })
          .finally(() => {
            if (active.current) setLoading(false);
          });
      },
      { rootMargin: "240px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [category, cursor, fetchArticles, hasMore, keyword, loading, search]);

  return (
    <main>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((article) => (
          <Link
            key={article.id}
            to={`/blog/${encodeURIComponent(article.slug)}`}
            className="group overflow-hidden rounded-xl border border-border/60 bg-card shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            <article>
              {article.coverImageUrl ? (
                <img
                  src={article.coverImageUrl}
                  alt=""
                  loading="lazy"
                  className="h-36 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="grid h-36 place-items-center bg-gradient-to-br from-primary/20 via-muted to-background">
                  <Layers className="size-9 text-primary/60" />
                </div>
              )}
              <div className="space-y-3 p-4">
                <span className="rounded-md bg-primary/10 px-2 py-1 text-[10px] font-semibold text-primary">
                  {article.category}
                </span>
                <h2 className="line-clamp-2 text-base font-bold leading-7 group-hover:text-primary">
                  {article.title}
                </h2>
                <p className="line-clamp-2 text-xs leading-6 text-muted-foreground">
                  {article.excerpt}
                </p>
                <div className="flex items-center justify-between border-t border-border/50 pt-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <User className="size-3" />
                    {article.author.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="size-3" />
                    {formatDate(article.publishedAt)}
                  </span>
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>
      {!loading && !items.length && !failed && (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          مقاله‌ای با این فیلترها پیدا نشد.
        </div>
      )}
      {failed && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-destructive/30 p-6 text-center text-sm text-destructive"
        >
          <p>دریافت مقاله‌ها ممکن نشد.</p>
          <Button
            className="mt-3"
            variant="outline"
            onClick={() => {
              setLoading(true);
              setFailed(false);
              setRetry((value) => value + 1);
            }}
          >
            تلاش دوباره
          </Button>
        </div>
      )}
      <div ref={sentinel} className="grid h-20 place-items-center" aria-live="polite">
        {loading && (
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin text-primary" />
            در حال دریافت مقاله‌ها...
          </span>
        )}
      </div>
    </main>
  );
}
