// Supabase 저장소 — 배포용
//
// 서버(Next.js)에서만 접근하고 권한 검사는 서버 코드에서 하므로 service_role 키를 쓴다.
// 이 키는 절대 브라우저로 나가면 안 되므로 NEXT_PUBLIC_ 접두사를 붙이지 않는다.

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AdBanner } from '../ads-types';
import { AnonComment, AnonPost, BoardCategory } from '../../board-types';
import { Attachment, Board, Comment, Community, Membership, Post, User } from '../../types';
import { Repo } from './types';

let client: SupabaseClient | null = null;

/**
 * 서버용 비밀 키.
 * Supabase 가 키 이름을 바꾸는 중이라 둘 다 받는다.
 *   - 새 이름 : SUPABASE_SECRET_KEY        (sb_secret_... )
 *   - 옛 이름 : SUPABASE_SERVICE_ROLE_KEY  (eyJ... JWT)
 * 키를 재발급하면 이 값만 갈아 끼우면 된다.
 */
export function supabaseKey(): string | undefined {
  return process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export function supabase(): SupabaseClient {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = supabaseKey();
  if (!url || !key) {
    throw new Error('SUPABASE_URL / SUPABASE_SECRET_KEY 가 없습니다.');
  }
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

export function hasSupabase(): boolean {
  return !!(process.env.SUPABASE_URL && supabaseKey());
}

/* ---------- DB 행 ↔ 앱 타입 ---------- */

type Row = Record<string, unknown>;

const toUser = (r: Row): User => ({
  id: r.id as string,
  email: r.email as string,
  nickname: r.nickname as string,
  password: r.password as string,
  avatarColor: r.avatar_color as string,
  createdAt: r.created_at as string,
});

const fromUser = (u: User): Row => ({
  id: u.id,
  email: u.email,
  nickname: u.nickname,
  password: u.password,
  avatar_color: u.avatarColor,
  created_at: u.createdAt,
});

const toCommunity = (r: Row): Community => ({
  id: r.id as string,
  slug: r.slug as string,
  name: r.name as string,
  description: r.description as string,
  category: r.category as string,
  topics: (r.topics as string[]) ?? [],
  region: (r.region as string) ?? undefined,
  kind: r.kind as Community['kind'],
  themeColor: r.theme_color as string,
  emoji: (r.emoji as string) ?? undefined,
  avatarUrl: (r.avatar_url as string) ?? undefined,
  titleUrl: (r.title_url as string) ?? undefined,
  ownerId: r.owner_id as string,
  isPublic: r.is_public as boolean,
  createdAt: r.created_at as string,
});

const fromCommunity = (c: Partial<Community>): Row => {
  const r: Row = {};
  if (c.id !== undefined) r.id = c.id;
  if (c.slug !== undefined) r.slug = c.slug;
  if (c.name !== undefined) r.name = c.name;
  if (c.description !== undefined) r.description = c.description;
  if (c.category !== undefined) r.category = c.category;
  if (c.topics !== undefined) r.topics = c.topics;
  if (c.region !== undefined) r.region = c.region ?? null;
  if (c.kind !== undefined) r.kind = c.kind;
  if (c.themeColor !== undefined) r.theme_color = c.themeColor;
  if (c.emoji !== undefined) r.emoji = c.emoji ?? null;
  if (c.avatarUrl !== undefined) r.avatar_url = c.avatarUrl ?? null;
  if (c.titleUrl !== undefined) r.title_url = c.titleUrl ?? null;
  if (c.ownerId !== undefined) r.owner_id = c.ownerId;
  if (c.isPublic !== undefined) r.is_public = c.isPublic;
  if (c.createdAt !== undefined) r.created_at = c.createdAt;
  return r;
};

const toBoard = (r: Row): Board => ({
  id: r.id as string,
  communityId: r.community_id as string,
  name: r.name as string,
  order: r.order as number,
  isNotice: (r.is_notice as boolean) || undefined,
  createdAt: r.created_at as string,
});

const fromBoard = (b: Board): Row => ({
  id: b.id,
  community_id: b.communityId,
  name: b.name,
  order: b.order,
  is_notice: !!b.isNotice,
  created_at: b.createdAt,
});

const toMembership = (r: Row): Membership => ({
  id: r.id as string,
  communityId: r.community_id as string,
  userId: r.user_id as string,
  role: r.role as Membership['role'],
  joinedAt: r.joined_at as string,
});

const fromMembership = (m: Membership): Row => ({
  id: m.id,
  community_id: m.communityId,
  user_id: m.userId,
  role: m.role,
  joined_at: m.joinedAt,
});

const toPost = (r: Row): Post => ({
  id: r.id as string,
  communityId: r.community_id as string,
  boardId: r.board_id as string,
  authorId: r.author_id as string,
  title: r.title as string,
  content: r.content as string,
  tags: (r.tags as string[]) ?? [],
  views: r.views as number,
  likedBy: (r.liked_by as string[]) ?? [],
  dislikedBy: (r.disliked_by as string[]) ?? [],
  attachments: (r.attachments as Attachment[]) ?? [],
  pinned: (r.pinned as boolean) || undefined,
  createdAt: r.created_at as string,
  updatedAt: (r.updated_at as string) ?? undefined,
});

const fromPost = (p: Partial<Post>): Row => {
  const r: Row = {};
  if (p.id !== undefined) r.id = p.id;
  if (p.communityId !== undefined) r.community_id = p.communityId;
  if (p.boardId !== undefined) r.board_id = p.boardId;
  if (p.authorId !== undefined) r.author_id = p.authorId;
  if (p.title !== undefined) r.title = p.title;
  if (p.content !== undefined) r.content = p.content;
  if (p.tags !== undefined) r.tags = p.tags;
  if (p.views !== undefined) r.views = p.views;
  if (p.likedBy !== undefined) r.liked_by = p.likedBy;
  if (p.dislikedBy !== undefined) r.disliked_by = p.dislikedBy;
  if (p.attachments !== undefined) r.attachments = p.attachments;
  if (p.pinned !== undefined) r.pinned = !!p.pinned;
  if (p.createdAt !== undefined) r.created_at = p.createdAt;
  if (p.updatedAt !== undefined) r.updated_at = p.updatedAt;
  return r;
};

const toComment = (r: Row): Comment => ({
  id: r.id as string,
  postId: r.post_id as string,
  authorId: r.author_id as string,
  content: r.content as string,
  parentId: (r.parent_id as string) ?? null,
  likedBy: (r.liked_by as string[]) ?? [],
  createdAt: r.created_at as string,
});

const fromComment = (c: Comment): Row => ({
  id: c.id,
  post_id: c.postId,
  author_id: c.authorId,
  content: c.content,
  parent_id: c.parentId,
  liked_by: c.likedBy,
  created_at: c.createdAt,
});

const toAnonPost = (r: Row): AnonPost => ({
  id: r.id as string,
  category: r.category as BoardCategory,
  nickname: r.nickname as string,
  color: r.color as string,
  title: r.title as string,
  content: r.content as string,
  password: r.password as string,
  authorKey: r.author_key as string,
  views: r.views as number,
  likedBy: (r.liked_by as string[]) ?? [],
  scoreBadge: (r.score_badge as string) ?? undefined,
  createdAt: r.created_at as string,
});

const fromAnonPost = (p: Partial<AnonPost>): Row => {
  const r: Row = {};
  if (p.id !== undefined) r.id = p.id;
  if (p.category !== undefined) r.category = p.category;
  if (p.nickname !== undefined) r.nickname = p.nickname;
  if (p.color !== undefined) r.color = p.color;
  if (p.title !== undefined) r.title = p.title;
  if (p.content !== undefined) r.content = p.content;
  if (p.password !== undefined) r.password = p.password;
  if (p.authorKey !== undefined) r.author_key = p.authorKey;
  if (p.views !== undefined) r.views = p.views;
  if (p.likedBy !== undefined) r.liked_by = p.likedBy;
  if (p.scoreBadge !== undefined) r.score_badge = p.scoreBadge ?? null;
  if (p.createdAt !== undefined) r.created_at = p.createdAt;
  return r;
};

const toAnonComment = (r: Row): AnonComment => ({
  id: r.id as string,
  postId: r.post_id as string,
  nickname: r.nickname as string,
  color: r.color as string,
  content: r.content as string,
  password: r.password as string,
  authorKey: r.author_key as string,
  createdAt: r.created_at as string,
});

const fromAnonComment = (c: AnonComment): Row => ({
  id: c.id,
  post_id: c.postId,
  nickname: c.nickname,
  color: c.color,
  content: c.content,
  password: c.password,
  author_key: c.authorKey,
  created_at: c.createdAt,
});

const toAd = (r: Row): AdBanner => ({
  id: r.id as string,
  title: r.title as string,
  image: r.image as string,
  link: (r.link as string) ?? undefined,
  active: r.active as boolean,
  createdAt: r.created_at as string,
});

/** 개수 세기 — 목록마다 한 번씩만 물어본다 */
async function countBy(
  table: string,
  column: string,
  ids: string[]
): Promise<Record<string, number>> {
  if (ids.length === 0) return {};
  const { data } = await supabase().from(table).select(column).in(column, ids);
  const counts: Record<string, number> = Object.fromEntries(ids.map((id) => [id, 0]));
  for (const row of (data ?? []) as unknown as Row[]) {
    const key = row[column] as string;
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}

export const supabaseRepo: Repo = {
  // 회원
  async getUserById(id) {
    const { data } = await supabase().from('users').select('*').eq('id', id).maybeSingle();
    return data ? toUser(data) : null;
  },
  async getUserByEmail(email) {
    const { data } = await supabase()
      .from('users')
      .select('*')
      .ilike('email', email)
      .maybeSingle();
    return data ? toUser(data) : null;
  },
  async getUserByNickname(nickname) {
    const { data } = await supabase()
      .from('users')
      .select('*')
      .eq('nickname', nickname)
      .maybeSingle();
    return data ? toUser(data) : null;
  },
  async createUser(user) {
    await supabase().from('users').insert(fromUser(user));
  },
  async listUsersByIds(ids) {
    if (ids.length === 0) return [];
    const { data } = await supabase().from('users').select('*').in('id', ids);
    return (data ?? []).map(toUser);
  },

  // 커뮤니티
  async getCommunityBySlug(slug) {
    const { data } = await supabase().from('communities').select('*').eq('slug', slug).maybeSingle();
    return data ? toCommunity(data) : null;
  },
  async getCommunityById(id) {
    const { data } = await supabase().from('communities').select('*').eq('id', id).maybeSingle();
    return data ? toCommunity(data) : null;
  },
  async listCommunities() {
    const { data } = await supabase().from('communities').select('*').order('created_at');
    return (data ?? []).map(toCommunity);
  },
  async createCommunity(c, boards, membership) {
    await supabase().from('communities').insert(fromCommunity(c));
    await supabase().from('boards').insert(boards.map(fromBoard));
    await supabase().from('memberships').insert(fromMembership(membership));
  },
  async updateCommunity(id, patch) {
    await supabase().from('communities').update(fromCommunity(patch)).eq('id', id);
  },
  async slugExists(slug) {
    const { data } = await supabase().from('communities').select('id').eq('slug', slug).maybeSingle();
    return !!data;
  },

  // 게시판
  async listBoards(communityId) {
    const { data } = await supabase()
      .from('boards')
      .select('*')
      .eq('community_id', communityId)
      .order('order');
    return (data ?? []).map(toBoard);
  },
  async getBoard(id) {
    const { data } = await supabase().from('boards').select('*').eq('id', id).maybeSingle();
    return data ? toBoard(data) : null;
  },
  async createBoard(board) {
    await supabase().from('boards').insert(fromBoard(board));
  },
  async deleteBoard(id) {
    // posts 는 board_id 에 on delete cascade 가 걸려 있어 함께 지워진다
    await supabase().from('boards').delete().eq('id', id);
  },

  // 멤버십
  async getMembership(communityId, userId) {
    const { data } = await supabase()
      .from('memberships')
      .select('*')
      .eq('community_id', communityId)
      .eq('user_id', userId)
      .maybeSingle();
    return data ? toMembership(data) : null;
  },
  async listMemberships(communityId) {
    const { data } = await supabase()
      .from('memberships')
      .select('*')
      .eq('community_id', communityId)
      .order('joined_at');
    return (data ?? []).map(toMembership);
  },
  async listMembershipsOfUser(userId) {
    const { data } = await supabase().from('memberships').select('*').eq('user_id', userId);
    return (data ?? []).map(toMembership);
  },
  async createMembership(m) {
    await supabase().from('memberships').insert(fromMembership(m));
  },
  async deleteMembership(id) {
    await supabase().from('memberships').delete().eq('id', id);
  },
  async countMembers(communityIds) {
    return countBy('memberships', 'community_id', communityIds);
  },

  // 글
  async getPost(id) {
    const { data } = await supabase().from('posts').select('*').eq('id', id).maybeSingle();
    return data ? toPost(data) : null;
  },
  async listPosts(opts = {}) {
    let q = supabase().from('posts').select('*').order('created_at', { ascending: false });
    if (opts.communityId) q = q.eq('community_id', opts.communityId);
    if (opts.boardId) q = q.eq('board_id', opts.boardId);
    if (opts.limit) q = q.limit(opts.limit);
    const { data } = await q;
    return (data ?? []).map(toPost);
  },
  async listPostsOfAuthor(authorId) {
    const { data } = await supabase().from('posts').select('*').eq('author_id', authorId);
    return (data ?? []).map(toPost);
  },
  async createPost(post) {
    await supabase().from('posts').insert(fromPost(post));
  },
  async updatePost(id, patch) {
    await supabase().from('posts').update(fromPost(patch)).eq('id', id);
  },
  async deletePost(id) {
    await supabase().from('posts').delete().eq('id', id);
  },
  async countPosts(communityIds) {
    return countBy('posts', 'community_id', communityIds);
  },

  // 댓글
  async listComments(postId) {
    const { data } = await supabase()
      .from('comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at');
    return (data ?? []).map(toComment);
  },
  async listCommentsSince(since) {
    const { data } = await supabase()
      .from('comments')
      .select('*')
      .gte('created_at', since)
      .order('created_at');
    return (data ?? []).map(toComment);
  },
  async countComments(postIds) {
    return countBy('comments', 'post_id', postIds);
  },
  async createComment(c) {
    await supabase().from('comments').insert(fromComment(c));
  },
  async getComment(id) {
    const { data } = await supabase().from('comments').select('*').eq('id', id).maybeSingle();
    return data ? toComment(data) : null;
  },
  async deleteComment(id) {
    await supabase().from('comments').delete().eq('id', id);
  },

  // 익명 게시판
  async listAnonPosts() {
    const { data } = await supabase()
      .from('anon_posts')
      .select('*')
      .order('created_at', { ascending: false });
    return (data ?? []).map(toAnonPost);
  },
  async getAnonPost(id) {
    const { data } = await supabase().from('anon_posts').select('*').eq('id', id).maybeSingle();
    return data ? toAnonPost(data) : null;
  },
  async createAnonPost(p) {
    await supabase().from('anon_posts').insert(fromAnonPost(p));
  },
  async updateAnonPost(id, patch) {
    await supabase().from('anon_posts').update(fromAnonPost(patch)).eq('id', id);
  },
  async deleteAnonPost(id) {
    await supabase().from('anon_posts').delete().eq('id', id);
  },
  async listAnonComments(postId) {
    let q = supabase().from('anon_comments').select('*').order('created_at');
    if (postId) q = q.eq('post_id', postId);
    const { data } = await q;
    return (data ?? []).map(toAnonComment);
  },
  async createAnonComment(c) {
    await supabase().from('anon_comments').insert(fromAnonComment(c));
  },
  async getAnonComment(id) {
    const { data } = await supabase().from('anon_comments').select('*').eq('id', id).maybeSingle();
    return data ? toAnonComment(data) : null;
  },
  async deleteAnonComment(id) {
    await supabase().from('anon_comments').delete().eq('id', id);
  },

  // 광고 배너
  async listAds() {
    const { data } = await supabase().from('ad_banners').select('*').order('sort_order');
    return (data ?? []).map(toAd);
  },
  async createAd(ad, order) {
    await supabase().from('ad_banners').insert({
      id: ad.id,
      title: ad.title,
      image: ad.image,
      link: ad.link ?? null,
      active: ad.active,
      sort_order: order,
      created_at: ad.createdAt,
    });
  },
  async updateAd(id, patch) {
    const row: Row = {};
    if (patch.title !== undefined) row.title = patch.title;
    if (patch.image !== undefined) row.image = patch.image;
    if (patch.link !== undefined) row.link = patch.link ?? null;
    if (patch.active !== undefined) row.active = patch.active;
    if (patch.order !== undefined) row.sort_order = patch.order;
    await supabase().from('ad_banners').update(row).eq('id', id);
  },
  async deleteAd(id) {
    await supabase().from('ad_banners').delete().eq('id', id);
  },
  async reorderAds(ids) {
    await Promise.all(
      ids.map((id, i) => supabase().from('ad_banners').update({ sort_order: i }).eq('id', id))
    );
  },
};
