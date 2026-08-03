import { Board, Comment, Community, DB, Membership, MemberRole, Post, User } from './types';
import { colorFromString, slugify, uid } from './utils';
import { seedDB } from './seed';

/*
 * 데이터 접근 계층.
 *
 * 현재 구현: 브라우저 localStorage (단일 브라우저 내에서 완전 동작하는 프로토타입).
 * 모든 함수는 Promise 를 반환하므로, 추후 supabase.ts 를 사용해 동일한 시그니처로
 * 서버 백엔드(다중 사용자 공유)로 교체할 수 있습니다. UI 코드는 그대로 둡니다.
 *
 * 프로덕션 스키마는 프로젝트 루트의 supabase-schema.sql 참고.
 */

const STORAGE_KEY = 'community-platform-db-v2';

function emptyDB(): DB {
  return { users: [], communities: [], boards: [], memberships: [], posts: [], comments: [] };
}

function load(): DB {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as DB;
  } catch {
    /* ignore */
  }
  const seeded = seedDB(emptyDB());
  save(seeded);
  return seeded;
}

function save(db: DB): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

let _db: DB | null = null;
function db(): DB {
  if (!_db) _db = load();
  return _db;
}
function commit(): void {
  if (_db) save(_db);
}

const delay = <T>(v: T): Promise<T> => Promise.resolve(v);

// ---------------- Users ----------------

export async function createUser(email: string, nickname: string, password: string): Promise<User> {
  const d = db();
  if (d.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('이미 가입된 이메일입니다.');
  }
  if (d.users.some((u) => u.nickname === nickname)) {
    throw new Error('이미 사용 중인 닉네임입니다.');
  }
  const user: User = {
    id: uid('u_'),
    email,
    nickname,
    password,
    avatarColor: colorFromString(nickname),
    createdAt: new Date().toISOString(),
  };
  d.users.push(user);
  commit();
  return delay(user);
}

export async function authenticate(email: string, password: string): Promise<User> {
  const d = db();
  const user = d.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user || user.password !== password) {
    throw new Error('이메일 또는 비밀번호가 올바르지 않습니다.');
  }
  return delay(user);
}

export async function getUser(id: string): Promise<User | undefined> {
  return delay(db().users.find((u) => u.id === id));
}

// ---------------- Communities ----------------

export async function listCommunities(): Promise<Community[]> {
  return delay([...db().communities]);
}

export async function getCommunityBySlug(slug: string): Promise<Community | undefined> {
  return delay(db().communities.find((c) => c.slug === slug));
}

export async function getCommunity(id: string): Promise<Community | undefined> {
  return delay(db().communities.find((c) => c.id === id));
}

export async function createCommunity(input: {
  name: string;
  description: string;
  category?: string;
  topics?: string[];
  region?: string;
  kind?: Community['kind'];
  ownerId: string;
  isPublic: boolean;
}): Promise<Community> {
  const d = db();
  let slug = slugify(input.name);
  let n = 1;
  while (d.communities.some((c) => c.slug === slug)) {
    slug = slugify(input.name) + '-' + ++n;
  }
  const topics = normalizeTags(input.topics ?? (input.category ? [input.category] : []));
  const community: Community = {
    id: uid('c_'),
    slug,
    name: input.name.trim(),
    description: input.description.trim(),
    category: input.category ?? topics[0] ?? '기타',
    topics: topics.length ? topics : ['기타'],
    region: input.region,
    kind: input.kind ?? 'normal',
    themeColor: colorFromString(input.name + slug),
    ownerId: input.ownerId,
    isPublic: input.isPublic,
    createdAt: new Date().toISOString(),
  };
  d.communities.push(community);

  // 기본 게시판 2개: 공지사항, 자유게시판
  const now = Date.now();
  d.boards.push(
    {
      id: uid('b_'),
      communityId: community.id,
      name: '공지사항',
      order: 0,
      isNotice: true,
      createdAt: new Date(now).toISOString(),
    },
    {
      id: uid('b_'),
      communityId: community.id,
      name: '자유게시판',
      order: 1,
      createdAt: new Date(now + 1).toISOString(),
    }
  );

  // 개설자는 자동으로 운영자(owner) 멤버
  d.memberships.push({
    id: uid('m_'),
    communityId: community.id,
    userId: input.ownerId,
    role: 'owner',
    joinedAt: new Date().toISOString(),
  });

  commit();
  return delay(community);
}

