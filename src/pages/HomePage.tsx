import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import * as store from '../lib/store';
import { CommunityStat, FeedSort, PostView, SiteStats } from '../lib/store';
import CommunityCard from '../components/CommunityCard';
import { formatCount, timeAgo } from '../lib/utils';

const SORT_TABS: [FeedSort, string][] = [
  ['hot', '🔥 인기'],
  ['new', '🆕 최신'],
  ['comments', '💬 댓글 많은'],
  ['top', '👍 추천'],
];

/** 통합 피드의 글 한 줄 (어느 커뮤니티에서 왔는지 배지로 표시) */
function FeedRow({ p }: { p: PostView }) {
  return (
    <li>
      <Link
        to={`/c/${p.communitySlug}/post/${p.id}`}
        className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className="text-[11px] font-bold px-1.5 py-0.5 rounded text-white shrink-0"
              style={{ background: p.communityColor }}
            >
              {p.communityName}
            </span>
            <span className="text-[11px] text-slate-400 shrink-0">· {p.boardName}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-semibold text-slate-800 truncate">{p.title}</span>
            {p.commentCount > 0 && (
              <span className="text-xs font-bold text-indigo-500 shrink-0">
                [{p.commentCount}]
              </span>
            )}
          </div>
          <div className="text-xs text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
            <span>{p.authorNickname}</span>
            <span>·</span>
            <span>{timeAgo(p.createdAt)}</span>
            {p.tags.slice(0, 3).map((t) => (
              <Link
                key={t}
                to={`/?tag=${encodeURIComponent(t)}`}
                onClick={(e) => e.stopPropagation()}
                className="text-indigo-400 hover:text-indigo-600"
              >
                #{t}
              </Link>
            ))}
          </div>
        </div>
        <div className="text-xs text-slate-400 text-right shrink-0 hidden sm:block">
          <div>조회 {formatCount(p.views)}</div>
          <div className="text-rose-500 font-semibold">▲ {p.likedBy.length}</div>
        </div>
      </Link>
    </li>
  );
}

