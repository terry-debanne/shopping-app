import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Nos courses',
    short_name: 'Courses',
    description: 'Liste de courses familiale',
    start_url: '/',
    display: 'standalone',
    background_color: '#f1f5f9',
    theme_color: '#3b82f6',
    orientation: 'portrait',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
