'use client';

import Link from 'next/link';
import { deletePostAction, reactAction } from '../lib/server/actions';

/** 글 상세 하단의 추천·수정·삭제 */
export default function PostActions({
  postId,
  slug,
  likes,
  dislikes,
  liked,
  disliked,
  isAuthor,
  canDelete,
}: {
  postId: string;
  slug: string;
  likes: number;
  dislikes: number;
  liked: boolean;
  disliked: boolean;
  isAuthor: boolean;
  canDelete: boolean;
}) {
  return (
    <>
      <div className="flex justify-center gap-3 py-4">
        <form action={reactAction.bind(null, postId, slug, 'like')}>
          <button
            className={`flex flex-col items-center justify-center w-20 h-16 rounded-xl border font-bold transition-colors ${
              liked ? 'bg-ink text-white border-ink' : 'bg-white text-ink border-hair hover:border-ink/25'
            }`}
          >
            <span className="text-lg leading-none">▲</span>
            <span className="text-sm mt-1">추천 {likes}</span>
          </button>
        </form>
        <form action={reactAction.bind(null, postId, slug, 'dislike')}>
          <button
            className={`flex flex-col items-center justify-center w-20 h-16 rounded-xl border font-bold transition-colors ${
              disliked
                ? 'bg-ink-mute text-white border-ink-mute'
                : 'bg-white text-ink-mute border-hair hover:bg-ground'
            }`}
          >
            <span className="text-lg leading-none">▼</span>
            <span className="text-sm mt-1">비추 {dislikes}</span>
          </button>
        </form>
      </div>

      <div className="flex items-center justify-between border-t border-hair pt-3">
        <Link href={`/c/${slug}`} className="text-sm text-ink-mute font-semibold hover:text-ink">
          ← 목록
        </Link>
        <div className="flex items-center gap-3">
          {isAuthor && (
            <Link
              href={`/c/${slug}/post/${postId}/edit`}
              className="text-sm text-ink-mute font-semibold hover:text-ink"
            >
              수정
            </Link>
          )}
          {canDelete && (
            <form
              action={deletePostAction.bind(null, postId, slug)}
              onSubmit={(e) => {
                if (!confirm(isAuthor ? '게시글을 삭제할까요?' : '운영자 권한으로 이 글을 삭제할까요?')) {
                  e.preventDefault();
                }
              }}
            >
              <button className="text-sm text-ink-faint font-semibold hover:text-rose-500">
                삭제{!isAuthor && <span className="text-[11px] ml-1">(운영자)</span>}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
