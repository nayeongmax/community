import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import * as store from '../lib/store';
import { Board, Community, MemberRole } from '../lib/types';
import { timeAgo } from '../lib/utils';
import Avatar from '../components/Avatar';
import CommunityBranding from '../components/CommunityBranding';

export default function CommunitySettingsPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [community, setCommunity] = useState<Community | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [members, setMembers] = useState<
    { user: { id: string; nickname: string; avatarColor: string }; role: MemberRole; joinedAt: string }[]
  >([]);
  const [newBoard, setNewBoard] = useState('');
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!slug) return;
    const c = await store.getCommunityBySlug(slug);
    if (!c) return navigate('/');
    setCommunity(c);
    const ms = user ? await store.getMembership(c.id, user.id) : undefined;
    const isManager = ms?.role === 'owner' || ms?.role === 'admin';
    setAllowed(!!isManager);
    setBoards(await store.listBoards(c.id));
    setMembers(await store.listMembers(c.id));
    setLoading(false);
  }, [slug, user, navigate]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <p className="text-center text-ink-faint py-16">불러오는 중…</p>;
  if (!community) return null;
  if (!allowed)
    return (
      <div className="text-center py-16 text-ink-faint">
        이 커뮤니티의 운영자만 접근할 수 있습니다.
        <div>
          <Link to={`/c/${community.slug}`} className="text-ink font-semibold mt-2 inline-block">
            커뮤니티로 돌아가기
          </Link>
        </div>
      </div>
    );

  const addBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newBoard.trim().length < 1) return;
    await store.createBoard(community.id, newBoard.trim());
    setNewBoard('');
    setBoards(await store.listBoards(community.id));
  };

  const removeBoard = async (b: Board) => {
    if (b.isNotice) return alert('공지사항 게시판은 삭제할 수 없습니다.');
    if (!confirm(`"${b.name}" 게시판과 그 안의 모든 글을 삭제할까요?`)) return;
    await store.deleteBoard(b.id);
    setBoards(await store.listBoards(community.id));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-black text-ink">커뮤니티 관리</h1>
        <Link
          to={`/c/${community.slug}`}
          className="text-sm text-ink-mute font-semibold hover:text-ink"
        >
          ← {community.name}
        </Link>
      </div>

      <CommunityBranding community={community} onChanged={load} />

      {/* 게시판 관리 */}
      <section className="bg-white rounded-2xl border border-hair p-5 mb-4">
        <h2 className="font-bold text-ink-soft mb-3">게시판 관리</h2>
        <ul className="space-y-2 mb-4">
          {boards.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between bg-ground rounded-lg px-3 py-2"
            >
              <span className="text-sm font-semibold text-ink-soft flex items-center gap-1">
                {b.isNotice && <span className="text-gold text-[10px]">●</span>}
                {b.name}
              </span>
              {!b.isNotice && (
                <button
                  onClick={() => removeBoard(b)}
                  className="text-xs text-ink-faint hover:text-rose-500 font-semibold"
                >
                  삭제
                </button>
              )}
            </li>
          ))}
        </ul>
        <form onSubmit={addBoard} className="flex gap-2">
          <input
            value={newBoard}
            onChange={(e) => setNewBoard(e.target.value)}
            placeholder="새 게시판 이름"
            maxLength={20}
            className="flex-1 border border-hair rounded-lg px-3 py-2 outline-none focus:ring-2 ring-ink/20 text-sm"
          />
          <button className="bg-ink text-white font-bold px-4 rounded-lg hover:bg-ink-soft text-sm">
            추가
          </button>
        </form>
      </section>

      {/* 멤버 목록 */}
      <section className="bg-white rounded-2xl border border-hair p-5">
        <h2 className="font-bold text-ink-soft mb-3">멤버 {members.length}명</h2>
        <ul className="space-y-2">
          {members.map((m) => (
            <li key={m.user.id} className="flex items-center gap-2">
              <Avatar nickname={m.user.nickname} color={m.user.avatarColor} size={30} />
              <span className="text-sm font-semibold text-ink-soft">{m.user.nickname}</span>
              {m.role !== 'member' && (
                <span className="text-[11px] bg-ground border border-hair text-ink px-1.5 py-0.5 rounded font-bold">
                  {m.role === 'owner' ? '운영자' : '관리자'}
                </span>
              )}
              <span className="text-xs text-ink-faint ml-auto">{timeAgo(m.joinedAt)} 가입</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
