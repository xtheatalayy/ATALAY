import type { MetadataRoute } from 'next';

const baseUrl = process.env.NEXTAUTH_URL || 'http://plannedlife.localhost';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/giris', '/kayit'],
        disallow: [
          '/api/',
          '/ozet',
          '/asistan',
          '/giderler',
          '/gorevler',
          '/saglik',
          '/notlar',
          '/hatirlaticilar',
          '/ayarlar',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
