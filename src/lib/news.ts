// News/blog articles
// Future: move to CMS or Supabase

export interface Article {
  slug: string
  title: string
  excerpt: string
  date: string
  author: string
  category: "event-recap" | "athlete-spotlight" | "announcement" | "international"
  image?: string
  content: string // simple HTML content
}

const articles: Article[] = [
  // Example article:
  // {
  //   slug: "soty-2025-recap",
  //   title: "SOTY Championship 2025 — Season Recap",
  //   excerpt: "A look back at an incredible year of competitive surfing in Barbados.",
  //   date: "2025-12-15",
  //   author: "BSA Media",
  //   category: "event-recap",
  //   image: "https://example.com/photo.jpg",
  //   content: "<p>The 2025 Surfer of the Year championship series...</p>",
  // },
]

const categoryLabels: Record<string, string> = {
  "event-recap": "Event Recap",
  "athlete-spotlight": "Athlete Spotlight",
  "announcement": "Announcement",
  "international": "International",
}

export function getAllArticles(): Article[] {
  return [...articles].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export function getArticle(slug: string): Article | null {
  return articles.find(a => a.slug === slug) || null
}

export function getCategoryLabel(category: string): string {
  return categoryLabels[category] || category
}

export function getLatestArticles(count: number = 3): Article[] {
  return getAllArticles().slice(0, count)
}
