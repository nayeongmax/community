'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnonPostView, BOARD_CATEGORIES, BoardCategory, BoardSort } from '../lib/board-types';
import {
  createAnonCommentAction,
  createAnonPostAction,
  deleteAnonPostAction,
  toggleAnonLikeAction,
} from '../lib/server/board-actions';
import { timeAgo } from '../lib/utils';
import SubmitButton from './SubmitButton';

export interface BoardDraft {
  category: BoardCategory;
  title: string;
  content: string;
  scoreBadge?: string;
}

const CATEGORY_STYLE: Record<string, string> = {
  자유: 'bg-slate-500/20 text-slate-300',
  유머: 'bg-amber-400/20 text-amber-300',
  질문: 'bg-sky-400/20 text-sky-300',
  게임: 'bg-violet-400/20 text-violet-300',
  고민: 'bg-rose-400/20 text-rose-300',
  정보: 'bg-emerald-400/20 text-emerald-300',
};

const SORTS: [BoardSort, string][] = [
  ['new', '🆕 최신'],
  ['hot', '🔥 인기'],
  ['comments', '💬 댓글순'],
];

/** 익명 자유게시판 — 글은 서버에 저장되어 모두가 함께 봅니다 */
export default function AnonBoard({
  posts,
  comments,
  category,
  sort,
  draft,
  onDraftUsed,
  onFilter,
}: {
  posts: AnonPostView[];
  comments: Record<string, { id: string; nickname: string; color: string; content: string; createdAt: string; mine: boolean }[]>;
  category: BoardCategory | '전체';
  sort: BoardSort;
  draft?: BoardDraft | null;
  onDraftUsed?: () => void;
  onFilter: (next: { category?: BoardCategory | '전체'; sort?: BoardSort }) => void;
}) {
  const router = useRouter();
  const [postState, postAction] = useActionState(createAnonPostAction, {});
  const [writing, setWriting] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [form, setForm] = useState<BoardDraft>({ category: '자유', title: '', content: '' });

  // 게임 결과 자랑하기로 넘어온 초안을 폼에 채운다
  useEffect(() => {
    if (!draft) return;
    setForm(draft);
    setWriting(true);
    onDraftUsed?.();
  }, [draft, onDraftUsed]);

  // 글이 저장되면 목록을 서버에서 다시 받아 온다
  useEffect(() => {
    if (!postState.ok) return;
    setForm({ category: form.category, title: '', content: '' });
    setWriting(false);
    router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postState]);

  const field =
    'w-full rounded-lg border border-white/10 bg-white/[0.06] text-slate-100 placeholder-slate-500 px-3 py-2 text-sm outline-none focus:ring-2 ring-amber-300/50';

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
        <h2 className="font-black text-white">💬 익명 자유게시판</h2>
        <span className="text-xs text-slate-400 hidden sm:block">
          닉네임 없이 편하게 · 글은 모두에게 보입니다
        </span>
        <button
          onClick={() => setWriting((w) => !w)}
          className="ml-auto text-sm font-bold bg-amber-300 text-slate-900 px-3 py-1.5 rounded-lg hover:bg-amber-200"
        >
          {writing ? '닫기' : '✏️ 글쓰기'}
        </button>
      </div>

      <div className="px-4 py-3 border-b border-white/10 space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {(['전체', ...BOARD_CATEGORIES] as const).map((c) => (
            <button
              key={c}
              onClick={() => onFilter({ category: c })}
              className={`px-3 py-1.5 rounded-full text-sm font-bold ${
                category === c
                  ? 'bg-amber-300 text-slate-900'
                  : 'bg-white/[0.06] text-slate-300 hover:bg-white/[0.12]'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {SORTS.map(([key, label]) => (
            <button
              key={key}
              onClick={() => onFilter({ sort: key })}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                sort === key ? 'bg-amber-300/15 text-amber-300' : 'text-slate-400 hover:bg-white/[0.08]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {writing && (
        <form action={postAction} className="px-4 py-4 bg-white/[0.03] border-b border-white/10 space-y-2">
          <input type="hidden" name="category" value={form.category} />
          {form.scoreBadge && <input type="hidden" name="scoreBadge" value={form.scoreBadge} />}

          <div className="flex flex-wrap gap-1.5">
            {BOARD_CATEGORIES.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setForm({ ...form, category: c })}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                  form.category === c
                    ? 'bg-amber-300 text-slate-900'
                    : 'bg-white/[0.06] text-slate-300 border border-white/10'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {form.scoreBadge && (
            <p className="text-xs font-bold text-amber-300">🏅 {form.scoreBadge} 기록이 함께 올라갑니다</p>
          )}

          <input
            name="title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="제목"
            maxLength={60}
            className={field}
          />
          <textarea
            name="content"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="내용을 자유롭게 적어 주세요"
            rows={4}
            maxLength={1000}
            className={`${field} resize-y`}
          />
          <div className="flex items-center gap-2 flex-wrap">
            <input
              name="password"
              placeholder="삭제 비번 4자리"
              inputMode="numeric"
              maxLength={4}
              className={`w-36 ${field}`}
            />
            <span className="text-xs text-slate-400">익명 닉네임은 자동으로 붙습니다</span>
            <SubmitButton className="ml-auto bg-amber-300 text-slate-900 font-bold text-sm px-5 py-2 rounded-lg hover:bg-amber-200">
              등록
            </SubmitButton>
          </div>
          {postState.error && <p className="text-xs text-rose-400 font-semibold">{postState.error}</p>}
        </form>
      )}

      <ul className="divide-y divide-white/[0.07]">
        {posts.map((p) => (
          <li key={p.id}>
            <button
              onClick={() => setOpenId(openId === p.id ? null : p.id)}
              className="w-full text-left px-4 py-3 hover:bg-white/[0.05] flex items-start gap-2"
            >
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${
                  CATEGORY_STYLE[p.category] ?? 'bg-white/10 text-slate-300'
                }`}
              >
                {p.category}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-slate-100">{p.title}</span>
                  {p.commentCount > 0 && (
                    <span className="text-xs font-bold text-amber-300">[{p.commentCount}]</span>
                  )}
                  {p.mine && (
                    <span className="text-[10px] font-bold bg-amber-300/15 text-amber-300 px-1.5 py-0.5 rounded">
                      내 글
                    </span>
                  )}
                </div>
                {p.scoreBadge && (
                  <span className="inline-block mt-1 text-[11px] font-bold bg-amber-300/15 text-amber-300 px-2 py-0.5 rounded-full">
                    🏅 {p.scoreBadge}
                  </span>
                )}
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                  <span style={{ color: p.color }} className="font-semibold">
                    {p.nickname}
                  </span>
                  <span>· {timeAgo(p.createdAt)}</span>
                  <span>· 조회 {p.views}</span>
                  <span className={p.liked ? 'text-rose-400 font-bold' : ''}>· 👍 {p.likes}</span>
                </div>
              </div>
              <span className="text-slate-500 text-xs mt-1">{openId === p.id ? '▲' : '▼'}</span>
            </button>

            {openId === p.id && (
              <AnonDetail post={p} comments={comments[p.id] ?? []} field={field} />
            )}
          </li>
        ))}
        {posts.length === 0 && (
          <li className="px-4 py-12 text-center text-sm text-slate-400">
            아직 글이 없습니다. 첫 글을 남겨 보세요!
          </li>
        )}
      </ul>
    </section>
  );
}

