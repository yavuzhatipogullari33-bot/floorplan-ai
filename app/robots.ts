import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const raw = process.env.NEXTAUTH_URL;
  const baseUrl = raw && raw.startsWith('http') ? raw : 'https://floorplan-ai.vercel.app';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/editor/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
