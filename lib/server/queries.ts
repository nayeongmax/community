// 서버에서 화면을 그릴 때 쓰는 조회 함수들.
// 모두 서버에서만 실행되므로, 여기서 만든 HTML 에는 글 본문이 그대로 들어간다.

import { Community, Post, User } from '../types';
import { read } from './db';

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

function nickname(users: User[], id: string): string {
  return users.find((u) => u.id === id)?.nickname ?? '(탈퇴)';
}

export async function getCommunityBySlug(slug: string): Promise<CommunityDetail | null> {
  const db = await read();
  const c = db.communities.find((x) => x.slug === slug);
  if (!c) return null;
  return {
    ...c,
    members: db.memberships.filter((m) => m.communityId === c.id).length,
    postCount: db.posts.filter((p) => p.communityId === c.id).length,
  };
}

export async function listCommunities(): Promise<CommunityDetail[]> {
  const db = await read();
  return db.communities.map((c) => ({
    ...c,
    members: db.memberships.filter((m) => m.communityId === c.id).length,
    postCount: db.posts.filter((p) => p.communityId === c.id).length,
  }));
}

export async function getPost(id: string): Promise<PostDetail | null> {
  const db = await read();
  const p = db.posts.find((x) => x.id === id);
  if (!p) return null;
  const community = db.communities.find((c) => c.id === p.communityId);
  return {
    ...p,
    authorNickname: nickname(db.users, p.authorId),
    boardName: db.boards.find((b) => b.id === p.boardId)?.name ?? '',
    communityName: community?.name ?? '',
    communitySlug: community?.slug ?? '',
    commentCount: db.comments.filter((c) => c.postId === p.id).length,
  };
}

export async function listComments(postId: string): Promise<CommentDetail[]> {
  const db = await read();
  return db.comments
    .filter((c) => c.postId === postId)
    .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
    .map((c) => ({
      id: c.id,
      content: c.content,
      authorNickname: nickname(db.users, c.authorId),
      createdAt: c.createdAt,
      likes: c.likedBy.length,
    }));
}

export async function listPostsOfCommunity(
  communityId: string,
  boardId?: string
): Promise<PostDetail[]> {
  const db = await read();
  return db.posts
    .filter((p) => p.communityId === communityId && (!boardId || p.boardId === boardId))
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .map((p) => ({
      ...p,
      authorNickname: nickname(db.users, p.authorId),
      boardName: db.boards.find((b) => b.id === p.boardId)?.name ?? '',
      communityName: db.communities.find((c) => c.id === p.communityId)?.name ?? '',
      communitySlug: db.communities.find((c) => c.id === p.communityId)?.slug ?? '',
      commentCount: db.comments.filter((c) => c.postId === p.id).length,
    }));
}

/** 홈·사이트맵·RSS 에서 쓰는 전체 글 */
export async function listAllPosts(): Promise<PostDetail[]> {
  const db = await read();
  return db.posts
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .map((p) => {
      const community = db.communities.find((c) => c.id === p.communityId);
      return {
        ...p,
        authorNickname: nickname(db.users, p.authorId),
        boardName: db.boards.find((b) => b.id === p.boardId)?.name ?? '',
        communityName: community?.name ?? '',
        communitySlug: community?.slug ?? '',
        commentCount: db.comments.filter((c) => c.postId === p.id).length,
      };
    });
}

export async function listBoards(communityId: string) {
  const db = await read();
  return db.boards
    .filter((b) => b.communityId === communityId)
    .sort((a, b) => a.order - b.order);
}
