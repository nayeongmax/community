'use client';

import { useState } from 'react';
import { Board } from '../lib/types';
import { createBoardAction, deleteBoardAction } from '../lib/server/actions';

/** 게시판 추가·삭제 */
export default function BoardManager({
  communityId,
  slug,
  boards,
}: {
  communityId: string;
  slug: string;
  boards: Board[];
}) {
  const [name, setName] = useState('');

  return (
    <section className="bg-white rounded-2xl border border-hair p-5">
      <h2 className="font-bold text-ink mb-3">게시판 {boards.length}개</h2>

      <ul className="space-y-1 mb-4">
        {boards.map((b) => (
          <li
            key={b.id}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-hair"
          >
            {b.isNotice && <span className="text-gold text-[10px]">●</span>}
            <span className="font-semibold text-ink text-sm">{b.name}</span>
            {b.isNotice ? (
              <span className="ml-auto text-[11px] text-ink-faint">공지 · 삭제 불가</span>
            ) : (
              <form
                action={deleteBoardAction.bind(null, b.id, slug)}
                className="ml-auto"
                onSubmit={(e) => {
                  if (!confirm(`"${b.name}" 게시판과 그 안의 모든 글을 삭제할까요?`)) {
                    e.preventDefault();
                  }
                }}
              >
                <button className="text-xs text-ink-faint hover:text-rose-500 font-semibold">
                  삭제
                </button>
              </form>
            )}
          </li>
        ))}
      </ul>

      <form
        action={async () => {
          await createBoardAction(communityId, slug, name);
          setName('');
        }}
        className="flex gap-2"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="새 게시판 이름"
          maxLength={20}
          className="flex-1 rounded-lg border border-hair bg-ground px-3 py-2 text-sm outline-none focus:border-ink/30 focus:bg-white"
        />
        <button className="bg-ink text-white font-bold text-sm px-4 py-2 rounded-lg hover:bg-ink-soft">
          추가
        </button>
      </form>
    </section>
  );
}