// ---------------- Boards ----------------

export async function listBoards(communityId: string): Promise<Board[]> {
  return delay(
    db()
      .boards.filter((b) => b.communityId === communityId)
      .sort((a, b) => a.order - b.order)
  );
}

export async function createBoard(communityId: string, name: string): Promise<Board> {
  const d = db();
  const existing = d.boards.filter((b) => b.communityId === communityId);
  const board: Board = {
    id: uid('b_'),
    communityId,
    name: name.trim(),
    order: existing.length,
    createdAt: new Date().toISOString(),
  };
  d.boards.push(board);
  commit();
  return delay(board);
}

export async function deleteBoard(boardId: string): Promise<void> {
  const d = db();
  d.boards = d.boards.filter((b) => b.id !== boardId);
  d.posts = d.posts.filter((p) => p.boardId !== boardId);
  commit();
  return delay(undefined);
}

// ---------------- Memberships ----------------

export async function getMembership(
  communityId: string,
  userId: string
): Promise<Membership | undefined> {
  return delay(
    db().memberships.find((m) => m.communityId === communityId && m.userId === userId)
  );
}

export async function memberCount(communityId: string): Promise<number> {
  return delay(db().memberships.filter((m) => m.communityId === communityId).length);
}

export async function joinCommunity(communityId: string, userId: string): Promise<Membership> {
  const d = db();
  const existing = d.memberships.find(
    (m) => m.communityId === communityId && m.userId === userId
  );
  if (existing) return delay(existing);
  const m: Membership = {
    id: uid('m_'),
    communityId,
    userId,
    role: 'member',
    joinedAt: new Date().toISOString(),
  };
  d.memberships.push(m);
  commit();
  return delay(m);
}

export async function leaveCommunity(communityId: string, userId: string): Promise<void> {
  const d = db();
  d.memberships = d.memberships.filter(
    (m) => !(m.communityId === communityId && m.userId === userId && m.role !== 'owner')
  );
  commit();
  return delay(undefined);
}

export async function listMyCommunities(userId: string): Promise<Community[]> {
  const d = db();
  const ids = new Set(
    d.memberships.filter((m) => m.userId === userId).map((m) => m.communityId)
  );
  return delay(d.communities.filter((c) => ids.has(c.id)));
}

export async function listMembers(
  communityId: string
): Promise<{ user: User; role: MemberRole; joinedAt: string }[]> {
  const d = db();
  const out: { user: User; role: MemberRole; joinedAt: string }[] = [];
  for (const m of d.memberships.filter((x) => x.communityId === communityId)) {
    const user = d.users.find((u) => u.id === m.userId);
    if (user) out.push({ user, role: m.role, joinedAt: m.joinedAt });
  }
  return delay(out);
}

// ---------------- Posts ----------------

export interface PostView extends Post {
  authorNickname: string;
  authorColor: string;
  boardName: string;
  commentCount: number;
  /** 이 글이 속한 커뮤니티 정보 (통합 메인/검색에서 "어디서 왔는지" 표시용) */
  communityName: string;
  communitySlug: string;
  communityColor: string;
  communityCategory: string;
}

function toPostView(d: DB, p: Post): PostView {
  const author = d.users.find((u) => u.id === p.authorId);
  const board = d.boards.find((b) => b.id === p.boardId);
  const community = d.communities.find((c) => c.id === p.communityId);
  return {
    ...p,
    tags: p.tags ?? [],
    authorNickname: author?.nickname ?? '(탈퇴)',
    authorColor: author?.avatarColor ?? '#94a3b8',
    boardName: board?.name ?? '',
    commentCount: d.comments.filter((c) => c.postId === p.id).length,
    communityName: community?.name ?? '(삭제된 커뮤니티)',
    communitySlug: community?.slug ?? '',
    communityColor: community?.themeColor ?? '#94a3b8',
    communityCategory: community?.category ?? '기타',
  };
}

