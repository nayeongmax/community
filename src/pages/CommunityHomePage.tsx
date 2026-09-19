import { useEffect, useState, useCallback } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import * as store from '../lib/store';
import { Board, Community, Membership } from '../lib/types';
import { PostView } from '../lib/store';
import { formatCount, timeAgo } from '../lib/utils';
import CommunityAvatar from '../components/CommunityAvatar';
import MediaImage from '../components/MediaImage';

export default function CommunityHomePage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const [community, setCommunity] = useState<Community | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [posts, setPosts] = useState<PostView[]>([]);
  const [membership, setMembership] = useState<Membership | undefined>();
  const [members, setMembers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const activeBoard = params.get('b') || '';

  const refresh = useCallback(async () => {
    if (!slug) return;
    const c = await store.getCommunityBySlug(slug);
    if (!c) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setCommunity(c);
    const [bds, ms, mc] = await Promise.all([
      store.listBoards(c.id),
      user ? store.getMembership(c.id, user.id) : Promise.resolve(undefined),
      store.memberCount(c.id),
    ]);
    setBoards(bds);
    setMembership(ms);
    setMembers(mc);
    const ps = await store.listPosts({
      communityId: c.id,
      boardId: activeBoard || undefined,
    });
    setPosts(ps);
    setLoading(false);
  }, [slug, user, activeBoard]);

  useEffect(() => {
    setLoading(true);
    refresh();
  }, [refresh]);

  if (loading) return <p className="text-center text-ink-faint py-16">불러오는 중…</p>;
  if (notFound || !community)
    return (
      <div className="text-center py-16 text-ink-faint">
        존재하지 않는 커뮤니티입니다.
        <div>
          <Link to="/" className="text-ink font-semibold mt-2 inline-block">
            홈으로
          </Link>
        </div>
      </div>
    );

  const isMember = !!membership;
  const isManager = membership?.role === 'owner' || membership?.role === 'admin';

  const toggleJoin = async () => {
    if (!user) return navigate('/login');
    if (isMember) {
      if (membership?.role === 'owner') return alert('운영자는 탈퇴할 수 없습니다.');
      await store.leaveCommunity(community.id, user.id);
    } else {
      await store.joinCommunity(community.id, user.id);
    }
    refresh();
  };

  const selectBoard = (id: string) => {
    if (id) setParams({ b: id });
    else setParams({});
  };

  return (
    <div>
      {/* 커뮤니티 헤더 */}
      <div className="bg-white rounded-2xl border border-hair overflow-hidden mb-4">
        {community.titleMediaId ? (
          <MediaImage
            id={community.titleMediaId}
            alt={`${community.name} 타이틀`}
            className="w-full object-cover"
            style={{ aspectRatio: '4 / 1' }}
          />
        ) : (
          <div className="h-1" style={{ background: community.themeColor }} />
        )}
        <div className="p-5">
          <div className="flex items-start justify-between gap-3">
            <CommunityAvatar
              slug={community.slug}
              emoji={community.emoji}
              mediaId={community.avatarMediaId}
              size={56}
              className="rounded-2xl"
            />
            <div className="flex gap-2">
              {isManager && (
                <Link
                  to={`/c/${community.slug}/settings`}
                  className="text-sm font-semibold border border-hair text-ink-mute px-3 py-2 rounded-lg hover:bg-ground"
                >
                  관리
                </Link>
              )}
              <button
                onClick={toggleJoin}
                className={`text-sm font-bold px-4 py-2 rounded-lg ${
                  isMember
                    ? 'bg-ground text-ink-mute border border-hair hover:border-ink/25'
                    : 'bg-ink text-white hover:bg-ink-soft'
                }`}
              >
                {isMember ? (membership?.role === 'owner' ? '운영자' : '가입됨') : '+ 가입하기'}
              </button>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-black text-ink">{community.name}</h1>
            {community.kind === 'fan' && (
              <span className="text-[11px] font-bold border border-hair text-ink-mute px-2 py-0.5 rounded-full">
                팬
              </span>
            )}
            {community.kind === 'featured' && (
              <span className="text-[11px] font-bold bg-gold-wash text-gold px-2 py-0.5 rounded-full">
                대표
              </span>
            )}
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
            {(community.topics ?? [community.category]).map((t) => (
              <Link
                key={t}
                to={`/browse/topic?tab=${encodeURIComponent(t)}`}
                className="text-xs text-ink-mute border border-hair px-2 py-0.5 rounded-full hover:border-ink/25"
              >
                {t}
              </Link>
            ))}
            {community.region && (
              <Link
                to={`/browse/region?tab=${encodeURIComponent(community.region)}`}
                className="text-xs text-ink-mute border border-hair px-2 py-0.5 rounded-full hover:border-ink/25"
              >
                📍 {community.region}
              </Link>
            )}
          </div>
          <p className="text-sm text-ink-mute mt-2">{community.description}</p>
          <div className="mt-2 text-xs text-ink-faint">멤버 {formatCount(members)}명</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] gap-4">
        {/* 게시판 목록 */}
        <aside className="bg-white rounded-2xl border border-hair p-2 h-fit md:sticky md:top-20">
          <button
            onClick={() => selectBoard('')}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold ${
              !activeBoard ? 'bg-ink text-white' : 'text-ink-mute hover:bg-ground hover:text-ink'
            }`}
          >
            전체글
          </button>
          {boards.map((b) => (
            <button
              key={b.id}
              onClick={() => selectBoard(b.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-1 ${
                activeBoard === b.id
                  ? 'bg-ink text-white'
                  : 'text-ink-mute hover:bg-ground hover:text-ink'
              }`}
            >
              {b.isNotice && <span className="text-gold text-[10px]">●</span>}
              {b.name}
            </button>
          ))}
        </aside>

        {/* 글 목록 */}
        <section className="bg-white rounded-2xl border border-hair overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-hair">
            <h2 className="font-bold text-ink-soft">
              {activeBoard ? boards.find((b) => b.id === activeBoard)?.name : '전체글'}
            </h2>
            {isMember && (
              <Link
                to={`/c/${community.slug}/write${activeBoard ? `?b=${activeBoard}` : ''}`}
                className="text-sm font-bold bg-ink text-white px-3 py-1.5 rounded-lg hover:bg-ink-soft"
              >
                글쓰기
              </Link>
            )}
          </div>

          {posts.length === 0 ? (
            <div className="text-center py-16 text-ink-faint text-sm">
              아직 글이 없어요.
              {isMember && ' 첫 글을 남겨보세요!'}
            </div>
          ) : (
            <ul className="divide-y divide-hair">
              {posts.map((p) => (
                <li key={p.id}>
                  <Link
                    to={`/c/${community.slug}/post/${p.id}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-ground"
                  >
                    {p.pinned && (
                      <span className="text-[10px] font-bold text-gold bg-gold-wash px-1.5 py-0.5 rounded shrink-0">공지</span>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-ink-faint shrink-0">{p.boardName}</span>
                        <span className="font-semibold text-ink truncate">{p.title}</span>
                        {p.commentCount > 0 && (
                          <span className="text-xs font-bold text-ink-mute shrink-0">
                            [{p.commentCount}]
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-ink-faint mt-0.5 flex items-center gap-2 flex-wrap">
                        <span>{p.authorNickname}</span>
                        <span>·</span>
                        <span>{timeAgo(p.createdAt)}</span>
                        {p.tags.slice(0, 3).map((t) => (
                          <span key={t} className="text-ink-faint">
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-xs text-ink-faint text-right shrink-0 hidden sm:block">
                      <div>조회 {formatCount(p.views)}</div>
                      <div className="text-ink-mute font-semibold tabular-nums">▲ {p.likedBy.length}</div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
