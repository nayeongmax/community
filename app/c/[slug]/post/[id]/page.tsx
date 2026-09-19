import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCommunityBySlug, getPost, listComments } from '../../../../../lib/server/queries';
import { site, summarize } from '../../../../../lib/site';
import { timeAgo } from '../../../../../lib/utils';

/**
 * 글 상세 — 서버에서 그린다.
 *
 * 이 페이지가 이번 작업의 핵심이다. 검색로봇이 이 주소를 요청하면
 * 자바스크립트 실행 없이도 제목·본문·작성자·댓글이 담긴 HTML 을 그대로 받는다.
 */

interface Props {
  params: Promise<{ slug: string; id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, id } = await params;
  const post = await getPost(id);
  if (!post) return { title: '없는 글' };

  const url = `/c/${slug}/post/${id}`;
  const description = summarize(post.content);

  return {
    title: post.title,
    description,
    keywords: [post.communityName, post.boardName, ...(post.tags ?? [])],
    authors: [{ name: post.authorNickname }],
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description,
      url,
      type: 'article',
      publishedTime: post.createdAt,
      modifiedTime: post.updatedAt ?? post.createdAt,
      authors: [post.authorNickname],
    },
    twitter: { card: 'summary_large_image', title: post.title, description },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug, id } = await params;
  const [post, community, comments] = await Promise.all([
    getPost(id),
    getCommunityBySlug(slug),
    listComments(id),
  ]);
  if (!post || !community) notFound();

  const url = `${site.url}/c/${slug}/post/${id}`;

  // 구조화 데이터 — 검색엔진에 "이건 커뮤니티 글"이라고 알려 준다
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'DiscussionForumPosting',
      headline: post.title,
      articleBody: post.content,
      url,
      datePublished: post.createdAt,
      dateModified: post.updatedAt ?? post.createdAt,
      author: { '@type': 'Person', name: post.authorNickname },
      keywords: (post.tags ?? []).join(', '),
      isPartOf: {
        '@type': 'WebSite',
        name: community.name,
        url: `${site.url}/c/${slug}`,
      },
      interactionStatistic: [
        {
          '@type': 'InteractionCounter',
          interactionType: 'https://schema.org/CommentAction',
          userInteractionCount: post.commentCount,
        },
        {
          '@type': 'InteractionCounter',
          interactionType: 'https://schema.org/LikeAction',
          userInteractionCount: post.likedBy.length,
        },
      ],
      comment: comments.map((c) => ({
        '@type': 'Comment',
        text: c.content,
        author: { '@type': 'Person', name: c.authorNickname },
        dateCreated: c.createdAt,
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: '홈', item: site.url },
        { '@type': 'ListItem', position: 2, name: community.name, item: `${site.url}/c/${slug}` },
        { '@type': 'ListItem', position: 3, name: post.title, item: url },
      ],
    },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav className="flex items-center gap-1.5 text-sm text-ink-mute mb-3" aria-label="위치">
        <Link href={`/c/${slug}`} className="font-semibold hover:text-ink">
          {community.name}
        </Link>
        <span>›</span>
        <span>{post.boardName}</span>
      </nav>

      <article className="bg-white rounded-2xl border border-hair p-5">
        <h1 className="text-xl font-black text-ink leading-snug">{post.title}</h1>

        <div className="flex items-center justify-between mt-3 pb-3 border-b border-hair">
          <div className="text-sm">
            <span className="font-bold text-ink-soft">{post.authorNickname}</span>
            <time className="text-xs text-ink-faint ml-2" dateTime={post.createdAt}>
              {timeAgo(post.createdAt)}
              {post.updatedAt && ' · 수정됨'}
            </time>
          </div>
          <div className="text-xs text-ink-faint tabular-nums">
            조회 {post.views} · 댓글 {post.commentCount}
          </div>
        </div>

        <div className="py-6 whitespace-pre-wrap leading-relaxed text-ink">{post.content}</div>

        {(post.tags ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 pb-4">
            {post.tags.map((t) => (
              <span key={t} className="text-xs text-ink-faint">
                #{t}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 border-t border-hair pt-3 text-sm">
          <span className="font-semibold text-ink">▲ 추천 {post.likedBy.length}</span>
          <span className="text-ink-mute">▼ 비추 {post.dislikedBy.length}</span>
          <Link href={`/c/${slug}`} className="ml-auto text-ink-mute font-semibold hover:text-ink">
            목록 →
          </Link>
        </div>
      </article>

      <section className="bg-white rounded-2xl border border-hair p-5 mt-4">
        <h2 className="font-bold text-ink mb-3">댓글 {comments.length}</h2>
        {comments.length === 0 ? (
          <p className="text-sm text-ink-faint py-4 text-center">첫 댓글을 남겨보세요.</p>
        ) : (
          <ul className="space-y-3">
            {comments.map((c) => (
              <li key={c.id} className="border-b border-hair pb-3 last:border-0 last:pb-0">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-ink-soft">{c.authorNickname}</span>
                  <time className="text-ink-faint" dateTime={c.createdAt}>
                    {timeAgo(c.createdAt)}
                  </time>
                  {c.likes > 0 && <span className="text-ink-faint">· 👍 {c.likes}</span>}
                </div>
                <p className="text-sm text-ink mt-1 whitespace-pre-wrap">{c.content}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
