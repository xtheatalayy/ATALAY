import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Planned Life',
    short_name: 'Planned Life',
    description:
      'Giderlerini takip et, bütçeni yönet, sağlık rutinlerini planla, görevlerini ve notlarını tek yerde tut.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F4FAF7',
    theme_color: '#0F766E',
    lang: 'tr',
    dir: 'ltr',
    categories: ['productivity', 'lifestyle', 'finance'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };
}
