import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import * as store from '../lib/store';
import { CommunityStat, FeedSort, PostView, SiteStats } from '../lib/store';
import CommunityCard from '../components/CommunityCard';
import CommunityAvatar from '../components/CommunityAvatar';
import AdSlots from '../components/AdSlots';
import { formatCount, timeAgo } from '../lib/utils';

const SORT_TABS: [FeedSort, string][] = [
  ['hot', '인기'],
  ['new', '최신'],
  ['comments', '댓글 많은'],
  ['top', '추천'],
];

/** 통합 피드의 글 한 줄 (어느 커뮤니티에서 왔는지 배지로 표시) */
function FeedRow({ p }: { p: PostView }) {
  return (
    <li>
      <Link
        to={`/c/${p.communitySlug}/post/${p.id}`}
        className="flex items-start gap-3 px-4 py-3 hover:bg-ground"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-ink-mute shrink-0">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: p.communityColor }}
              />
              {p.communityName}
            </span>
            <span className="text-[11px] text-ink-faint shrink-0">· {p.boardName}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-semibold text-ink truncate">{p.title}</span>
            {p.commentCount > 0 && (
              <span className="text-xs font-bold text-ink-mute shrink-0">
                [{p.commentCount}]
              </span>
            )}
          </div>
          <div className="text-xs text-ink-faint mt-1 flex items-center gap-2 flex-wrap">
            <span>{p.authorNickname}</span>
            <span>·</span>
            <span>{timeAgo(p.createdAt)}</span>
            {p.tags.slice(0, 3).map((t) => (
              <Link
                key={t}
                to={`/?tag=${encodeURIComponent(t)}`}
                onClick={(e) => e.stopPropagation()}
                className="text-ink-faint hover:text-ink"
              >
                #{t}
              </Link>
            ))}
          </div>
        </div>
        <div className="text-xs text-ink-faint text-right shrink-0 hidden sm:block">
          <div>조회 {formatCount(p.views)}</div>
          <div className="text-ink-mute font-semibold tabular-nums">▲ {p.likedBy.length}</div>
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
        <div key={label} className="bg-white rounded-xl border border-hair py-2.5 text-center">
          <div className="text-lg font-black text-ink">{formatCount(v)}</div>
          <div className="text-[11px] text-ink-faint">{label}</div>
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
        <h2 className="text-lg font-bold text-ink mb-3">
          "{q}" 검색 결과
        </h2>
        {loading || !searchResult ? (
          <p className="text-center text-ink-faint py-16">검색 중…</p>
        ) : searchResult.communities.length === 0 && searchResult.posts.length === 0 ? (
          <p className="text-center text-ink-faint py-16">검색 결과가 없어요.</p>
        ) : (
          <div className="space-y-6">
            {searchResult.communities.length > 0 && (
              <section>
                <h3 className="text-sm font-bold text-ink-mute mb-2">
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
                <h3 className="text-sm font-bold text-ink-mute mb-2">
                  글 {searchResult.posts.length}
                </h3>
                <ul className="bg-white rounded-2xl border border-hair divide-y divide-hair overflow-hidden">
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
        <section className="mb-6 pt-2">
          <p className="text-[11px] font-bold tracking-[0.18em] text-ink-faint">COMMUNITY</p>
          <h1 className="mt-2 text-2xl sm:text-[32px] font-black leading-[1.25] text-ink text-balance">
            모든 커뮤니티의 이야기가
            <br />한 곳에서 실시간으로
          </h1>
          <p className="mt-2 text-sm text-ink-mute">
            관심사 커뮤니티를 만들고, 글 하나로 여러 곳에 노출하세요.
          </p>
          <Link
            to="/create"
            className="inline-block mt-4 bg-ink text-white font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-ink-soft"
          >
            내 커뮤니티 만들기
          </Link>
        </section>
      )}

      {/* 🎮 게임 센터 바로가기 */}
      {!tag && (
        <Link
          to="/games"
          className="group flex items-center gap-3 rounded-2xl bg-ink px-4 py-3.5 mb-4 transition-colors hover:bg-ink-soft"
        >
          <span className="w-9 h-9 rounded-lg bg-white/10 grid place-items-center text-lg shrink-0">
            🎮
          </span>
          <div className="min-w-0">
            <p className="font-black text-white text-sm">게임 랜드 · 익명 자유게시판</p>
            <p className="text-xs text-white/60 truncate">
              미니게임 12종을 즐기고 글을 쓰면 내 랜드가 자랍니다
            </p>
          </div>
          <span className="ml-auto text-xs font-bold text-gold-soft shrink-0">바로가기 →</span>
        </Link>
      )}

      {stats && <StatBar stats={stats} />}

      {/* 🔥 지금 뜨는 커뮤니티 (실시간으로 움직이는 커뮤니티) */}
      {!tag && trending.length > 0 && (
        <section className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[11px] font-bold tracking-[0.14em] text-ink-faint">지금 뜨는 커뮤니티</h2>
            <Link to="/ranking" className="text-xs font-semibold text-ink-mute hover:text-ink">
              랭킹 전체 →
            </Link>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            {trending.map((c) => {
              // 오늘 활동량을 1등 대비 비율로 보여 준다 (순위 숫자 대신)
              const top = Math.max(...trending.map((x) => x.recentPosts + x.recentComments), 1);
              const heat = (c.recentPosts + c.recentComments) / top;
              return (
                <Link
                  key={c.id}
                  to={`/c/${c.slug}`}
                  className="shrink-0 w-48 bg-white rounded-xl border border-hair p-3 transition-colors hover:border-ink/25"
                >
                  <div className="flex items-center gap-2.5">
                    <CommunityAvatar slug={c.slug} emoji={c.emoji} mediaId={c.avatarMediaId} size={38} />
                    <span className="font-bold text-ink text-sm truncate">{c.name}</span>
                  </div>
                  <div className="mt-2.5 h-1 rounded-full bg-ground overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gold-soft"
                      style={{ width: `${Math.max(12, Math.round(heat * 100))}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-ink-mute mt-1.5 tabular-nums">
                    오늘 글 +{c.recentPosts} · 댓글 +{c.recentComments}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* 광고 배너 */}
      {!tag && <AdSlots className="mb-5" />}

      {/* 태그(카테고리) 필터 */}
      <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1">
        <Link
          to="/"
          className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-semibold border ${
            !tag
              ? 'bg-ink text-white border-ink'
              : 'bg-white text-ink-mute border-hair hover:border-ink/25 hover:text-ink'
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
                ? 'bg-ink text-white border-ink'
                : 'bg-white text-ink-mute border-hair hover:border-ink/25 hover:text-ink'
            }`}
          >
            #{t}
          </Link>
        ))}
      </div>

      {tag && (
        <div className="mb-3 text-sm text-ink-mute">
          <span className="font-bold text-ink">#{tag}</span> 태그가 붙은 모든 커뮤니티의 글
        </div>
      )}

      {/* 정렬 탭 */}
      <div className="flex gap-1 text-sm mb-3">
        {SORT_TABS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSort(key)}
            className={`px-3 py-1.5 rounded-full font-semibold ${
              sort === key ? 'bg-ink text-white' : 'text-ink-mute hover:bg-ground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 통합 피드 */}
      {loading ? (
        <p className="text-center text-ink-faint py-16">불러오는 중…</p>
      ) : feed.length === 0 ? (
        <div className="text-center py-16 text-ink-faint text-sm">
          {tag ? '이 태그의 글이 아직 없어요.' : '아직 글이 없어요.'}
        </div>
      ) : (
        <ul className="bg-white rounded-2xl border border-hair divide-y divide-hair overflow-hidden">
          {feed.map((p) => (
            <FeedRow key={p.id} p={p} />
          ))}
        </ul>
      )}

      {/* 커뮤니티 둘러보기 (탐색) */}
      {!tag && communities.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-ink">커뮤니티 둘러보기</h2>
            <Link to="/create" className="text-sm font-semibold text-ink">
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
                className="whitespace-nowrap px-3.5 py-1.5 rounded-full text-sm font-semibold bg-white border border-hair text-ink-mute hover:border-ink/25"
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
