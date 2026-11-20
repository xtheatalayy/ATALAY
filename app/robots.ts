import type { MetadataRoute } from 'next';

const baseUrl = process.env.NEXTAUTH_URL || 'http://plannedlife.localhost';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/giris', '/kayit'],
        disallow: ['/api/', '/asistan', '/giderler', '/gorevler', '/saglik', '/notlar', '/hatirlaticilar'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
