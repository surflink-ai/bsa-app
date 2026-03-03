// News/blog articles — now fetched from Supabase
// This file provides backward-compatible functions using Supabase queries
// For server components, use src/lib/db/articles.ts directly

export interface Article {
  slug: string
  title: string
  excerpt: string
  date: string
  author: string
  category: "event-recap" | "athlete-spotlight" | "announcement" | "news" | "feature"
  content: string
  featured_image?: string
}

import { createClient } from '@/lib/supabase/server'

export async function getAllArticles(): Promise<Article[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('published', true)
    .order('published_at', { ascending: false })
  if (error || !data) return []
  return data.map(a => ({
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt || '',
    date: a.published_at || a.created_at,
    author: a.author_name,
    category: a.category,
    content: a.content,
    featured_image: a.featured_image || undefined,
  }))
}

export async function getArticle(slug: string): Promise<Article | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .single()
  if (error || !data) return null
  return {
    slug: data.slug,
    title: data.title,
    excerpt: data.excerpt || '',
    date: data.published_at || data.created_at,
    author: data.author_name,
    category: data.category,
    content: data.content,
    featured_image: data.featured_image || undefined,
  }
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    "event-recap": "Event Recap",
    "athlete-spotlight": "Athlete Spotlight",
    "announcement": "Announcement",
    "news": "News",
    "feature": "Feature",
  }
  return labels[category] || category
}

export async function getLatestArticles(count: number = 3): Promise<Article[]> {
  const articles = await getAllArticles()
  return articles.slice(0, count)
}
