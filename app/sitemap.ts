import type { MetadataRoute } from 'next';
import { listAllPosts, listCommunities } from '../lib/server/queries';
import { site } from '../lib/site';

/**
 * /sitemap.xml — 글이 늘어나면 자동으로 함께 늘어난다.
 * 빌드 시점에 고정되면 새 글이 빠지므로 매 요청마다 다시 만든다.
 */
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, communities] = await Promise.all([listAllPosts(), listCommunities()]);

  return [
    { url: site.url, changeFrequency: 'hourly', priority: 1 },
    { url: `${site.url}/explore`, changeFrequency: 'daily', priority: 0.6 },
    { url: `${site.url}/ranking`, changeFrequency: 'daily', priority: 0.5 },
    ...communities.map((c) => ({
      url: `${site.url}/c/${c.slug}`,
      changeFrequency: 'daily' as const,
      priority: 0.8,
    })),
    ...posts.map((p) => ({
      url: `${site.url}/c/${p.communitySlug}/post/${p.id}`,
      lastModified: new Date(p.updatedAt ?? p.createdAt),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];
}
