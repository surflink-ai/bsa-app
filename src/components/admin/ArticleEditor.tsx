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

function MenuBar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null

  const btnClass = (active: boolean) =>
    `px-2 py-1 rounded text-xs font-medium transition-colors ${
      active ? 'bg-[#0A2540] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`

  return (
    <div className="flex flex-wrap gap-1 p-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
      <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive('bold'))}>
        <strong>B</strong>
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive('italic'))}>
        <em>I</em>
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={btnClass(editor.isActive('strike'))}>
        <s>S</s>
      </button>
      <span className="w-px bg-gray-200 mx-1" />
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnClass(editor.isActive('heading', { level: 2 }))}>
        H2
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btnClass(editor.isActive('heading', { level: 3 }))}>
        H3
      </button>
      <span className="w-px bg-gray-200 mx-1" />
      <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive('bulletList'))}>
        • List
      </button>
      <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive('orderedList'))}>
        1. List
      </button>
      <span className="w-px bg-gray-200 mx-1" />
      <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btnClass(editor.isActive('blockquote'))}>
        Quote
      </button>
      <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} className={btnClass(false)}>
        —
      </button>
      <span className="w-px bg-gray-200 mx-1" />
      <button type="button" onClick={() => {
        const url = window.prompt('Enter link URL:')
        if (url) editor.chain().focus().setLink({ href: url }).run()
      }} className={btnClass(editor.isActive('link'))}>
        🔗 Link
      </button>
      <button type="button" onClick={() => {
        const url = window.prompt('Enter image URL:')
        if (url) editor.chain().focus().setImage({ src: url }).run()
      }} className={btnClass(false)}>
        🖼 Image
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
      },
    },
  })

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}
