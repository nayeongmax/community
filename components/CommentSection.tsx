'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { deleteCommentAction, writeCommentAction } from '../lib/server/actions';
import SubmitButton from './SubmitButton';

export interface CommentRow {
  id: string;
  content: string;
  authorNickname: string;
  createdAt: string;
  likes: number;
  canDelete: boolean;
}

/** 댓글 목록 + 작성 (서버에 저장) */
export default function CommentSection({
  postId,
  slug,
  comments,
  loggedIn,
  timeLabels,
}: {
  postId: string;
  slug: string;
  comments: CommentRow[];
  loggedIn: boolean;
  timeLabels: Record<string, string>;
}) {
  const [state, action] = useActionState(writeCommentAction, {});

  return (
    <section className="bg-white rounded-2xl border border-hair p-5 mt-4">
      <h2 className="font-bold text-ink mb-3">댓글 {comments.length}</h2>

      {comments.length === 0 ? (
        <p className="text-sm text-ink-faint py-4 text-center">첫 댓글을 남겨보세요.</p>
      ) : (
        <ul className="space-y-3 mb-4">
          {comments.map((c) => (
            <li key={c.id} className="border-b border-hair pb-3 last:border-0 last:pb-0">
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-ink-soft">{c.authorNickname}</span>
                <time className="text-ink-faint" dateTime={c.createdAt}>
                  {timeLabels[c.id]}
                </time>
                {c.likes > 0 && <span className="text-ink-faint">· 👍 {c.likes}</span>}
                {c.canDelete && (
                  <form
                    action={deleteCommentAction.bind(null, c.id, postId, slug)}
                    className="ml-auto"
                    onSubmit={(e) => {
                      if (!confirm('댓글을 삭제할까요?')) e.preventDefault();
                    }}
                  >
                    <button className="text-ink-faint hover:text-rose-500">삭제</button>
                  </form>
                )}
              </div>
              <p className="text-sm text-ink mt-1 whitespace-pre-wrap">{c.content}</p>
            </li>
          ))}
        </ul>
      )}

      {loggedIn ? (
        <form action={action} className="flex gap-2">
          <input type="hidden" name="postId" value={postId} />
          <input type="hidden" name="slug" value={slug} />
          <input
            name="content"
            placeholder="댓글을 남겨보세요"
            maxLength={500}
            className="flex-1 rounded-lg border border-hair bg-ground px-3 py-2.5 text-sm outline-none focus:border-ink/30 focus:bg-white"
          />
          <SubmitButton className="bg-ink text-white font-bold text-sm px-4 py-2.5 rounded-lg hover:bg-ink-soft">
            등록
          </SubmitButton>
        </form>
      ) : (
        <p className="text-sm text-ink-mute text-center py-3">
          <Link href="/login" className="font-bold text-ink hover:underline">
            로그인
          </Link>{' '}
          후 댓글을 남길 수 있습니다.
        </p>
      )}

      {state.error && <p className="text-sm text-rose-500 mt-2">{state.error}</p>}
    </section>
  );
}
