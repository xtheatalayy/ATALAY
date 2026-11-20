import type { MetadataRoute } from 'next';

const baseUrl = process.env.NEXTAUTH_URL || 'http://plannedlife.localhost';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${baseUrl}/giris`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/kayit`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
  ];
}
