import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitizes admin-authored HTML before it is injected via
 * dangerouslySetInnerHTML. Even though authors are trusted, this prevents
 * stored XSS if an author account is ever compromised, and strips anything
 * the rich-text editor shouldn't emit.
 */
export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'blockquote', 'code', 'pre',
      'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li', 'a', 'img', 'figure',
      'figcaption', 'hr', 'span',
    ],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'src', 'alt', 'width', 'height'],
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|tel:|\/)/i,
  })
}
