// 서버에서 화면을 그릴 때 쓰는 조회 함수들.
// 모두 서버에서만 실행되므로, 여기서 만든 HTML 에는 글 본문이 그대로 들어간다.

import { Community, Post } from '../types';
import { repo } from './repo';

export interface PostDetail extends Post {
  authorNickname: string;
  boardName: string;
  communityName: string;
  communitySlug: string;
  commentCount: number;
}

export interface CommentDetail {
  id: string;
  content: string;
  authorNickname: string;
  createdAt: string;
  likes: number;
}

export interface CommunityDetail extends Community {
  members: number;
  postCount: number;
}

/** 글 목록에 작성자·게시판·커뮤니티 이름과 댓글 수를 붙인다 */
async function decorate(posts: Post[]): Promise<PostDetail[]> {
  if (posts.length === 0) return [];

  const [users, communities, counts] = await Promise.all([
    repo.listUsersByIds([...new Set(posts.map((p) => p.authorId))]),
    repo.listCommunities(),
    repo.countComments(posts.map((p) => p.id)),
  ]);

  // 게시판 이름은 커뮤니티별로 한 번씩만 불러온다
  const boardsByCommunity = new Map<string, Awaited<ReturnType<typeof repo.listBoards>>>();
  for (const id of new Set(posts.map((p) => p.communityId))) {
    boardsByCommunity.set(id, await repo.listBoards(id));
  }

  const userName = new Map(users.map((u) => [u.id, u.nickname]));
  const community = new Map(communities.map((c) => [c.id, c]));

  return posts.map((p) => {
    const c = community.get(p.communityId);
    const board = boardsByCommunity.get(p.communityId)?.find((b) => b.id === p.boardId);
    return {
      ...p,
      authorNickname: userName.get(p.authorId) ?? '(탈퇴)',
      boardName: board?.name ?? '',
      communityName: c?.name ?? '(삭제된 커뮤니티)',
      communitySlug: c?.slug ?? '',
      commentCount: counts[p.id] ?? 0,
    };
  });
}

async function withStats(communities: Community[]): Promise<CommunityDetail[]> {
  const ids = communities.map((c) => c.id);
  const [members, posts] = await Promise.all([repo.countMembers(ids), repo.countPosts(ids)]);
  return communities.map((c) => ({
    ...c,
    members: members[c.id] ?? 0,
    postCount: posts[c.id] ?? 0,
  }));
}

export async function getCommunityBySlug(slug: string): Promise<CommunityDetail | null> {
  const c = await repo.getCommunityBySlug(slug);
  if (!c) return null;
  return (await withStats([c]))[0];
}

export async function listCommunities(): Promise<CommunityDetail[]> {
  return withStats(await repo.listCommunities());
}

export async function getPost(id: string): Promise<PostDetail | null> {
  const post = await repo.getPost(id);
  if (!post) return null;
  return (await decorate([post]))[0];
}

export async function listComments(postId: string): Promise<CommentDetail[]> {
  const comments = await repo.listComments(postId);
  const users = await repo.listUsersByIds([...new Set(comments.map((c) => c.authorId))]);
  const name = new Map(users.map((u) => [u.id, u.nickname]));

  return comments.map((c) => ({
    id: c.id,
    content: c.content,
    authorNickname: name.get(c.authorId) ?? '(탈퇴)',
    createdAt: c.createdAt,
    likes: c.likedBy.length,
  }));
}

export async function listPostsOfCommunity(
  communityId: string,
  boardId?: string
): Promise<PostDetail[]> {
  return decorate(await repo.listPosts({ communityId, boardId }));
}

/** 홈·사이트맵·RSS 에서 쓰는 전체 글 */
export async function listAllPosts(limit?: number): Promise<PostDetail[]> {
  return decorate(await repo.listPosts({ limit }));
}

export async function listBoards(communityId: string) {
  return repo.listBoards(communityId);
}

/* ------------------------------------------------------------------
 * 홈 화면용 집계
 * ---------------------------------------------------------------- */

export interface SiteStats {
  communities: number;
  posts: number;
  todayPosts: number;
  todayComments: number;
}

export interface TrendingCommunity extends CommunityDetail {
  /** 오늘 올라온 글 수 */
  recentPosts: number;
  /** 오늘 달린 댓글 수 */
  recentComments: number;
}

export interface HomeData {
  posts: PostDetail[];
  communities: CommunityDetail[];
  trending: TrendingCommunity[];
  tags: string[];
  stats: SiteStats;
}

/** 오늘 0시 (ISO) */
function startOfToday(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/**
 * 홈에 필요한 것을 한 번에 모은다.
 * 글·커뮤니티를 각각 한 번씩만 읽고, 나머지 수치는 그 위에서 계산한다.
 */
export async function getHomeData(): Promise<HomeData> {
  const since = startOfToday();
  const [posts, communities, todayComments] = await Promise.all([
    listAllPosts(),
    listCommunities(),
    repo.listCommentsSince(since),
  ]);

  // 글 → 커뮤니티 (댓글이 어느 커뮤니티에 달렸는지 알아내는 데 쓴다)
  const communityOfPost = new Map(posts.map((p) => [p.id, p.communityId]));

  const recentPosts = new Map<string, number>();
  for (const p of posts) {
    if (p.createdAt >= since) recentPosts.set(p.communityId, (recentPosts.get(p.communityId) ?? 0) + 1);
  }
  const recentComments = new Map<string, number>();
  for (const c of todayComments) {
    const id = communityOfPost.get(c.postId);
    if (id) recentComments.set(id, (recentComments.get(id) ?? 0) + 1);
  }

  const trending = communities
    .map((c) => ({
      ...c,
      recentPosts: recentPosts.get(c.id) ?? 0,
      recentComments: recentComments.get(c.id) ?? 0,
    }))
    .sort(
      (a, b) =>
        b.recentPosts * 2 + b.recentComments - (a.recentPosts * 2 + a.recentComments) ||
        b.members - a.members
    )
    .slice(0, 8);

  // 많이 쓰인 태그
  const tagCount = new Map<string, number>();
  for (const p of posts) for (const t of p.tags) tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
  const tags = [...tagCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([t]) => t);

  return {
    posts,
    communities: [...communities].sort((a, b) => b.members - a.members),
    trending,
    tags,
    stats: {
      communities: communities.length,
      posts: posts.length,
      todayPosts: posts.filter((p) => p.createdAt >= since).length,
      todayComments: todayComments.length,
    },
  };
}

export type FeedSort = 'hot' | 'new' | 'comments' | 'top';

/** 정렬 기준에 맞춰 글을 줄 세운다 */
export function sortFeed(posts: PostDetail[], sort: FeedSort): PostDetail[] {
  const list = [...posts];
  const score = (p: PostDetail) => {
    // 오래될수록 점수가 내려가는 단순한 인기 점수
    const hours = (Date.now() - +new Date(p.createdAt)) / 3_600_000;
    return (p.likedBy.length * 3 + p.commentCount * 2 + p.views / 50) / Math.pow(hours + 2, 0.6);
  };
  switch (sort) {
    case 'new':
      return list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    case 'comments':
      return list.sort((a, b) => b.commentCount - a.commentCount);
    case 'top':
      return list.sort((a, b) => b.likedBy.length - a.likedBy.length);
    default:
      return list.sort((a, b) => score(b) - score(a));
  }
}
