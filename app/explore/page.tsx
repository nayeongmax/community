import type { Metadata } from 'next';
import Link from 'next/link';
import { listCommunities } from '../../lib/server/queries';
import { REGIONS, TOPICS } from '../../lib/types';
import { communityEmoji } from '../../lib/emoji';

export const metadata: Metadata = {
  title: '탐색',
  description: '주제와 지역으로 새로운 커뮤니티를 발견하세요.',
  alternates: { canonical: '/explore' },
};

const TOPIC_EMOJI: Record<string, string> = {
  '생활/취미': '🏡', 게임: '🎮', 자동차: '🚗', 투자: '📈', 부동산: '🏢',
  건강: '💪', 여행: '✈️', 엔터: '🎬', 스포츠: '⚽', 음식: '🍜', 교육: '📚',
  '부업/수익화': '💰',
};

export default async function ExplorePage() {
  const communities = await listCommunities();

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-bold tracking-[0.18em] text-ink-faint">EXPLORE</p>
        <h1 className="text-2xl font-black text-ink mt-1">탐색</h1>
        <p className="text-sm text-ink-mute mt-1">주제와 지역으로 새로운 커뮤니티를 발견하세요.</p>
      </div>

      <section>
        <h2 className="text-[11px] font-bold tracking-[0.14em] text-ink-faint mb-2">주제</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {TOPICS.map((t) => (
            <Link
              key={t}
              href={`/browse/topic?tab=${encodeURIComponent(t)}`}
              className="flex items-center gap-2.5 rounded-xl bg-white border border-hair px-3 py-3 hover:border-ink/25"
            >
              <span className="w-8 h-8 rounded-lg bg-ground grid place-items-center text-base shrink-0">
                {TOPIC_EMOJI[t] ?? '📌'}
              </span>
              <span className="text-sm font-bold text-ink truncate">{t}</span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-[11px] font-bold tracking-[0.14em] text-ink-faint mb-2">지역</h2>
        <div className="flex flex-wrap gap-2">
          {REGIONS.map((r) => (
            <Link
              key={r}
              href={`/browse/region?tab=${encodeURIComponent(r)}`}
              className="px-4 py-2 rounded-full bg-white border border-hair text-sm font-semibold text-ink-mute hover:border-ink/25 hover:text-ink"
            >
              {r}
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-[11px] font-bold tracking-[0.14em] text-ink-faint mb-2">
          전체 커뮤니티
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {communities.map((c) => (
            <Link
              key={c.id}
              href={`/c/${c.slug}`}
              className="bg-white rounded-xl border border-hair p-4 hover:border-ink/25"
            >
              <span className="w-11 h-11 rounded-xl bg-ground border border-hair grid place-items-center text-lg">
                {c.emoji || communityEmoji(c.slug)}
              </span>
              <h3 className="font-bold text-ink mt-3">{c.name}</h3>
              <p className="text-sm text-ink-mute mt-1 line-clamp-2">{c.description}</p>
              <p className="text-xs text-ink-faint mt-3 tabular-nums">
                멤버 {c.members} · 글 {c.postCount}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
