'use client'

import { PageHeader, DataTable, StatusDot, MetaText, TextLink } from '@/components/admin/ui'

interface Article {
  id: string; title: string; slug: string; category: string; categoryLabel: string
  published: boolean; published_at: string | null; created_at: string
}

export function ArticlesClient({ articles }: { articles: Article[] }) {
  return (
    <div>
      <PageHeader
        title="Articles"
        subtitle={`${articles.length} article${articles.length !== 1 ? 's' : ''}`}
        action={{ label: 'New Article', href: '/admin/articles/new' }}
      />
      <DataTable
        columns={[
          { key: 'title', label: 'Title', render: (r) => <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--admin-text)' }}>{r.title}</span> },
          { key: 'category', label: 'Category', render: (r) => <span style={{ fontSize: 12, color: 'var(--admin-text-secondary)' }}>{r.categoryLabel}</span> },
          { key: 'status', label: 'Status', render: (r) => <StatusDot status={r.published ? 'success' : 'warning'} label={r.published ? 'Published' : 'Draft'} /> },
          { key: 'date', label: 'Date', render: (r) => <MetaText>{new Date(r.published_at || r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</MetaText> },
          { key: 'actions', label: '', align: 'right', render: (r) => <TextLink href={`/admin/articles/${r.id}/edit`}>Edit</TextLink> },
        ]}
        rows={articles}
      />
    </div>
  )
}
