import type { Metadata } from 'next';
import Link from 'next/link';
import { listCommunities } from '../../lib/server/queries';
import { communityEmoji } from '../../lib/emoji';

export const metadata: Metadata = {
  title: '커뮤니티 랭킹',
  description: '가장 활발한 커뮤니티 순위.',
  alternates: { canonical: '/ranking' },
};

export default async function RankingPage() {
  const communities = await listCommunities();
  const boards: [string, (c: (typeof communities)[number]) => number, string][] = [
    ['멤버 많은 커뮤니티', (c) => c.members, '명'],
    ['글 많은 커뮤니티', (c) => c.postCount, '개'],
  ];

  return (
    <div>
      <p className="text-[11px] font-bold tracking-[0.18em] text-ink-faint">RANKING</p>
      <h1 className="text-2xl font-black text-ink mt-1 mb-4">커뮤니티 랭킹</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {boards.map(([title, metric, suffix]) => (
          <section key={title} className="bg-white rounded-2xl border border-hair p-4">
            <h2 className="font-bold text-ink mb-3">{title}</h2>
            <ol className="space-y-1">
              {[...communities]
                .sort((a, b) => metric(b) - metric(a))
                .slice(0, 5)
                .map((c, i) => (
                  <li key={c.id}>
                    <Link
                      href={`/c/${c.slug}`}
                      className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-ground"
                    >
                      <span className="w-5 text-center font-black text-gold tabular-nums">
                        {i + 1}
                      </span>
                      <span className="w-8 h-8 rounded-lg bg-ground border border-hair grid place-items-center">
                        {c.emoji || communityEmoji(c.slug)}
                      </span>
                      <span className="font-semibold text-ink truncate flex-1">{c.name}</span>
                      <span className="text-sm font-bold text-gold tabular-nums">
                        {metric(c)}
                        {suffix}
                      </span>
                    </Link>
                  </li>
                ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  );
}
