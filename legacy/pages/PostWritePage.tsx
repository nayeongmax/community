import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import * as store from '../lib/store';
import { Attachment, Board, Community } from '../lib/types';
import AttachmentEditor from '../components/AttachmentEditor';

export default function PostWritePage() {
  // postId 가 있으면 수정 모드
  const { slug, postId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [community, setCommunity] = useState<Community | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [boardId, setBoardId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const c = await store.getCommunityBySlug(slug);
      if (!c) return navigate('/');
      setCommunity(c);
      const all = await store.listBoards(c.id);
      // 공지 게시판은 운영자만 글쓰기 가능
      const membership = user ? await store.getMembership(c.id, user.id) : undefined;
      const isManager = membership?.role === 'owner' || membership?.role === 'admin';
      const writable = all.filter((b) => !b.isNotice || isManager);
      setBoards(writable);
      if (postId) {
        // 수정 모드 — 작성자 본인만
        const p = await store.getPost(postId);
        if (!p || p.communityId !== c.id) return navigate(`/c/${c.slug}`);
        if (!user || p.authorId !== user.id) {
          setError('글을 수정할 권한이 없습니다.');
          setReady(true);
          return;
        }
        setBoardId(p.boardId);
        setTitle(p.title);
        setContent(p.content);
        setTagInput((p.tags ?? []).join(', '));
        setAttachments(p.attachments ?? []);
        setReady(true);
        return;
      }

      const pref = params.get('b');
      setBoardId(pref && writable.some((b) => b.id === pref) ? pref : writable[0]?.id ?? '');
      setReady(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (!user)
    return (
      <div className="text-center py-20 text-ink-mute">
        로그인 후 글을 작성할 수 있습니다.
      </div>
    );
  if (!ready || !community)
    return <p className="text-center text-ink-faint py-16">불러오는 중…</p>;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!boardId) return setError('게시판을 선택해주세요.');
    if (title.trim().length < 1) return setError('제목을 입력해주세요.');
    if (content.trim().length < 1) return setError('내용을 입력해주세요.');
    setBusy(true);
    try {
      // 멤버가 아니면 자동 가입 처리
      const ms = await store.getMembership(community.id, user.id);
      if (!ms) await store.joinCommunity(community.id, user.id);
      const tags = tagInput
        .split(/[,\s]+/)
        .map((t) => t.replace(/^#/, '').trim())
        .filter(Boolean);
      if (postId) {
        await store.updatePost(postId, user.id, { title, content, tags, boardId, attachments });
        navigate(`/c/${community.slug}/post/${postId}`);
        return;
      }

      const post = await store.createPost({
        communityId: community.id,
        boardId,
        authorId: user.id,
        title,
        content,
        tags,
        attachments,
      });
      navigate(`/c/${community.slug}/post/${post.id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-black text-ink mb-4">
        {postId ? '글 수정' : '글쓰기'} · {community.name}
      </h1>
      <form onSubmit={submit} className="bg-white rounded-2xl border border-hair p-5 space-y-4">
        <select
          value={boardId}
          onChange={(e) => setBoardId(e.target.value)}
          className="border border-hair rounded-lg px-3 py-2 outline-none focus:ring-2 ring-ink/20 bg-white text-sm font-semibold"
        >
          {boards.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목"
          maxLength={120}
          className="w-full border border-hair rounded-lg px-3 py-2.5 outline-none focus:ring-2 ring-ink/20 font-semibold"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="내용을 입력하세요."
          rows={12}
          className="w-full border border-hair rounded-lg px-3 py-2.5 outline-none focus:ring-2 ring-ink/20 resize-y leading-relaxed"
        />
        {/* 첨부 */}
        <div>
          <p className="text-sm font-bold text-ink-soft mb-2">사진 · 동영상 · 링크</p>
          <AttachmentEditor items={attachments} onChange={setAttachments} />
        </div>

        <div>
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="태그 (쉼표/공백으로 구분 · 예: 자동차, 수입차, 정비)"
            className="w-full border border-hair rounded-lg px-3 py-2.5 outline-none focus:ring-2 ring-ink/20 text-sm"
          />
          <p className="text-xs text-ink-faint mt-1">
            태그를 달면 이 글이 메인·검색·같은 태그 피드 등 여러 곳에 노출됩니다. (글 원본은 하나)
          </p>
        </div>
        {error && <p className="text-sm text-rose-500">{error}</p>}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2.5 rounded-lg text-ink-mute font-semibold hover:bg-ground"
          >
            취소
          </button>
          <button
            disabled={busy}
            className="bg-ink text-white font-bold px-6 py-2.5 rounded-lg hover:bg-ink-soft disabled:opacity-60"
          >
            {busy ? '저장 중…' : postId ? '수정 완료' : '등록'}
          </button>
        </div>
      </form>
    </div>
  );
}