export async function listPosts(opts: {
  communityId: string;
  boardId?: string;
  limit?: number;
}): Promise<PostView[]> {
  const d = db();
  let posts = d.posts.filter((p) => p.communityId === opts.communityId);
  if (opts.boardId) posts = posts.filter((p) => p.boardId === opts.boardId);
  posts = posts.sort((a, b) => {
    if (!!b.pinned !== !!a.pinned) return b.pinned ? 1 : -1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  if (opts.limit) posts = posts.slice(0, opts.limit);
  return delay(posts.map((p) => toPostView(d, p)));
}

export async function getPost(id: string): Promise<PostView | undefined> {
  const d = db();
  const p = d.posts.find((x) => x.id === id);
  return delay(p ? toPostView(d, p) : undefined);
}

export async function incrementViews(id: string): Promise<void> {
  const d = db();
  const p = d.posts.find((x) => x.id === id);
  if (p) {
    p.views += 1;
    commit();
  }
  return delay(undefined);
}

export async function createPost(input: {
  communityId: string;
  boardId: string;
  authorId: string;
  title: string;
  content: string;
  tags?: string[];
}): Promise<Post> {
  const d = db();
  const post: Post = {
    id: uid('p_'),
    communityId: input.communityId,
    boardId: input.boardId,
    authorId: input.authorId,
    title: input.title.trim(),
    content: input.content,
    tags: normalizeTags(input.tags ?? []),
    views: 0,
    likedBy: [],
    dislikedBy: [],
    createdAt: new Date().toISOString(),
  };
  d.posts.push(post);
  commit();
  return delay(post);
}

export async function deletePost(id: string): Promise<void> {
  const d = db();
  d.posts = d.posts.filter((p) => p.id !== id);
  d.comments = d.comments.filter((c) => c.postId !== id);
  commit();
  return delay(undefined);
}

export async function togglePostReaction(
  postId: string,
  userId: string,
  kind: 'like' | 'dislike'
): Promise<Post | undefined> {
  const d = db();
  const p = d.posts.find((x) => x.id === postId);
  if (!p) return delay(undefined);
  p.likedBy = p.likedBy.filter((id) => id !== userId);
  p.dislikedBy = p.dislikedBy.filter((id) => id !== userId);
  if (kind === 'like') p.likedBy.push(userId);
  else p.dislikedBy.push(userId);
  commit();
  return delay(p);
}

// ---------------- Comments ----------------

export interface CommentView extends Comment {
  authorNickname: string;
  authorColor: string;
}

export async function listComments(postId: string): Promise<CommentView[]> {
  const d = db();
  return delay(
    d.comments
      .filter((c) => c.postId === postId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map((c) => {
        const author = d.users.find((u) => u.id === c.authorId);
        return {
          ...c,
          authorNickname: author?.nickname ?? '(탈퇴)',
          authorColor: author?.avatarColor ?? '#94a3b8',
        };
      })
  );
}

export async function createComment(input: {
  postId: string;
  authorId: string;
  content: string;
  parentId?: string | null;
}): Promise<Comment> {
  const d = db();
  const c: Comment = {
    id: uid('cm_'),
    postId: input.postId,
    authorId: input.authorId,
    content: input.content.trim(),
    parentId: input.parentId ?? null,
    likedBy: [],
    createdAt: new Date().toISOString(),
  };
  d.comments.push(c);
  commit();
  return delay(c);
}

export async function deleteComment(id: string): Promise<void> {
  const d = db();
  d.comments = d.comments.filter((c) => c.id !== id && c.parentId !== id);
  commit();
  return delay(undefined);
}

export async function toggleCommentLike(id: string, userId: string): Promise<void> {
  const d = db();
  const c = d.comments.find((x) => x.id === id);
  if (c) {
    if (c.likedBy.includes(userId)) c.likedBy = c.likedBy.filter((u) => u !== userId);
    else c.likedBy.push(userId);
    commit();
  }
  return delay(undefined);
}

// ---------------- Stats ----------------

export interface CommunityStat extends Community {
  members: number;
  posts: number;
  /** 최근 24시간 새 글 수 */
  recentPosts: number;
  /** 최근 24시간 새 댓글 수 */
  recentComments: number;
  /** 최근 24시간 새 멤버 수 */
  recentMembers: number;
  /** "지금 뜨는" 판단용 트렌드 점수 (최근 활동 기반) */
  trendScore: number;
  /** 마지막 활동 시각(글/댓글) */
  lastActiveAt: string;
}

function toCommunityStat(d: DB, c: Community): CommunityStat {
  const dayAgo = Date.now() - 24 * 3600000;
  const isRecent = (iso: string) => new Date(iso).getTime() >= dayAgo;
  const cPosts = d.posts.filter((p) => p.communityId === c.id);
  const postIds = new Set(cPosts.map((p) => p.id));
  const cComments = d.comments.filter((cm) => postIds.has(cm.postId));
  const cMembers = d.memberships.filter((m) => m.communityId === c.id);

  const recentPosts = cPosts.filter((p) => isRecent(p.createdAt)).length;
  const recentComments = cComments.filter((cm) => isRecent(cm.createdAt)).length;
  const recentMembers = cMembers.filter((m) => isRecent(m.joinedAt)).length;

  const times = [
    ...cPosts.map((p) => p.createdAt),
    ...cComments.map((cm) => cm.createdAt),
    c.createdAt,
  ];
  const lastActiveAt = times.sort().slice(-1)[0] ?? c.createdAt;

  return {
    ...c,
    topics: c.topics ?? [c.category],
    kind: c.kind ?? 'normal',
    members: cMembers.length,
    posts: cPosts.length,
    recentPosts,
    recentComments,
    recentMembers,
    // 최근 글·댓글·멤버에 가중치. "실시간으로 움직이는" 커뮤니티가 위로.
    trendScore: recentPosts * 3 + recentComments * 1.5 + recentMembers * 4,
    lastActiveAt,
  };
}

export async function listCommunitiesWithStats(): Promise<CommunityStat[]> {
  const d = db();
  return delay(d.communities.map((c) => toCommunityStat(d, c)));
}

/**
 * 주제/지역/유형별 커뮤니티 탐색.
 * - 한 커뮤니티가 여러 주제(topics)에 속하므로, topic 필터는 "그 주제를 포함하는 모든 커뮤니티"를 반환.
 */
export type CommunitySort = 'trend' | 'members' | 'new' | 'active';

export async function listCommunitiesBy(opts: {
  topic?: string;
  region?: string;
  kind?: Community['kind'];
  sort?: CommunitySort;
} = {}): Promise<CommunityStat[]> {
  const d = db();
  let list = d.communities.map((c) => toCommunityStat(d, c));

  if (opts.topic) {
    const t = opts.topic;
    list = list.filter((c) => c.topics.includes(t) || c.category === t);
  }
  if (opts.region) list = list.filter((c) => c.region === opts.region);
  if (opts.kind) list = list.filter((c) => c.kind === opts.kind);

  const sort = opts.sort ?? 'trend';
  list.sort((a, b) => {
    if (sort === 'members') return b.members - a.members;
    if (sort === 'new')
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sort === 'active')
      return new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime();
    return b.trendScore - a.trendScore || b.members - a.members; // trend
  });
  return delay(list);
}

/** 지금 뜨는 커뮤니티 (최근 활동 급상승) */
export async function listTrendingCommunities(limit = 8): Promise<CommunityStat[]> {
  const d = db();
  return delay(
    d.communities
      .map((c) => toCommunityStat(d, c))
      .filter((c) => c.trendScore > 0)
      .sort((a, b) => b.trendScore - a.trendScore)
      .slice(0, limit)
  );
}

// ---------------- 통합 피드 (디시식 메인 · 모든 커뮤니티 글이 섞여서 노출) ----------------

export type FeedSort = 'hot' | 'new' | 'comments' | 'top';

/** 태그 정규화: 앞의 # 제거, 공백 정리, 소문자 아닌 원문 유지, 중복 제거, 최대 5개 */
export function normalizeTags(tags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    const t = raw.replace(/^#/, '').trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
    if (out.length >= 5) break;
  }
  return out;
}

/**
 * 인기(hot) 점수 = 반응/댓글/조회에 시간 감쇠를 적용한 값.
 * 레딧과 유사하게 "최근 + 반응 많은" 글이 위로 올라오도록 한다.
 */
function hotScore(p: PostView, now: number): number {
  const ageHr = Math.max(0, (now - new Date(p.createdAt).getTime()) / 3600000);
  const engagement =
    p.likedBy.length * 3 + p.commentCount * 2 + p.views * 0.05 - p.dislikedBy.length * 2;
  // 시간 감쇠(약 12시간 반감기). +2 로 신생 글이 0으로 죽지 않게.
  return (engagement + 1) / Math.pow(ageHr + 2, 1.3);
}

/**
 * 전 커뮤니티 통합 글 피드.
 * - 글의 소속(커뮤니티/게시판)은 하나지만, 여기서는 전부 섞여서 노출된다.
 * - tag 로 필터하면 "그 태그가 붙은 여러 커뮤니티의 글"이 한 곳에 모인다(노출 여러 곳).
 * - q 로 검색하면 제목/내용/태그/커뮤니티명을 아우른다(전체검색).
 */
export async function listFeed(opts: {
  sort?: FeedSort;
  tag?: string;
  q?: string;
  excludeNotice?: boolean;
  limit?: number;
} = {}): Promise<PostView[]> {
  const d = db();
  const now = Date.now();
  let views = d.posts.map((p) => toPostView(d, p));

  if (opts.excludeNotice ?? true) {
    views = views.filter((p) => !p.pinned);
  }
  if (opts.tag) {
    const tag = opts.tag.toLowerCase();
    views = views.filter(
      (p) =>
        p.tags.some((t) => t.toLowerCase() === tag) ||
        p.communityCategory.toLowerCase() === tag
    );
  }
  if (opts.q) {
    const q = opts.q.toLowerCase();
    views = views.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        p.communityName.toLowerCase().includes(q)
    );
  }

  const sort = opts.sort ?? 'hot';
  views.sort((a, b) => {
    if (sort === 'new')
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sort === 'comments') return b.commentCount - a.commentCount;
    if (sort === 'top')
      return b.likedBy.length - b.dislikedBy.length - (a.likedBy.length - a.dislikedBy.length);
    return hotScore(b, now) - hotScore(a, now); // hot
  });

  return delay(opts.limit ? views.slice(0, opts.limit) : views);
}

