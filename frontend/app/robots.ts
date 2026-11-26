import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://www.musclecraftlk.com').replace(/\/+$/, '');

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/memberships', '/pricing', '/about', '/contact', '/faq', '/privacy', '/terms'],
        disallow: ['/admin', '/admin/', '/client', '/client/', '/instructor', '/instructor/', '/checkout', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
