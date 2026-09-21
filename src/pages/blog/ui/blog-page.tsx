import { useEffect, useState } from "react";

import { Input } from "@/shared/ui/input";
import { Layers, Search, Tag } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import { useGetArticleCategoriesQuery } from "@features/articles";

import { ArticleFeed } from "./article-feed";

export default function BlogPage() {
  const [params, setParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(params.get("category") ?? "");
  const [keyword, setKeyword] = useState(params.get("keyword") ?? "");
  const categories = useGetArticleCategoriesQuery();

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);
  useEffect(() => {
    const next = new URLSearchParams();
    if (category) next.set("category", category);
    if (keyword.trim()) next.set("keyword", keyword.trim());
    setParams(next, { replace: true });
  }, [category, keyword, setParams]);

  return (
    <div className="min-h-screen bg-background px-5 py-10 text-foreground">
      <div className="container mx-auto max-w-7xl">
        <header className="mb-8 space-y-3">
          <div className="flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs text-primary">
            <Layers className="size-3.5" />
            مرکز دانش و یادگیری
          </div>
          <h1 className="text-3xl font-black sm:text-4xl">
            مقالات و پایگاه دانش <span className="text-primary">SnapGIS</span>
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            آموزش‌ها و تجربه‌های تخصصی پردازش داده‌های مکانی و توپولوژی.
          </p>
        </header>
        <div className="grid items-start gap-6 lg:grid-cols-[230px_1fr]">
          <aside className="sticky top-20 space-y-5 rounded-2xl border border-border/60 bg-card/60 p-4">
            <div className="space-y-2">
              <span className="flex items-center gap-2 text-xs font-bold">
                <Search className="size-4 text-primary" />
                جست‌وجو
              </span>
              <div className="relative">
                <Search className="absolute right-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  className="pr-9 text-xs"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="عنوان یا کلمه کلیدی"
                />
              </div>
            </div>
            <div className="space-y-2">
              <span className="flex items-center gap-2 text-xs font-bold">
                <Tag className="size-4 text-primary" />
                دسته‌بندی
              </span>
              <button
                type="button"
                className={`flex w-full justify-between rounded-lg px-3 py-2 text-xs ${!category ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                onClick={() => setCategory("")}
              >
                <span>همه مقالات</span>
              </button>
              {categories.data?.data.map((item) => (
                <button
                  type="button"
                  key={item.name}
                  className={`flex w-full justify-between rounded-lg px-3 py-2 text-xs ${category === item.name ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                  onClick={() => setCategory(item.name)}
                >
                  <span>{item.name}</span>
                  <span>{item.count.toLocaleString("fa-IR")}</span>
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <span className="text-xs font-bold">کلمه کلیدی دقیق</span>
              <Input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                className="text-xs"
                placeholder="مثلاً توپولوژی"
              />
            </div>
          </aside>
          <ArticleFeed
            key={`${search}\u0000${category}\u0000${keyword}`}
            search={search}
            category={category}
            keyword={keyword.trim()}
          />
        </div>
      </div>
    </div>
  );
}
