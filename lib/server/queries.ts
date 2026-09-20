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
