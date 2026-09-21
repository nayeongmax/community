import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  getCommunityBySlug,
  listBoards,
  listPostsOfCommunity,
} from '../../../../lib/server/queries';
import { site } from '../../../../lib/site';
import { currentUser, isManager, myRole } from '../../../../lib/server/session';
import { toggleJoinAction } from '../../../../lib/server/actions';
import { communityEmoji } from '../../../../lib/emoji';
import { timeAgo } from '../../../../lib/utils';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCommunityBySlug(slug);
  if (!c) return { title: '없는 커뮤니티' };
  return {
    title: c.name,
    description: c.description,
    keywords: [c.name, ...(c.topics ?? [])],
    alternates: { canonical: `/c/${slug}` },
    openGraph: {
      title: c.name,
      description: c.description,
      url: `/c/${slug}`,
      images: c.titleUrl ? [c.titleUrl] : undefined,
    },
  };
}

export default async function CommunityPage({ params }: Props) {
  const { slug } = await params;
  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const [boards, posts, me] = await Promise.all([
    listBoards(community.id),
    listPostsOfCommunity(community.id),
    currentUser(),
  ]);
  const role = await myRole(community.id);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: community.name,
    description: community.description,
    url: `${site.url}/c/${slug}`,
    hasPart: posts.slice(0, 20).map((p) => ({
      '@type': 'DiscussionForumPosting',
      headline: p.title,
      url: `${site.url}/c/${slug}/post/${p.id}`,
      datePublished: p.createdAt,
      author: { '@type': 'Person', name: p.authorNickname },
    })),
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="bg-white rounded-2xl border border-hair overflow-hidden mb-4">
        {community.titleUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={community.titleUrl}
            alt={`${community.name} 타이틀`}
            className="w-full object-cover"
            style={{ aspectRatio: '4 / 1' }}
          />
        ) : (
          <div className="h-1" style={{ background: community.themeColor }} />
        )}
        <div className="p-5 flex items-start gap-3">
          {community.avatarUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={community.avatarUrl}
              alt=""
              className="w-14 h-14 rounded-2xl object-cover border border-hair shrink-0"
            />
          ) : (
            <span className="w-14 h-14 rounded-2xl bg-ground border border-hair grid place-items-center text-2xl shrink-0">
              {community.emoji || communityEmoji(community.slug)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-xl font-black text-ink">{community.name}</h1>
              <div className="flex items-center gap-2 shrink-0">
                {isManager(role) && (
                  <Link
                    href={`/c/${slug}/settings`}
                    className="text-sm font-semibold border border-hair px-3 py-1.5 rounded-lg hover:border-ink/25"
                  >
                    관리
                  </Link>
                )}
                {me && (
                  <form action={toggleJoinAction.bind(null, community.id, slug)}>
                    <button
                      className={`text-sm font-bold px-4 py-1.5 rounded-lg ${
                        role
                          ? 'bg-ground text-ink-mute border border-hair'
                          : 'bg-ink text-white hover:bg-ink-soft'
                      }`}
                    >
                      {role === 'owner' ? '운영자' : role ? '가입됨' : '+ 가입하기'}
                    </button>
                  </form>
                )}
              </div>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {(community.topics ?? []).map((t) => (
                <Link
                  key={t}
                  href={`/browse/topic?tab=${encodeURIComponent(t)}`}
                  className="text-xs text-ink-mute border border-hair px-2 py-0.5 rounded-full hover:border-ink/25"
                >
                  {t}
                </Link>
              ))}
            </div>
            <p className="text-sm text-ink-mute mt-2">{community.description}</p>
            <p className="text-xs text-ink-faint mt-2 tabular-nums">
              멤버 {community.members}명 · 글 {community.postCount}개
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-4">
        <aside className="bg-white rounded-2xl border border-hair p-2 h-fit">
          <p className="px-3 py-2 text-sm font-bold text-ink">게시판</p>
          <ul>
            {boards.map((b) => (
              <li key={b.id} className="px-3 py-2 text-sm font-semibold text-ink-mute">
                {b.isNotice && <span className="text-gold text-[10px] mr-1">●</span>}
                {b.name}
              </li>
            ))}
          </ul>
        </aside>

        <section className="bg-white rounded-2xl border border-hair overflow-hidden">
          <div className="px-4 py-3 flex items-center border-b border-hair">
            <h2 className="font-bold text-ink">전체글</h2>
            <Link
              href={`/c/${slug}/write`}
              className="ml-auto text-sm font-bold bg-ink text-white px-3.5 py-1.5 rounded-lg hover:bg-ink-soft"
            >
              글쓰기
            </Link>
          </div>
          <ul className="divide-y divide-hair">
            {posts.map((p) => (
              <li key={p.id}>
                <Link href={`/c/${slug}/post/${p.id}`} className="flex gap-3 px-4 py-3 hover:bg-ground">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] text-ink-faint">{p.boardName}</span>
                      <h3 className="font-semibold text-ink">{p.title}</h3>
                      {p.commentCount > 0 && (
                        <span className="text-xs font-bold text-gold">[{p.commentCount}]</span>
                      )}
                    </div>
                    <p className="text-xs text-ink-faint mt-1">
                      {p.authorNickname} · {timeAgo(p.createdAt)}
                      {(p.tags ?? []).slice(0, 3).map((t) => (
                        <span key={t} className="ml-1.5">
                          #{t}
                        </span>
                      ))}
                    </p>
                  </div>
                  <div className="text-xs text-ink-faint text-right shrink-0 tabular-nums">
                    <div>조회 {p.views}</div>
                    <div>▲ {p.likedBy.length}</div>
                  </div>
                </Link>
              </li>
            ))}
            {posts.length === 0 && (
              <li className="px-4 py-12 text-center text-sm text-ink-faint">아직 글이 없습니다.</li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
