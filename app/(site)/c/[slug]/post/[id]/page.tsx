import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCommunityBySlug, getPost, listComments } from '../../../../../../lib/server/queries';
import { currentUser, isManager, myRole } from '../../../../../../lib/server/session';
import { countViewAction } from '../../../../../../lib/server/actions';
import { site, summarize } from '../../../../../../lib/site';
import { timeAgo } from '../../../../../../lib/utils';
import PostActions from '../../../../../../components/PostActions';
import CommentSection from '../../../../../../components/CommentSection';

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
  // 글에 붙은 첫 이미지를 공유 카드 이미지로 쓴다
  const image = (post.attachments ?? []).find((a) => a.type === 'image')?.url;

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
      images: image ? [image] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug, id } = await params;
  const [post, community, comments, me] = await Promise.all([
    getPost(id),
    getCommunityBySlug(slug),
    listComments(id),
    currentUser(),
  ]);
  if (!post || !community) notFound();

  await countViewAction(post.id);

  const role = await myRole(community.id);
  const isAuthor = me?.id === post.authorId;
  // 작성자 본인이거나 운영진이면 지울 수 있다
  const canDelete = !!me && (isAuthor || isManager(role));

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
      image: (post.attachments ?? [])
        .filter((a) => a.type === 'image')
        .map((a) => site.url + a.url),
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

        {(post.attachments ?? []).length > 0 && (
          <div className="space-y-3 pb-4">
            {(post.attachments ?? []).map((a) =>
              a.type === 'link' ? (
                <a
                  key={a.id}
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-xl border border-hair px-3.5 py-3 hover:border-ink/25"
                >
                  <span>🔗</span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold text-ink truncate">{a.name}</span>
                    <span className="block text-[11px] text-ink-faint truncate">{a.url}</span>
                  </span>
                </a>
              ) : a.type === 'video' ? (
                <video key={a.id} src={a.url} controls className="w-full rounded-xl border border-hair bg-black" />
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  key={a.id}
                  src={a.url}
                  alt={a.name ?? '첨부 이미지'}
                  className="w-full rounded-xl border border-hair"
                  loading="lazy"
                />
              )
            )}
          </div>
        )}

        {(post.tags ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 pb-4">
            {post.tags.map((t) => (
              <span key={t} className="text-xs text-ink-faint">
                #{t}
              </span>
            ))}
          </div>
        )}

        <PostActions
          postId={post.id}
          slug={slug}
          likes={post.likedBy.length}
          dislikes={post.dislikedBy.length}
          liked={!!me && post.likedBy.includes(me.id)}
          disliked={!!me && post.dislikedBy.includes(me.id)}
          isAuthor={!!isAuthor}
          canDelete={canDelete}
        />
      </article>

      <CommentSection
        postId={post.id}
        slug={slug}
        loggedIn={!!me}
        comments={comments.map((c) => ({
          ...c,
          canDelete: !!me && (c.authorNickname === me.nickname || isManager(role)),
        }))}
        timeLabels={Object.fromEntries(comments.map((c) => [c.id, timeAgo(c.createdAt)]))}
      />
    </div>
  );
}
