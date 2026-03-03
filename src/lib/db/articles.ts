import { createClient } from '@/lib/supabase/server'

export interface Article {
  id: string
  slug: string
  title: string
  excerpt: string | null
  content: string
  author_id: string | null
  author_name: string
  category: 'event-recap' | 'athlete-spotlight' | 'announcement' | 'news' | 'feature'
  featured_image: string | null
  published: boolean
  published_at: string | null
  scheduled_at: string | null
  created_at: string
  updated_at: string
}

export async function getPublishedArticles(limit?: number): Promise<Article[]> {
  const supabase = await createClient()
  let query = supabase
    .from('articles')
    .select('*')
    .eq('published', true)
    .order('published_at', { ascending: false })
  if (limit) query = query.limit(limit)
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .single()
  if (error) return null
  return data
}

export async function getArticleById(id: string): Promise<Article | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return data
}

export async function getAllArticlesAdmin(): Promise<Article[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createArticle(article: Omit<Article, 'id' | 'created_at' | 'updated_at'>): Promise<Article> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('articles')
    .insert(article)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateArticle(id: string, updates: Partial<Article>): Promise<Article> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('articles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteArticle(id: string): Promise<void> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('articles')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    'event-recap': 'Event Recap',
    'athlete-spotlight': 'Athlete Spotlight',
    'announcement': 'Announcement',
    'news': 'News',
    'feature': 'Feature',
  }
  return labels[category] || category
}

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
