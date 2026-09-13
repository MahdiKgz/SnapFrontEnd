export type ArticleStatus = "draft" | "published";

export interface ArticleSummary {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  coverImageUrl: string | null;
  category: string;
  keywords: string[];
  status: ArticleStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author: { id: string; name: string };
}

export interface ArticleDetail extends ArticleSummary {
  content: string;
}
export interface ArticleInput {
  title: string;
  excerpt: string;
  content: string;
  coverImageUrl: string;
  category: string;
  keywords: string[];
  status: ArticleStatus;
}
export type Envelope<T> = { success: boolean; data: T };
