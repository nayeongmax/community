import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as store from '../lib/store';
import { CommunityStat } from '../lib/store';
import { REGIONS, TOPICS } from '../lib/types';
import { colorFromString } from '../lib/utils';

const TOPIC_EMOJI: Record<string, string> = {
  생활: '🏡', 취미: '🎨', 게임: '🎮', 자동차: '🚗', 투자: '📈', 부동산: '🏢',
  건강: '💪', 여행: '✈️', 엔터: '🎬', 스포츠: '⚽', 음식: '🍜', 교육: '📚', IT: '💻',
};

export default function ExplorePage() {
  const [trending, setTrending] = useState<CommunityStat[]>([]);

  useEffect(() => {
    store.listTrendingCommunities(6).then(setTrending);
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-black text-slate-800">🔍 탐색</h1>
        <p className="text-sm text-slate-500 mt-0.5">주제와 지역으로 새로운 커뮤니티를 발견하세요.</p>
      </div>

      {trending.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-slate-500 mb-2">🔥 지금 뜨는 커뮤니티</h2>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            {trending.map((c) => (
              <Link
                key={c.id}
                to={`/c/${c.slug}`}
                className="shrink-0 w-40 bg-white rounded-xl border border-slate-200 p-3 hover:shadow-md"
              >
                <div
                  className="w-10 h-10 rounded-lg grid place-items-center text-white font-black"
                  style={{ background: c.themeColor }}
                >
                  {c.name.slice(0, 1)}
                </div>
                <div className="mt-2 font-bold text-slate-800 text-sm truncate">{c.name}</div>
                <div className="text-[11px] text-rose-500 font-semibold mt-0.5">
                  🔥 오늘 글 +{c.recentPosts} · 댓글 +{c.recentComments}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold text-slate-500">📁 주제</h2>
          <Link to="/browse/topic" className="text-xs font-semibold text-indigo-600">전체 보기</Link>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
          {TOPICS.map((t) => (
            <Link
              key={t}
              to={`/browse/topic?tab=${encodeURIComponent(t)}`}
              className="rounded-xl p-3 text-white font-bold text-center hover:opacity-90"
              style={{ background: colorFromString(t + 'topic') }}
            >
              <div className="text-2xl">{TOPIC_EMOJI[t] ?? '📌'}</div>
              <div className="text-sm mt-1">{t}</div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold text-slate-500">📍 지역</h2>
          <Link to="/browse/region" className="text-xs font-semibold text-indigo-600">전체 보기</Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {REGIONS.map((r) => (
            <Link
              key={r}
              to={`/browse/region?tab=${encodeURIComponent(r)}`}
              className="px-4 py-2 rounded-full bg-white border border-slate-200 text-sm font-semibold text-slate-600 hover:border-indigo-300"
            >
              📍 {r}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
