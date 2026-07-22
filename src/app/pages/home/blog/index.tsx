import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Layers,
  Search,
  Tag,
  User,
} from "lucide-react";

// دیتای موقت مقالات
const ARTICLES_DATA = [
  {
    id: 1,
    title: "بهینه‌سازی رندر لایه‌های سنگین GIS در MapLibre GL",
    excerpt:
      "چگونه هزاران عارضه مکانی و پلی‌گون را بدون افت فریم و کندی در مرورگر مدیریت و رندر کنیم؟",
    category: "توسعه فرانت‌اند",
    readTime: "۷ دقیقه",
    date: "۲۸ تیر ۱۴۰۵",
    author: "تیم فنی SnapGIS",
    image:
      "https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 2,
    title: "مفهوم توپولوژی و رایج‌ترین خطاهای هندسی در داده‌های مکانی",
    excerpt:
      "بررسی جامع خطاهای Self-Intersection، Gap و Overlap در لایه‌های وکتوری و نحوه رفع آن‌ها.",
    category: "مفاهیم GIS",
    readTime: "۱۰ دقیقه",
    date: "۲۲ تیر ۱۴۰۵",
    author: "کارشناس ژئوماتیک",
    image:
      "https://images.unsplash.com/photo-1569336415962-a4bd9f69cd83?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 3,
    title: "آموزش کار با فرمت GeoJSON و تبدیل آن به Shapefile",
    excerpt:
      "راهنمای عملی پارس کردن ساختارهای spatial و انتقال داده بین استاندارد‌های مختلف وب و دسکتاپ.",
    category: "آموزش کاربری",
    readTime: "۵ دقیقه",
    date: "۱۵ تیر ۱۴۰۵",
    author: "تیم پشتیبانی",
    image:
      "https://images.unsplash.com/photo-1508873696983-2df515122519?q=80&w=800&auto=format&fit=crop",
  },
  {
    id: 4,
    title: "آینده پردازش ابری داده‌های مکانی (Cloud-Native GIS)",
    excerpt:
      "نگاهی به معماری‌های مدرن زیرساخت داده‌های مکانی و نقش الگوریتم‌های خودکار در کنترل کیفیت.",
    category: "تکنولوژی",
    readTime: "۸ دقیقه",
    date: "۰۲ تیر ۱۴۰۵",
    author: "مدیر محصول",
    image:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=800&auto=format&fit=crop",
  },
];

const CATEGORIES = [
  { name: "همه مقالات", count: 12 },
  { name: "توسعه فرانت‌اند", count: 4 },
  { name: "مفاهیم GIS", count: 5 },
  { name: "آموزش کاربری", count: 2 },
  { name: "تکنولوژی", count: 1 },
];

function BlogPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("همه مقالات");
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <>
      <div className="min-h-screen bg-background text-foreground py-12 px-6">
        <div className="container mx-auto max-w-7xl">
          {/* سربرگ بخش وبلاگ */}
          <div className="flex flex-col gap-3 mb-12 text-right">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium w-fit">
              <Layers className="h-3.5 w-3.5" />
              مرکز دانش و یادگیری
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground">
              مقالات و پایگاه دانش <span className="text-primary">SnapGIS</span>
            </h1>
            <p className="text-muted-foreground text-base max-w-2xl font-light">
              آخرین رویکردها، آموزش‌های فنی و استراتژی‌های بهینه‌سازی پردازش داده‌های مکانی و
              توپولوژی.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
            {/* سایدبار فیلترها (سمت راست در حالت RTL) */}
            <aside className="lg:col-span-1 rounded-2xl border border-border/60 bg-card/40 p-6 backdrop-blur-md space-y-8 sticky top-24">
              {/* باکس جستجو */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Search className="h-4 w-4 text-primary" />
                  جستجو در مقالات
                </h3>
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="کلیدواژه مورد نظر..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-9 pl-3 h-10 text-xs border-border/80 bg-background/50 focus-visible:ring-primary/50"
                  />
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60" />
                </div>
              </div>

              {/* فیلتر دسته‌بندی‌ها */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Tag className="h-4 w-4 text-primary" />
                  دسته‌بندی موضوعی
                </h3>
                <div className="flex flex-col gap-1">
                  {CATEGORIES.map((cat, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedCategory(cat.name)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                        selectedCategory === cat.name
                          ? "bg-primary text-primary-foreground font-semibold shadow-[0_2px_10px_rgba(114,180,145,0.2)]"
                          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                      }`}
                    >
                      <span>{cat.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          selectedCategory === cat.name
                            ? "bg-primary-foreground/20 text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {cat.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* بنر کوچک پیشنهاد */}
              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 text-right space-y-2">
                <h4 className="text-xs font-bold text-primary">تولید محتوای تخصصی</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed font-light">
                  علاقه‌مند به اشتراک‌گذاری تجربیات GIS خود هستید؟ با تیم فنی ما در ارتباط باشید.
                </p>
              </div>
            </aside>

            {/* بخش اصلی: لیست کارت‌های مقاله و Pagination */}
            <main className="lg:col-span-3 space-y-10">
              {/* گرید کارت‌های مقاله */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {ARTICLES_DATA.map((article) => (
                  <article
                    key={article.id}
                    className="group relative rounded-2xl border border-border/60 bg-card/30 overflow-hidden backdrop-blur-md hover:border-primary/40 transition-all duration-300 flex flex-col justify-between shadow-sm hover:shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
                  >
                    {/* تصویر کاور مقاله */}
                    <div className="relative h-48 w-full overflow-hidden bg-muted">
                      <img
                        src={article.image}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-background/80 backdrop-blur-md border border-border/40 text-[11px] font-medium text-primary">
                        {article.category}
                      </div>
                    </div>

                    {/* محتوای متنی کارت */}
                    <div className="p-6 flex flex-col gap-3 flex-1 justify-between">
                      <div className="space-y-2">
                        <h2 className="text-lg font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                          {article.title}
                        </h2>
                        <p className="text-xs text-muted-foreground font-light leading-relaxed line-clamp-2">
                          {article.excerpt}
                        </p>
                      </div>

                      {/* متادیتای مقاله */}
                      <div className="pt-4 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground font-light">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-primary/70" />
                            {article.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-primary/70" />
                            {article.readTime}
                          </span>
                        </div>
                        <span className="flex items-center gap-1 font-medium text-foreground/80">
                          <User className="h-3.5 w-3.5 text-primary/70" />
                          {article.author}
                        </span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              {/* بخش صفحه‌بندی (Pagination) */}
              <div className="flex items-center justify-between pt-6 border-t border-border/40">
                <p className="text-xs text-muted-foreground font-light">نمایش ۱ تا ۴ از ۱۲ مقاله</p>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 border-border/80"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>

                  {[1, 2, 3].map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      className={`h-9 w-9 text-xs ${
                        currentPage === page
                          ? "shadow-[0_0_15px_rgba(114,180,145,0.2)]"
                          : "border-border/80"
                      }`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}

                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 border-border/80"
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </>
  );
}

export default BlogPage;
