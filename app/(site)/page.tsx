import Link from 'next/link';
import { getHomeData, sortFeed, FeedSort, PostDetail, SiteStats } from '../../lib/server/queries';
import { listActiveAds } from '../../lib/server/ads';
import { isSiteAdmin } from '../../lib/server/session';
import { site } from '../../lib/site';
import AdSlots from '../../components/AdSlots';
import CommunityAvatar from '../../components/CommunityAvatar';
import { formatCount, timeAgo } from '../../lib/utils';

const SORT_TABS: [FeedSort, string][] = [
  ['hot', '인기'],
  ['new', '최신'],
  ['comments', '댓글 많은'],
  ['top', '추천'],
];

const isSort = (v?: string): v is FeedSort =>
  v === 'hot' || v === 'new' || v === 'comments' || v === 'top';

/** 통합 피드의 글 한 줄 (어느 커뮤니티에서 왔는지 함께 표시) */
function FeedRow({ p }: { p: PostDetail }) {
  return (
    <li>
      <Link
        href={`/c/${p.communitySlug}/post/${p.id}`}
        className="flex items-start gap-3 px-4 py-3 hover:bg-ground"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-ink-mute shrink-0">{p.communityName}</span>
            <span className="text-[11px] text-ink-faint shrink-0">· {p.boardName}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="font-semibold text-ink truncate">{p.title}</span>
            {p.commentCount > 0 && (
              <span className="text-xs font-bold text-ink-mute shrink-0">[{p.commentCount}]</span>
            )}
          </div>
          <div className="text-xs text-ink-faint mt-1 flex items-center gap-2 flex-wrap">
            <span>{p.authorNickname}</span>
            <span>·</span>
            <span>{timeAgo(p.createdAt)}</span>
            {p.tags.slice(0, 3).map((t) => (
              <span key={t} className="text-ink-faint">
                #{t}
              </span>
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
    ['커뮤니티', stats.communities],
    ['전체 글', stats.posts],
    ['오늘 작성글', stats.todayPosts],
    ['오늘 댓글', stats.todayComments],
  ] as const;
  return (
    <div className="grid grid-cols-4 gap-2 mb-4">
      {items.map(([label, v]) => (
        <div key={label} className="bg-white rounded-xl border border-hair py-2.5 text-center">
          <div className="text-lg font-black text-ink tabular-nums">{formatCount(v)}</div>
          <div className="text-[11px] text-ink-faint">{label}</div>
        </div>
      ))}
    </div>
  );
}

/** 홈 — 서버에서 글 목록까지 그려 검색로봇이 글을 따라 들어갈 수 있게 한다 */
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; tag?: string }>;
}) {
  const sp = await searchParams;
  const sort: FeedSort = isSort(sp.sort) ? sp.sort : 'hot';
  const tag = sp.tag ?? '';

  const [{ posts, communities, trending, tags, stats }, ads, admin] = await Promise.all([
    getHomeData(),
    listActiveAds(),
    isSiteAdmin(),
  ]);

  const feed = sortFeed(tag ? posts.filter((p) => p.tags.includes(tag)) : posts, sort).slice(0, 40);
  const chip = (on: boolean) =>
    `whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-semibold border ${
      on
        ? 'bg-ink text-white border-ink'
        : 'bg-white text-ink-mute border-hair hover:border-ink/25 hover:text-ink'
    }`;
  const keep = (next: Partial<{ sort: FeedSort; tag: string }>) => {
    const q = new URLSearchParams();
    const s = next.sort ?? sort;
    const t = next.tag ?? tag;
    if (s !== 'hot') q.set('sort', s);
    if (t) q.set('tag', t);
    const qs = q.toString();
    return qs ? `/?${qs}` : '/';
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: site.name,
            url: site.url,
            description: site.description,
          }),
        }}
      />

      {!tag && (
        <section className="mb-6 pt-2">
          <p className="text-[11px] font-bold tracking-[0.18em] text-ink-faint">COMMUNITY</p>
          <h1 className="mt-2 text-2xl sm:text-[32px] font-black leading-[1.25] text-ink">
            모든 커뮤니티의 이야기가
            <br />한 곳에서 실시간으로
          </h1>
          <p className="mt-2 text-sm text-ink-mute">{site.description}</p>
          <Link
            href="/create"
            className="inline-block mt-4 bg-ink text-white font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-ink-soft"
          >
            내 커뮤니티 만들기
          </Link>
        </section>
      )}

      {!tag && (
        <Link
          href="/games"
          className="flex items-center gap-3 rounded-2xl bg-ink px-4 py-3.5 mb-4 hover:bg-ink-soft"
        >
          <span className="w-9 h-9 rounded-lg bg-white/10 grid place-items-center text-lg shrink-0">
            🎮
          </span>
          <span className="min-w-0">
            <span className="block font-black text-white text-sm">게임 랜드 · 익명 자유게시판</span>
            <span className="block text-xs text-white/60 truncate">
              미니게임 12종을 즐기고 글을 쓰면 내 랜드가 자랍니다
            </span>
          </span>
          <span className="ml-auto text-xs font-bold text-gold-soft shrink-0">바로가기 →</span>
        </Link>
      )}

      {!tag && <StatBar stats={stats} />}

      {!tag && trending.length > 0 && (
        <section className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[11px] font-bold tracking-[0.14em] text-ink-faint">
              지금 뜨는 커뮤니티
            </h2>
            <Link href="/ranking" className="text-xs font-semibold text-ink-mute hover:text-ink">
              랭킹 전체 →
            </Link>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
            {(() => {
              // 오늘 활동량을 1등 대비 비율로 보여 준다 (순위 숫자 대신)
              const top = Math.max(...trending.map((x) => x.recentPosts + x.recentComments), 1);
              return trending.map((c) => (
                <Link
                  key={c.id}
                  href={`/c/${c.slug}`}
                  className="shrink-0 w-48 bg-white rounded-xl border border-hair p-3 hover:border-ink/25"
                >
                  <span className="flex items-center gap-2.5">
                    <CommunityAvatar slug={c.slug} emoji={c.emoji} avatarUrl={c.avatarUrl} />
                    <span className="font-bold text-ink text-sm truncate">{c.name}</span>
                  </span>
                  <span className="block mt-2.5 h-1 rounded-full bg-ground overflow-hidden">
                    <span
                      className="block h-full rounded-full bg-gold-soft"
                      style={{
                        width: `${Math.max(
                          12,
                          Math.round(((c.recentPosts + c.recentComments) / top) * 100)
                        )}%`,
                      }}
                    />
                  </span>
                  <span className="block text-[11px] text-ink-mute mt-1.5 tabular-nums">
                    오늘 글 +{c.recentPosts} · 댓글 +{c.recentComments}
                  </span>
                </Link>
              ));
            })()}
          </div>
        </section>
      )}

      {!tag && <AdSlots ads={ads} isAdmin={admin} className="mb-5" />}

      {/* 태그 필터 */}
      {tags.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1">
          <Link href={keep({ tag: '' })} className={chip(!tag)}>
            전체
          </Link>
          {tags.map((t) => (
            <Link key={t} href={keep({ tag: t })} className={chip(tag === t)}>
              #{t}
            </Link>
          ))}
        </div>
      )}

      {tag && (
        <div className="mb-3 text-sm text-ink-mute">
          <span className="font-bold text-ink">#{tag}</span> 태그가 붙은 모든 커뮤니티의 글
        </div>
      )}

      {/* 정렬 탭 */}
      <div className="flex gap-1 text-sm mb-3">
        {SORT_TABS.map(([key, label]) => (
          <Link
            key={key}
            href={keep({ sort: key })}
            className={`px-3 py-1.5 rounded-full font-semibold ${
              sort === key ? 'bg-ink text-white' : 'text-ink-mute hover:bg-ground'
            }`}
          >
            {label}
          </Link>
        ))}
      </div>

      {feed.length === 0 ? (
        <p className="text-center py-16 text-ink-faint text-sm">
          {tag ? '이 태그의 글이 아직 없어요.' : '아직 글이 없어요.'}
        </p>
      ) : (
        <ul className="bg-white rounded-2xl border border-hair divide-y divide-hair overflow-hidden">
          {feed.map((p) => (
            <FeedRow key={p.id} p={p} />
          ))}
        </ul>
      )}

      {/* 커뮤니티 둘러보기 */}
      {!tag && communities.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-ink">커뮤니티 둘러보기</h2>
            <Link href="/create" className="text-sm font-semibold text-ink">
              + 개설하기
            </Link>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1">
            {[
              ['📁 주제별', '/browse/topic'],
              ['📍 지역별', '/browse/region'],
              ['❤️ 팬클럽', '/browse/fan'],
              ['👑 대표커뮤니티', '/browse/featured'],
            ].map(([label, href]) => (
              <Link key={href} href={href} className={chip(false)}>
                {label}
              </Link>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-1">
            {communities.slice(0, 6).map((c) => (
              <Link
                key={c.id}
                href={`/c/${c.slug}`}
                className="bg-white rounded-xl border border-hair p-3.5 hover:border-ink/25"
              >
                <span className="flex items-center gap-2.5">
                  <CommunityAvatar slug={c.slug} emoji={c.emoji} avatarUrl={c.avatarUrl} size={40} />
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-ink truncate">{c.name}</span>
                    <span className="block text-[11px] text-ink-faint tabular-nums">
                      글 {formatCount(c.postCount)} · 멤버 {formatCount(c.members)}
                    </span>
                  </span>
                </span>
                {c.description && (
                  <span className="block text-xs text-ink-mute mt-2 line-clamp-2">
                    {c.description}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
