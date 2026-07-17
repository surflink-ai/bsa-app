import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Barbados Surfing Association',
    short_name: 'BSA',
    description: 'The National Governing Body for Surfing in Barbados. Competition results, surf reports, athlete profiles.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0A2540',
    theme_color: '#0A2540',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  }
}
