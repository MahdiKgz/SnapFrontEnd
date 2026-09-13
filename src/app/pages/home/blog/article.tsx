import { useGetPublishedArticleQuery } from "@/features/articles/api/articles-api";
import { Calendar, LoaderCircle, Tag, User } from "lucide-react";
import { Link, useParams } from "react-router-dom";

export default function ArticlePage() {
  const { slug = "" } = useParams();
  const query = useGetPublishedArticleQuery(slug);
  if (query.isLoading)
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <LoaderCircle className="animate-spin text-primary" />
      </div>
    );
  if (!query.data?.data)
    return (
      <div className="grid min-h-[60vh] place-items-center text-center">
        <div>
          <p className="text-lg font-bold">مقاله پیدا نشد</p>
          <Link className="mt-3 inline-block text-sm text-primary" to="/blog">
            بازگشت به مقالات
          </Link>
        </div>
      </div>
    );
  const article = query.data.data;
  return (
    <article className="mx-auto min-h-screen max-w-4xl px-5 py-10">
      <Link to="/blog" className="text-sm text-primary">
        بازگشت به مقالات
      </Link>
      {article.coverImageUrl && (
        <img
          src={article.coverImageUrl}
          alt=""
          className="mt-6 max-h-[28rem] w-full rounded-2xl object-cover"
        />
      )}
      <div className="mt-7 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="rounded-md bg-primary/10 px-2 py-1 text-primary">{article.category}</span>
        <span className="flex items-center gap-1">
          <User className="size-3.5" />
          {article.author.name}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="size-3.5" />
          {article.publishedAt &&
            new Intl.DateTimeFormat("fa-IR", { dateStyle: "long" }).format(
              new Date(article.publishedAt),
            )}
        </span>
      </div>
      <h1 className="mt-5 text-3xl font-black leading-tight sm:text-5xl">{article.title}</h1>
      <p className="mt-5 text-base leading-8 text-muted-foreground">{article.excerpt}</p>
      <div className="my-8 h-px bg-border" />
      <div className="whitespace-pre-wrap text-sm leading-9 sm:text-base">{article.content}</div>
      {article.keywords.length > 0 && (
        <footer className="mt-10 flex flex-wrap items-center gap-2 border-t border-border pt-6">
          <Tag className="size-4 text-primary" />
          {article.keywords.map((keyword) => (
            <Link
              key={keyword}
              to={`/blog?keyword=${encodeURIComponent(keyword)}`}
              className="rounded-full bg-muted px-3 py-1 text-xs"
            >
              {keyword}
            </Link>
          ))}
        </footer>
      )}
    </article>
  );
}
