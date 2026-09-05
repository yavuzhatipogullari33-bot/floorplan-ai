import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const raw = process.env.NEXTAUTH_URL;
  const baseUrl = raw && raw.startsWith('http') ? raw : 'https://floorplan-ai.vercel.app';

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/sign-in`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];
}