/** 인기 태그(카테고리 칩용) — 글에 붙은 태그를 빈도순으로 집계 */
export async function listPopularTags(limit = 12): Promise<{ tag: string; count: number }[]> {
  const d = db();
  const counts = new Map<string, number>();
  for (const p of d.posts) {
    for (const t of p.tags ?? []) {
      const key = t.trim();
      if (!key) continue;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return delay(
    [...counts.entries()]
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  );
}

// ---------------- 전체 검색 (커뮤니티 + 글 동시) ----------------

export async function searchAll(
  query: string
): Promise<{ communities: CommunityStat[]; posts: PostView[] }> {
  const q = query.trim().toLowerCase();
  if (!q) return delay({ communities: [], posts: [] });
  const d = db();
  const communities = d.communities
    .filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        (c.topics ?? []).some((t) => t.toLowerCase().includes(q)) ||
        (c.region ?? '').toLowerCase().includes(q)
    )
    .map((c) => toCommunityStat(d, c));
  const posts = await listFeed({ q: query, sort: 'hot', excludeNotice: false });
  return delay({ communities, posts });
}

// ---------------- 오늘의 실시간 통계 (통계바용) ----------------

export interface SiteStats {
  totalCommunities: number;
  totalPosts: number;
  totalComments: number;
  todayPosts: number;
  todayComments: number;
  todayMembers: number;
}

export async function getSiteStats(): Promise<SiteStats> {
  const d = db();
  const dayAgo = Date.now() - 24 * 3600000;
  const isToday = (iso: string) => new Date(iso).getTime() >= dayAgo;
  return delay({
    totalCommunities: d.communities.length,
    totalPosts: d.posts.length,
    totalComments: d.comments.length,
    todayPosts: d.posts.filter((p) => isToday(p.createdAt)).length,
    todayComments: d.comments.filter((c) => isToday(c.createdAt)).length,
    todayMembers: d.memberships.filter((m) => isToday(m.joinedAt)).length,
  });
}
