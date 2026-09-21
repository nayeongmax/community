'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { Attachment, Board } from '../lib/types';
import { writePostAction } from '../lib/server/actions';
import SubmitButton from './SubmitButton';
import AttachmentField from './AttachmentField';

interface PostLike {
  id: string;
  title: string;
  content: string;
  tags: string[];
  boardId: string;
  attachments?: Attachment[];
}

/** 글쓰기 · 글수정 공용 폼 (서버에서 저장한다) */
export default function PostForm({
  slug,
  boards,
  post,
  defaultBoardId,
}: {
  slug: string;
  boards: Board[];
  post?: PostLike;
  defaultBoardId?: string;
}) {
  const [state, action] = useActionState(writePostAction, {});
  const [boardId, setBoardId] = useState(
    post?.boardId ?? defaultBoardId ?? boards[0]?.id ?? ''
  );

  const field =
    'w-full rounded-lg border border-hair bg-ground px-3 py-2.5 outline-none focus:border-ink/30 focus:bg-white';

  return (
    <form action={action} className="bg-white rounded-2xl border border-hair p-5 space-y-4">
      <input type="hidden" name="slug" value={slug} />
      {post && <input type="hidden" name="postId" value={post.id} />}
      <input type="hidden" name="boardId" value={boardId} />

      <select
        value={boardId}
        onChange={(e) => setBoardId(e.target.value)}
        className={`${field} font-semibold text-sm`}
      >
        {boards.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>

      <input
        name="title"
        defaultValue={post?.title}
        placeholder="제목"
        maxLength={120}
        className={`${field} font-semibold`}
      />

      <textarea
        name="content"
        defaultValue={post?.content}
        placeholder="내용을 입력하세요."
        rows={12}
        className={`${field} resize-y leading-relaxed`}
      />

      <div>
        <p className="text-sm font-bold text-ink-soft mb-2">사진 · 동영상 · 링크</p>
        <AttachmentField initial={post?.attachments} />
      </div>

      <div>
        <input
          name="tags"
          defaultValue={post?.tags?.join(', ')}
          placeholder="태그 (쉼표로 구분 · 예: 자동차, 정비)"
          className={`${field} text-sm`}
        />
        <p className="text-xs text-ink-faint mt-1">
          태그는 검색 키워드로도 쓰입니다. 글이 여러 곳에 노출됩니다.
        </p>
      </div>

      {state.error && <p className="text-sm text-rose-500">{state.error}</p>}

      <div className="flex justify-end gap-2">
        <Link
          href={post ? `/c/${slug}/post/${post.id}` : `/c/${slug}`}
          className="px-4 py-2.5 rounded-lg text-ink-mute font-semibold hover:bg-ground"
        >
          취소
        </Link>
        <SubmitButton
          className="bg-ink text-white font-bold px-6 py-2.5 rounded-lg hover:bg-ink-soft"
          pendingLabel="저장 중…"
        >
          {post ? '수정 완료' : '등록'}
        </SubmitButton>
      </div>
    </form>
  );
}
