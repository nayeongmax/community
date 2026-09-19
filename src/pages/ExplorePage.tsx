import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as store from '../lib/store';
import { CommunityStat } from '../lib/store';
import { REGIONS, TOPICS } from '../lib/types';
import CommunityAvatar from '../components/CommunityAvatar';

const TOPIC_EMOJI: Record<string, string> = {
  '생활/취미': '🏡', 게임: '🎮', 자동차: '🚗', 투자: '📈', 부동산: '🏢',
  건강: '💪', 여행: '✈️', 엔터: '🎬', 스포츠: '⚽', 음식: '🍜', 교육: '📚',
  '부업/수익화': '💰',
};

export default function ExplorePage() {
  const [trending, setTrending] = useState<CommunityStat[]>([]);

  useEffect(() => {
    store.listTrendingCommunities(6).then(setTrending);
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[11px] font-bold tracking-[0.18em] text-ink-faint">EXPLORE</p>
        <h1 className="text-2xl font-black text-ink mt-1">탐색</h1>
        <p className="text-sm text-ink-mute mt-1">주제와 지역으로 새로운 커뮤니티를 발견하세요.</p>
      </div>

      {trending.length > 0 && (
        <section>
          <h2 className="text-[11px] font-bold tracking-[0.14em] text-ink-faint mb-2">지금 뜨는 커뮤니티</h2>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            {trending.map((c) => (
              <Link
                key={c.id}
                to={`/c/${c.slug}`}
                className="shrink-0 w-40 bg-white rounded-xl border border-hair p-3 transition-colors hover:border-ink/25"
              >
                <CommunityAvatar slug={c.slug} emoji={c.emoji} mediaId={c.avatarMediaId} size={40} />
                <div className="mt-2 font-bold text-ink text-sm truncate">{c.name}</div>
                <div className="text-[11px] text-ink-mute mt-1 tabular-nums">
                  오늘 글 +{c.recentPosts} · 댓글 +{c.recentComments}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[11px] font-bold tracking-[0.14em] text-ink-faint">주제</h2>
          <Link to="/browse/topic" className="text-xs font-semibold text-ink-mute hover:text-ink">
            전체 보기 →
          </Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {TOPICS.map((t) => (
            <Link
              key={t}
              to={`/browse/topic?tab=${encodeURIComponent(t)}`}
              className="group flex items-center gap-2.5 rounded-xl bg-white border border-hair px-3 py-3 transition-colors hover:border-ink/25"
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
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[11px] font-bold tracking-[0.14em] text-ink-faint">지역</h2>
          <Link to="/browse/region" className="text-xs font-semibold text-ink-mute hover:text-ink">
            전체 보기 →
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {REGIONS.map((r) => (
            <Link
              key={r}
              to={`/browse/region?tab=${encodeURIComponent(r)}`}
              className="px-4 py-2 rounded-full bg-white border border-hair text-sm font-semibold text-ink-mute transition-colors hover:border-ink/25 hover:text-ink"
            >
              {r}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
