import { listAllPosts } from '../../lib/server/queries';
import { site, summarize } from '../../lib/site';

/** /rss.xml — 네이버 서치어드바이저에 제출하면 새 글이 빨리 수집된다 */

function escape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function GET() {
  const posts = (await listAllPosts()).slice(0, 50);

  const items = posts
    .map((p) => {
      const url = `${site.url}/c/${p.communitySlug}/post/${p.id}`;
      return `    <item>
      <title>${escape(p.title)}</title>
      <link>${escape(url)}</link>
      <guid isPermaLink="true">${escape(url)}</guid>
      <description>${escape(summarize(p.content, 300))}</description>
      <author>${escape(p.authorNickname)}</author>
      <category>${escape(p.communityName)}</category>
      <pubDate>${new Date(p.createdAt).toUTCString()}</pubDate>
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escape(site.name)}</title>
    <link>${escape(site.url)}</link>
    <description>${escape(site.description)}</description>
    <language>ko</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}
