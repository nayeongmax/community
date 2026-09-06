import { useEffect, useRef, useState } from 'react';
import * as arcade from '../lib/arcade';
import { AnonComment, BOARD_CATEGORIES, BoardCategory, BoardSort, PostView } from '../lib/arcade';
import { timeAgo } from '../lib/utils';

/** 게임 결과 등에서 넘어오는 글쓰기 초안 */
export interface BoardDraft {
  category: BoardCategory;
  title: string;
  content: string;
  scoreBadge?: string;
}

interface Props {
  /** 외부에서 글쓰기 폼을 미리 채워 열고 싶을 때 */
  draft?: BoardDraft | null;
  /** 초안을 소비했음을 알림 */
  onDraftUsed?: () => void;
}

const SORTS: [BoardSort, string][] = [
  ['new', '🆕 최신'],
  ['hot', '🔥 인기'],
  ['comments', '💬 댓글순'],
];

const CATEGORY_STYLE: Record<string, string> = {
  자유: 'bg-slate-100 text-slate-600',
  유머: 'bg-amber-100 text-amber-700',
  질문: 'bg-sky-100 text-sky-700',
  게임: 'bg-violet-100 text-violet-700',
  고민: 'bg-rose-100 text-rose-700',
  정보: 'bg-emerald-100 text-emerald-700',
};

const PAGE = 10;

