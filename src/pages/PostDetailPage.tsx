import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import * as store from '../lib/store';
import { CommentView, PostView } from '../lib/store';
import { Community } from '../lib/types';
import { formatCount, timeAgo } from '../lib/utils';
import Avatar from '../components/Avatar';
import AttachmentView from '../components/AttachmentView';
import { siteOrigin, summarize, useSeo } from '../lib/seo';

export default function PostDetailPage() {
  const { slug, postId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [community, setCommunity] = useState<Community | null>(null);
  const [post, setPost] = useState<PostView | null>(null);
  const [comments, setComments] = useState<CommentView[]>([]);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  /** 이 커뮤니티의 운영자/관리자인지 — 모든 글을 삭제할 수 있다 */
  const [isManager, setIsManager] = useState(false);

  const load = useCallback(async () => {
    if (!slug || !postId) return;
    const c = await store.getCommunityBySlug(slug);
    setCommunity(c ?? null);
    if (c && user) {
      const ms = await store.getMembership(c.id, user.id);
      setIsManager(ms?.role === 'owner' || ms?.role === 'admin');
    } else {
      setIsManager(false);
    }
    const p = await store.getPost(postId);
    setPost(p ?? null);
    setComments(await store.listComments(postId));
    setLoading(false);
  }, [slug, postId, user]);

  useEffect(() => {
    if (postId) store.incrementViews(postId).then(load);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, user]);

  // 검색 결과에 이 글 하나만 잡히도록, 글 내용으로 메타·구조화 데이터를 만든다
  const origin = siteOrigin();
  const postPath = post && community ? `/c/${community.slug}/post/${post.id}` : undefined;
  useSeo(
    post && community
      ? {
          title: post.title,
          description: summarize(post.content),
          path: postPath,
          type: 'article',
          author: post.authorNickname,
          publishedAt: post.createdAt,
          modifiedAt: post.updatedAt ?? post.createdAt,
          keywords: [community.name, post.boardName, ...(post.tags ?? [])],
          jsonLd: [
            {
              '@context': 'https://schema.org',
              '@type': 'DiscussionForumPosting',
              headline: post.title,
              articleBody: post.content,
              url: origin + postPath,
              datePublished: post.createdAt,
              dateModified: post.updatedAt ?? post.createdAt,
              author: { '@type': 'Person', name: post.authorNickname },
              keywords: (post.tags ?? []).join(', '),
              isPartOf: { '@type': 'WebSite', name: community.name, url: `${origin}/c/${community.slug}` },
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
                {
                  '@type': 'InteractionCounter',
                  interactionType: 'https://schema.org/ViewAction',
                  userInteractionCount: post.views,
                },
              ],
            },
            {
              '@context': 'https://schema.org',
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: '홈', item: origin },
                { '@type': 'ListItem', position: 2, name: community.name, item: `${origin}/c/${community.slug}` },
                { '@type': 'ListItem', position: 3, name: post.boardName, item: `${origin}/c/${community.slug}` },
                { '@type': 'ListItem', position: 4, name: post.title, item: origin + postPath },
              ],
            },
          ],
        }
      : null
  );

  if (loading) return <p className="text-center text-ink-faint py-16">불러오는 중…</p>;
  if (!post || !community)
    return <div className="text-center py-16 text-ink-faint">삭제되었거나 없는 글입니다.</div>;

  const react = async (kind: 'like' | 'dislike') => {
    if (!user) return navigate('/login');
    await store.togglePostReaction(post.id, user.id, kind);
    setPost(await store.getPost(post.id) ?? null);
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    if (!commentText.trim()) return;
    await store.createComment({ postId: post.id, authorId: user.id, content: commentText });
    setCommentText('');
    setComments(await store.listComments(post.id));
    setPost(await store.getPost(post.id) ?? null);
  };

  const removeComment = async (id: string) => {
    if (!confirm('댓글을 삭제할까요?')) return;
    await store.deleteComment(id);
    setComments(await store.listComments(post.id));
    setPost(await store.getPost(post.id) ?? null);
  };

  const likeComment = async (id: string) => {
    if (!user) return navigate('/login');
    await store.toggleCommentLike(id, user.id);
    setComments(await store.listComments(post.id));
  };

  const removePost = async () => {
    if (!user) return navigate('/login');
    const mine = user.id === post.authorId;
    if (!confirm(mine ? '게시글을 삭제할까요?' : '운영자 권한으로 이 글을 삭제할까요?')) return;
    try {
      await store.deletePost(post.id, user.id);
      navigate(`/c/${community.slug}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : '글을 삭제하지 못했습니다.');
    }
  };

  /** 작성자 본인만 수정할 수 있다 */
  const isAuthor = !!user && user.id === post.authorId;
  /** 작성자이거나 이 커뮤니티 운영진이면 삭제할 수 있다 */
  const canRemove = isAuthor || isManager;
  const liked = user ? post.likedBy.includes(user.id) : false;
  const disliked = user ? post.dislikedBy.includes(user.id) : false;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-3 text-sm text-ink-mute flex items-center gap-1">
        <Link to={`/c/${community.slug}`} className="hover:text-ink font-semibold">
          {community.name}
        </Link>
        <span>›</span>
        <span>{post.boardName}</span>
      </div>

      <article className="bg-white rounded-2xl border border-hair p-5">
        <h1 className="text-xl font-black text-ink leading-snug text-balance">{post.title}</h1>
        <div className="flex items-center justify-between mt-3 pb-3 border-b border-hair">
          <div className="flex items-center gap-2">
            <Avatar nickname={post.authorNickname} color={post.authorColor} size={34} />
            <div>
              <div className="text-sm font-bold text-ink-soft">{post.authorNickname}</div>
              <div className="text-xs text-ink-faint">
                {timeAgo(post.createdAt)}
                {post.updatedAt && <span className="ml-1">· 수정됨</span>}
              </div>
            </div>
          </div>
          <div className="text-xs text-ink-faint text-right">
            조회 {formatCount(post.views)} · 댓글 {comments.length}
          </div>
        </div>

        <div className="py-6 whitespace-pre-wrap leading-relaxed text-ink min-h-[80px]">
          {post.content}
        </div>

        <AttachmentView items={post.attachments} />

        {/* 추천/비추천 */}
        <div className="flex flex-col items-center gap-2 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => react('like')}
              className={`flex flex-col items-center justify-center w-20 h-16 rounded-xl border font-bold transition-colors ${
                liked
                  ? 'bg-ink text-white border-ink'
                  : 'bg-white text-ink border-hair hover:border-ink/25'
              }`}
            >
              <span className="text-lg leading-none">▲</span>
              <span className="text-sm mt-1">추천 {post.likedBy.length}</span>
            </button>
            <button
              onClick={() => react('dislike')}
              className={`flex flex-col items-center justify-center w-20 h-16 rounded-xl border font-bold transition-colors ${
                disliked
                  ? 'bg-ink-mute text-white border-ink-mute'
                  : 'bg-white text-ink-mute border-hair hover:bg-ground'
              }`}
            >
              <span className="text-lg leading-none">▼</span>
              <span className="text-sm mt-1">비추 {post.dislikedBy.length}</span>
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-hair pt-3">
          <Link
            to={`/c/${community.slug}`}
            className="text-sm text-ink-mute font-semibold hover:text-ink"
          >
            ← 목록
          </Link>
          <div className="flex items-center gap-3">
            {isAuthor && (
              <Link
                to={`/c/${community.slug}/post/${post.id}/edit`}
                className="text-sm text-ink-mute font-semibold hover:text-ink"
              >
                수정
              </Link>
            )}
            {canRemove && (
              <button
                onClick={removePost}
                className="text-sm text-ink-faint font-semibold hover:text-rose-500"
              >
                삭제{!isAuthor && <span className="text-[11px] ml-1">(운영자)</span>}
              </button>
            )}
          </div>
        </div>
      </article>

      {/* 댓글 */}
      <section className="bg-white rounded-2xl border border-hair p-5 mt-4">
        <h2 className="font-bold text-ink-soft mb-3">댓글 {comments.length}</h2>
        <ul className="space-y-4">
          {comments.map((c) => {
            const cLiked = user ? c.likedBy.includes(user.id) : false;
            return (
              <li key={c.id} className="flex gap-3">
                <Avatar nickname={c.authorNickname} color={c.authorColor} size={32} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-ink-soft">{c.authorNickname}</span>
                    <span className="text-xs text-ink-faint">{timeAgo(c.createdAt)}</span>
                  </div>
                  <p className="text-sm text-ink mt-0.5 whitespace-pre-wrap break-words">
                    {c.content}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs">
                    <button
                      onClick={() => likeComment(c.id)}
                      className={`font-semibold ${cLiked ? 'text-ink' : 'text-ink-faint hover:text-ink'}`}
                    >
                      ♥ {c.likedBy.length}
                    </button>
                    {user?.id === c.authorId && (
                      <button
                        onClick={() => removeComment(c.id)}
                        className="text-ink-faint hover:text-rose-500"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
          {comments.length === 0 && (
            <li className="text-sm text-ink-faint text-center py-4">첫 댓글을 남겨보세요.</li>
          )}
        </ul>

        <form onSubmit={submitComment} className="mt-4 flex gap-2">
          <input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={user ? '댓글을 입력하세요' : '로그인 후 댓글을 남길 수 있어요'}
            disabled={!user}
            className="flex-1 border border-hair rounded-lg px-3 py-2.5 outline-none focus:ring-2 ring-ink/20 text-sm disabled:bg-ground"
          />
          <button
            disabled={!user}
            className="bg-ink text-white font-bold px-4 rounded-lg hover:bg-ink-soft disabled:opacity-50 text-sm"
          >
            등록
          </button>
        </form>
      </section>
    </div>
  );
}
