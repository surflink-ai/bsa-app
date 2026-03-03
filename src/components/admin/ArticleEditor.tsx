'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { useState, useCallback } from 'react'

interface ArticleEditorProps {
  initialContent?: string
  onChange: (html: string) => void
}

const btnBase: React.CSSProperties = {
  padding: '4px 8px',
  borderRadius: '3px',
  fontSize: '12px',
  fontWeight: 500,
  transition: 'all 150ms',
  border: 'none',
  cursor: 'pointer',
}

function MenuBar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null

  const btn = (active: boolean): React.CSSProperties => ({
    ...btnBase,
    backgroundColor: active ? '#0A2540' : 'transparent',
    color: active ? '#fff' : 'rgba(10,37,64,0.4)',
    border: active ? 'none' : '1px solid rgba(10,37,64,0.08)',
  })

  return (
    <div
      className="flex flex-wrap gap-1 p-3"
      style={{ borderBottom: '1px solid rgba(10,37,64,0.08)', backgroundColor: 'rgba(10,37,64,0.015)' }}
    >
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} style={btn(editor.isActive('bold'))}>
        <strong>B</strong>
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} style={btn(editor.isActive('italic'))}>
        <em>I</em>
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} style={btn(editor.isActive('strike'))}>
        <s>S</s>
      </button>
      <span style={{ width: 1, backgroundColor: 'rgba(10,37,64,0.06)', margin: '0 4px' }} />
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} style={btn(editor.isActive('heading', { level: 2 }))}>
        H2
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} style={btn(editor.isActive('heading', { level: 3 }))}>
        H3
      </button>
      <span style={{ width: 1, backgroundColor: 'rgba(10,37,64,0.06)', margin: '0 4px' }} />
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} style={btn(editor.isActive('bulletList'))}>
        List
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} style={btn(editor.isActive('orderedList'))}>
        Ordered
      </button>
      <span style={{ width: 1, backgroundColor: 'rgba(10,37,64,0.06)', margin: '0 4px' }} />
      <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} style={btn(editor.isActive('blockquote'))}>
        Quote
      </button>
      <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} style={btn(false)}>
        Rule
      </button>
      <span style={{ width: 1, backgroundColor: 'rgba(10,37,64,0.06)', margin: '0 4px' }} />
      <button type="button" onClick={() => {
        const url = window.prompt('Enter link URL:')
        if (url) editor.chain().focus().setLink({ href: url }).run()
      }} style={btn(editor.isActive('link'))}>
        Link
      </button>
      <button type="button" onClick={() => {
        const url = window.prompt('Enter image URL:')
        if (url) editor.chain().focus().setImage({ src: url }).run()
      }} style={btn(false)}>
        Image
      </button>
    </div>
  )
}

export function ArticleEditor({ initialContent = '', onChange }: ArticleEditorProps) {
  const [, setUpdateCount] = useState(0)

  const handleUpdate = useCallback(({ editor: ed }: { editor: { getHTML: () => string } }) => {
    onChange(ed.getHTML())
    setUpdateCount(c => c + 1)
  }, [onChange])

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({ openOnClick: false }),
    ],
    content: initialContent,
    onUpdate: handleUpdate,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none p-4 min-h-[300px] focus:outline-none',
        style: "font-family: 'DM Sans', sans-serif; font-size: 14px; color: #0A2540;",
      },
    },
  })

  return (
    <div style={{ border: '1px solid rgba(10,37,64,0.12)', borderRadius: '4px', overflow: 'hidden', backgroundColor: '#fff' }}>
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}