function StatBar({ stats }: { stats: SiteStats }) {
  const items = [
    ['커뮤니티', stats.totalCommunities],
    ['전체 글', stats.totalPosts],
    ['오늘 작성글', stats.todayPosts],
    ['오늘 댓글', stats.todayComments],
  ] as const;
  return (
    <div className="grid grid-cols-4 gap-2 mb-4">
      {items.map(([label, v]) => (
        <div key={label} className="bg-white rounded-xl border border-slate-200 py-2.5 text-center">
          <div className="text-lg font-black text-slate-800">{formatCount(v)}</div>
          <div className="text-[11px] text-slate-400">{label}</div>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  const [params] = useSearchParams();
  const q = params.get('q') ?? '';
  const tag = params.get('tag') ?? '';

  const sortParam = params.get('sort');
  const [sort, setSort] = useState<FeedSort>('hot');
  const [feed, setFeed] = useState<PostView[]>([]);
  const [communities, setCommunities] = useState<CommunityStat[]>([]);
  const [trending, setTrending] = useState<CommunityStat[]>([]);
  const [tags, setTags] = useState<{ tag: string; count: number }[]>([]);
  const [stats, setStats] = useState<SiteStats | null>(null);

  // 왼쪽 메뉴(실시간/인기)에서 넘어온 정렬 파라미터 동기화
  useEffect(() => {
    if (
      sortParam === 'new' ||
      sortParam === 'hot' ||
      sortParam === 'comments' ||
      sortParam === 'top'
    ) {
      setSort(sortParam);
    }
  }, [sortParam]);
  const [searchResult, setSearchResult] = useState<{
    communities: CommunityStat[];
    posts: PostView[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  // 검색 모드
  useEffect(() => {
    if (!q) {
      setSearchResult(null);
      return;
    }
    setLoading(true);
    store.searchAll(q).then((r) => {
      setSearchResult(r);
      setLoading(false);
    });
  }, [q]);

  // 통합 피드 모드
  useEffect(() => {
    if (q) return;
    setLoading(true);
    Promise.all([
      store.listFeed({ sort, tag: tag || undefined, limit: 40 }),
      store.listCommunitiesWithStats(),
      store.listPopularTags(12),
      store.getSiteStats(),
      store.listTrendingCommunities(8),
    ]).then(([f, c, t, s, tr]) => {
      setFeed(f);
      setCommunities(c.sort((a, b) => b.members - a.members));
      setTags(t);
      setStats(s);
      setTrending(tr);
      setLoading(false);
    });
  }, [q, sort, tag]);

  // ---------------- 검색 결과 화면 ----------------
  if (q) {
    return (
      <div>
        <h2 className="text-lg font-bold text-slate-800 mb-3">
          "{q}" 검색 결과
        </h2>
        {loading || !searchResult ? (
          <p className="text-center text-slate-400 py-16">검색 중…</p>
        ) : searchResult.communities.length === 0 && searchResult.posts.length === 0 ? (
          <p className="text-center text-slate-400 py-16">검색 결과가 없어요.</p>
        ) : (
          <div className="space-y-6">
            {searchResult.communities.length > 0 && (
              <section>
                <h3 className="text-sm font-bold text-slate-500 mb-2">
                  커뮤니티 {searchResult.communities.length}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {searchResult.communities.map((c) => (
                    <CommunityCard key={c.id} c={c} />
                  ))}
                </div>
              </section>
            )}
            {searchResult.posts.length > 0 && (
              <section>
                <h3 className="text-sm font-bold text-slate-500 mb-2">
                  글 {searchResult.posts.length}
                </h3>
                <ul className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                  {searchResult.posts.map((p) => (
                    <FeedRow key={p.id} p={p} />
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
      </div>
    );
  }

  // ---------------- 통합 메인 화면 ----------------
  return (
    <div>
      {!tag && (
        <section className="bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl p-6 sm:p-8 text-white mb-4">
          <h1 className="text-2xl sm:text-3xl font-black leading-tight">
            모든 커뮤니티의 이야기가
            <br />한 곳에서 실시간으로
          </h1>
          <p className="mt-2 text-indigo-100 text-sm">
            관심사 커뮤니티를 만들고, 글 하나로 여러 곳에 노출하세요.
          </p>
          <Link
            to="/create"
            className="inline-block mt-4 bg-white text-indigo-700 font-bold px-5 py-2.5 rounded-lg hover:bg-indigo-50"
          >
            내 커뮤니티 만들기
          </Link>
        </section>
      )}

      {/* 🎮 게임 센터 바로가기 */}
      {!tag && (
        <Link
          to="/games"
          className="flex items-center gap-3 bg-white rounded-2xl border border-slate-200 px-4 py-3 mb-4 hover:shadow-md"
        >
          <span className="text-2xl">🎮</span>
          <div className="min-w-0">
            <p className="font-black text-slate-800 text-sm">게임 센터 · 익명 자유게시판</p>
            <p className="text-xs text-slate-500 truncate">
              미니게임 10종을 클릭으로 즐기고, 익명으로 자유롭게 수다 떠세요
            </p>
          </div>
          <span className="ml-auto text-xs font-bold text-indigo-600 shrink-0">바로가기 →</span>
        </Link>
      )}

      {stats && <StatBar stats={stats} />}

      {/* 🔥 지금 뜨는 커뮤니티 (실시간으로 움직이는 커뮤니티) */}
      {!tag && trending.length > 0 && (
        <section className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-bold text-slate-500">🔥 지금 뜨는 커뮤니티</h2>
            <Link to="/ranking" className="text-xs font-semibold text-indigo-600">
              랭킹 전체 →
            </Link>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            {trending.map((c, i) => (
              <Link
                key={c.id}
                to={`/c/${c.slug}`}
                className="shrink-0 w-44 bg-white rounded-xl border border-slate-200 p-3 hover:shadow-md"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-slate-300">{i + 1}</span>
                  <span
                    className="w-9 h-9 rounded-lg grid place-items-center text-white font-black"
                    style={{ background: c.themeColor }}
                  >
                    {c.name.slice(0, 1)}
                  </span>
                  <span className="font-bold text-slate-800 text-sm truncate">{c.name}</span>
                </div>
                <div className="text-[11px] text-rose-500 font-semibold mt-2">
                  🔥 오늘 글 +{c.recentPosts} · 댓글 +{c.recentComments}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 태그(카테고리) 필터 */}
      <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1">
        <Link
          to="/"
          className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-semibold border ${
            !tag
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
          }`}
        >
          전체
        </Link>
        {tags.map(({ tag: t }) => (
          <Link
            key={t}
            to={`/?tag=${encodeURIComponent(t)}`}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-semibold border ${
              tag === t
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
            }`}
          >
            #{t}
          </Link>
        ))}
      </div>

      {tag && (
        <div className="mb-3 text-sm text-slate-500">
          <span className="font-bold text-indigo-600">#{tag}</span> 태그가 붙은 모든 커뮤니티의 글
        </div>
      )}

      {/* 정렬 탭 */}
      <div className="flex gap-1 text-sm mb-3">
        {SORT_TABS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSort(key)}
            className={`px-3 py-1.5 rounded-full font-semibold ${
              sort === key ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 통합 피드 */}
      {loading ? (
        <p className="text-center text-slate-400 py-16">불러오는 중…</p>
      ) : feed.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          {tag ? '이 태그의 글이 아직 없어요.' : '아직 글이 없어요.'}
        </div>
      ) : (
        <ul className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
          {feed.map((p) => (
            <FeedRow key={p.id} p={p} />
          ))}
        </ul>
      )}

      {/* 커뮤니티 둘러보기 (탐색) */}
      {!tag && communities.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-slate-800">커뮤니티 둘러보기</h2>
            <Link to="/create" className="text-sm font-semibold text-indigo-600">
              + 개설하기
            </Link>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1">
            {[
              ['📁 주제별', '/browse/topic'],
              ['📍 지역별', '/browse/region'],
              ['❤️ 팬커뮤니티', '/browse/fan'],
              ['👑 대표커뮤니티', '/browse/featured'],
            ].map(([label, to]) => (
              <Link
                key={to}
                to={to}
                className="whitespace-nowrap px-3.5 py-1.5 rounded-full text-sm font-semibold bg-white border border-slate-200 text-slate-600 hover:border-indigo-300"
              >
                {label}
              </Link>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-1">
            {communities.slice(0, 6).map((c) => (
              <CommunityCard key={c.id} c={c} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