export default function FreeBoard({ draft, onDraftUsed }: Props) {
  const [category, setCategory] = useState<BoardCategory | '전체'>('전체');
  const [sort, setSort] = useState<BoardSort>('new');
  const [q, setQ] = useState('');
  const [posts, setPosts] = useState<PostView[]>([]);
  const [limit, setLimit] = useState(PAGE);
  const [openId, setOpenId] = useState<string | null>(null);
  const [writing, setWriting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    category: '자유' as BoardCategory,
    title: '',
    content: '',
    password: '',
    scoreBadge: undefined as string | undefined,
  });
  const writeRef = useRef<HTMLDivElement | null>(null);

  const reload = () => {
    arcade.listPosts({ category, sort, q }).then(setPosts);
  };

  useEffect(reload, [category, sort, q]);

  // 게임 결과 자랑하기 → 폼을 채우고 열어 준다
  useEffect(() => {
    if (!draft) return;
    setForm((f) => ({ ...f, ...draft }));
    setWriting(true);
    setError('');
    onDraftUsed?.();
    window.setTimeout(
      () => writeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
      50
    );
  }, [draft, onDraftUsed]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await arcade.createPost({
        category: form.category,
        title: form.title,
        content: form.content,
        password: form.password,
        scoreBadge: form.scoreBadge,
      });
      setForm({ category: form.category, title: '', content: '', password: '', scoreBadge: undefined });
      setWriting(false);
      setError('');
      setSort('new');
      setCategory('전체');
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : '글을 올리지 못했습니다.');
    }
  };

  const toggleOpen = async (p: PostView) => {
    if (openId === p.id) {
      setOpenId(null);
      return;
    }
    await arcade.viewPost(p.id);
    setOpenId(p.id);
    reload();
  };

  const like = async (p: PostView) => {
    await arcade.toggleLike(p.id);
    reload();
  };

  const remove = async (p: PostView) => {
    // 데모 게시판이라 비밀번호 확인은 브라우저 prompt 로 간단히 처리한다
    const pw = p.mine ? '' : window.prompt('삭제하려면 비밀번호 4자리를 입력하세요') ?? '';
    if (!p.mine && !pw) return;
    if (p.mine && !window.confirm('이 글을 삭제할까요?')) return;
    try {
      await arcade.deletePost(p.id, pw);
      setOpenId(null);
      reload();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : '삭제하지 못했습니다.');
    }
  };

  const shown = posts.slice(0, limit);

  return (
    <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-100">
        <h2 className="font-black text-slate-800">💬 익명 자유게시판</h2>
        <span className="text-xs text-slate-400">닉네임 없이 편하게 · 글마다 랜덤 익명</span>
        <button
          onClick={() => {
            setWriting((w) => !w);
            setError('');
          }}
          className="ml-auto text-sm font-bold bg-indigo-600 text-white px-3 py-1.5 rounded-lg hover:bg-indigo-700"
        >
          {writing ? '닫기' : '✏️ 글쓰기'}
        </button>
      </div>

      {/* 카테고리 · 정렬 · 검색 */}
      <div className="px-4 py-3 border-b border-slate-100 space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {(['전체', ...BOARD_CATEGORIES] as const).map((c) => (
            <button
              key={c}
              onClick={() => {
                setCategory(c);
                setLimit(PAGE);
              }}
              className={`px-3 py-1.5 rounded-full text-sm font-bold ${
                category === c
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {SORTS.map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSort(key)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                  sort === key ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:bg-slate-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setLimit(PAGE);
            }}
            placeholder="게시판 검색"
            className="ml-auto w-40 bg-slate-100 rounded-full px-3 py-1.5 text-sm outline-none focus:ring-2 ring-indigo-300"
          />
        </div>
      </div>

      {/* 글쓰기 */}
      {writing && (
        <div ref={writeRef} className="px-4 py-4 bg-slate-50 border-b border-slate-100">
          <form onSubmit={submit} className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {BOARD_CATEGORIES.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setForm({ ...form, category: c })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                    form.category === c ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 border border-slate-200'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            {form.scoreBadge && (
              <p className="text-xs font-bold text-indigo-600">🏅 {form.scoreBadge} 기록이 함께 올라갑니다</p>
            )}
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="제목"
              maxLength={60}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 ring-indigo-300"
            />
            <textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="내용을 자유롭게 적어 주세요"
              rows={4}
              maxLength={1000}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 ring-indigo-300 resize-y"
            />
            <div className="flex items-center gap-2">
              <input
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value.replace(/\D/g, '').slice(0, 4) })
                }
                placeholder="삭제 비번 4자리"
                inputMode="numeric"
                className="w-36 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 ring-indigo-300"
              />
              <span className="text-xs text-slate-400">익명 닉네임은 자동으로 붙습니다</span>
              <button
                type="submit"
                className="ml-auto bg-indigo-600 text-white font-bold text-sm px-5 py-2 rounded-lg hover:bg-indigo-700"
              >
                등록
              </button>
            </div>
            {error && <p className="text-xs text-rose-500 font-semibold">{error}</p>}
          </form>
        </div>
      )}

      {/* 글 목록 */}
      <ul className="divide-y divide-slate-100">
        {shown.map((p) => (
          <li key={p.id}>
            <button
              onClick={() => toggleOpen(p)}
              className="w-full text-left px-4 py-3 hover:bg-slate-50 flex items-start gap-2"
            >
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${
                  CATEGORY_STYLE[p.category] ?? 'bg-slate-100 text-slate-600'
                }`}
              >
                {p.category}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-slate-800">{p.title}</span>
                  {p.commentCount > 0 && (
                    <span className="text-xs font-bold text-indigo-500">[{p.commentCount}]</span>
                  )}
                  {p.mine && (
                    <span className="text-[10px] font-bold bg-indigo-50 text-indigo-500 px-1.5 py-0.5 rounded">
                      내 글
                    </span>
                  )}
                </div>
                {p.scoreBadge && (
                  <span className="inline-block mt-1 text-[11px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                    🏅 {p.scoreBadge}
                  </span>
                )}
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-2 flex-wrap">
                  <span style={{ color: p.color }} className="font-semibold">
                    {p.nickname}
                  </span>
                  <span>· {timeAgo(p.createdAt)}</span>
                  <span>· 조회 {p.views}</span>
                  <span className={p.liked ? 'text-rose-500 font-bold' : ''}>· 👍 {p.likes}</span>
                </div>
              </div>
              <span className="text-slate-300 text-xs mt-1">{openId === p.id ? '▲' : '▼'}</span>
            </button>

            {openId === p.id && (
              <PostDetail post={p} onLike={() => like(p)} onDelete={() => remove(p)} onChanged={reload} />
            )}
          </li>
        ))}

        {shown.length === 0 && (
          <li className="px-4 py-12 text-center text-sm text-slate-400">
            아직 글이 없습니다. 첫 글을 남겨 보세요!
          </li>
        )}
      </ul>

      {posts.length > limit && (
        <button
          onClick={() => setLimit((l) => l + PAGE)}
          className="w-full py-3 text-sm font-bold text-slate-500 hover:bg-slate-50 border-t border-slate-100"
        >
          더보기 ({posts.length - limit}개 남음)
        </button>
      )}
    </section>
  );
}

