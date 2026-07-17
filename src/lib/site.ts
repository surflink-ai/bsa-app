/**
 * Canonical site origin, used for metadata, sitemap, robots, and JSON-LD.
 * Override per-environment with NEXT_PUBLIC_SITE_URL (e.g. preview deploys).
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://bsa.surf').replace(/\/$/, '')
