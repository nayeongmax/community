import type { MetadataRoute } from 'next';
import { site } from '../lib/site';

/** /robots.txt — 네이버 Yeti 를 따로 명시해 둔다 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/login', '/signup', '/api/'] },
      { userAgent: 'Yeti', allow: '/' },
    ],
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