function AnonDetail({
  post,
  comments,
  field,
}: {
  post: AnonPostView;
  comments: { id: string; nickname: string; color: string; content: string; createdAt: string; mine: boolean }[];
  field: string;
}) {
  const router = useRouter();
  const [state, action] = useActionState(createAnonCommentAction, {});

  // 댓글이 달리면 목록을 다시 받아 온다
  useEffect(() => {
    if (state.ok) router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const remove = async () => {
    const pw = post.mine ? '' : window.prompt('삭제하려면 비밀번호 4자리를 입력하세요') ?? '';
    if (!post.mine && !pw) return;
    if (post.mine && !confirm('이 글을 삭제할까요?')) return;
    const res = await deleteAnonPostAction(post.id, pw);
    if (res.error) alert(res.error);
    else router.refresh();
  };

  return (
    <div className="px-4 pb-4 bg-white/[0.03]">
      <p className="whitespace-pre-wrap text-sm text-slate-300 py-3 leading-relaxed">{post.content}</p>

      <div className="flex items-center gap-2">
        <form action={toggleAnonLikeAction.bind(null, post.id)}>
          <button
            className={`text-sm font-bold px-3 py-1.5 rounded-lg border ${
              post.liked
                ? 'bg-rose-500 border-rose-500 text-white'
                : 'bg-white/[0.06] border-white/10 text-slate-300 hover:bg-white/[0.12]'
            }`}
          >
            👍 추천 {post.likes}
          </button>
        </form>
        <button onClick={remove} className="text-xs text-slate-500 hover:text-rose-400 px-2 py-1.5">
          삭제
        </button>
      </div>

      <ul className="mt-3 space-y-2">
        {comments.map((c) => (
          <li key={c.id} className="bg-white/[0.05] rounded-lg px-3 py-2 border border-white/10">
            <div className="flex items-center gap-2 text-xs">
              <span style={{ color: c.color }} className="font-bold">
                {c.nickname}
              </span>
              <span className="text-slate-400">{timeAgo(c.createdAt)}</span>
            </div>
            <p className="text-sm text-slate-300 mt-1 whitespace-pre-wrap">{c.content}</p>
          </li>
        ))}
        {comments.length === 0 && <li className="text-xs text-slate-400 py-2">첫 댓글을 남겨 보세요.</li>}
      </ul>

      <form action={action} className="mt-2 flex flex-wrap gap-2">
        <input type="hidden" name="postId" value={post.id} />
        <input
          name="content"
          placeholder="익명으로 댓글 달기"
          maxLength={300}
          className={`flex-1 min-w-[160px] ${field}`}
        />
        <input
          name="password"
          placeholder="비번 4자리"
          inputMode="numeric"
          maxLength={4}
          className={`w-28 ${field}`}
        />
        <SubmitButton className="bg-white/10 text-white font-bold text-sm px-4 py-2 rounded-lg hover:bg-white/20">
          등록
        </SubmitButton>
        {state.error && <p className="w-full text-xs text-rose-400 font-semibold">{state.error}</p>}
      </form>
    </div>
  );
}