/** 글 본문 + 댓글 */
function PostDetail({
  post,
  onLike,
  onDelete,
  onChanged,
}: {
  post: PostView;
  onLike: () => void;
  onDelete: () => void;
  onChanged: () => void;
}) {
  const [comments, setComments] = useState<(AnonComment & { mine: boolean })[]>([]);
  const [text, setText] = useState('');
  const [pw, setPw] = useState('');
  const [error, setError] = useState('');

  const load = () => {
    arcade.listComments(post.id).then(setComments);
  };

  useEffect(load, [post.id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await arcade.addComment(post.id, text, pw);
      setText('');
      setError('');
      load();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : '댓글을 올리지 못했습니다.');
    }
  };

  const removeComment = async (c: AnonComment & { mine: boolean }) => {
    const input = c.mine ? '' : window.prompt('삭제하려면 비밀번호 4자리를 입력하세요') ?? '';
    if (!c.mine && !input) return;
    try {
      await arcade.deleteComment(c.id, input);
      load();
      onChanged();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : '삭제하지 못했습니다.');
    }
  };

  return (
    <div className="px-4 pb-4 bg-slate-50/60">
      <p className="whitespace-pre-wrap text-sm text-slate-700 py-3 leading-relaxed">{post.content}</p>

      <div className="flex items-center gap-2">
        <button
          onClick={onLike}
          className={`text-sm font-bold px-3 py-1.5 rounded-lg border ${
            post.liked
              ? 'bg-rose-500 border-rose-500 text-white'
              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
          }`}
        >
          👍 추천 {post.likes}
        </button>
        <button
          onClick={onDelete}
          className="text-xs text-slate-400 hover:text-rose-500 px-2 py-1.5"
        >
          삭제
        </button>
      </div>

      <ul className="mt-3 space-y-2">
        {comments.map((c) => (
          <li key={c.id} className="bg-white rounded-lg px-3 py-2 border border-slate-100">
            <div className="flex items-center gap-2 text-xs">
              <span style={{ color: c.color }} className="font-bold">
                {c.nickname}
              </span>
              <span className="text-slate-400">{timeAgo(c.createdAt)}</span>
              <button
                onClick={() => removeComment(c)}
                className="ml-auto text-slate-300 hover:text-rose-500"
              >
                삭제
              </button>
            </div>
            <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">{c.content}</p>
          </li>
        ))}
        {comments.length === 0 && (
          <li className="text-xs text-slate-400 py-2">첫 댓글을 남겨 보세요.</li>
        )}
      </ul>

      <form onSubmit={submit} className="mt-2 flex flex-wrap gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="익명으로 댓글 달기"
          maxLength={300}
          className="flex-1 min-w-[160px] rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 ring-indigo-300"
        />
        <input
          value={pw}
          onChange={(e) => setPw(e.target.value.replace(/\D/g, '').slice(0, 4))}
          placeholder="비번 4자리"
          inputMode="numeric"
          className="w-28 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:ring-2 ring-indigo-300"
        />
        <button
          type="submit"
          className="bg-slate-800 text-white font-bold text-sm px-4 py-2 rounded-lg hover:bg-slate-700"
        >
          등록
        </button>
        {error && <p className="w-full text-xs text-rose-500 font-semibold">{error}</p>}
      </form>
    </div>
  );
}
