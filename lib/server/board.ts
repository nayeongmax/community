// 익명 자유게시판 (서버 저장)
//
// 예전에는 브라우저에만 저장돼 서로의 글이 보이지 않았다. 서버로 옮겨
// 방문자끼리 실제로 대화가 되게 하고, 익명 신원은 쿠키 하나로 구분한다.

import { cookies } from 'next/headers';
import { uid } from '../utils';
import type { AnonPostView, BoardCategory, BoardSort } from '../board-types';
import { repo } from './repo';

export { randomNickname } from './nicknames';

const ANON_COOKIE = 'community_anon';

/** 이 브라우저의 익명 식별자 (없으면 만들어 쿠키에 심는다) */
export async function anonKey(): Promise<string> {
  const jar = await cookies();
  const existing = jar.get(ANON_COOKIE)?.value;
  if (existing) return existing;

  const key = uid('a_');
  try {
    jar.set(ANON_COOKIE, key, { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' });
  } catch {
    // 화면을 그리는 중에는 쿠키를 심을 수 없다 — 다음 동작에서 심긴다
  }
  return key;
}

export async function listAnonPosts(
  opts: { category?: BoardCategory | '전체'; sort?: BoardSort; q?: string } = {}
): Promise<AnonPostView[]> {
  const [all, comments, me] = await Promise.all([
    repo.listAnonPosts(),
    repo.listAnonComments(),
    anonKey(),
  ]);

  const commentCount = new Map<string, number>();
  for (const c of comments) commentCount.set(c.postId, (commentCount.get(c.postId) ?? 0) + 1);

  const q = opts.q?.trim().toLowerCase();
  let rows: AnonPostView[] = all.map((p) => ({
    ...p,
    commentCount: commentCount.get(p.id) ?? 0,
    likes: p.likedBy.length,
    liked: p.likedBy.includes(me),
    mine: p.authorKey === me,
  }));

  if (opts.category && opts.category !== '전체') {
    rows = rows.filter((p) => p.category === opts.category);
  }
  if (q) {
    rows = rows.filter(
      (p) => p.title.toLowerCase().includes(q) || p.content.toLowerCase().includes(q)
    );
  }

  const sort = opts.sort ?? 'new';
  rows.sort((a, b) => {
    if (sort === 'hot') return b.likes * 3 + b.commentCount * 2 - (a.likes * 3 + a.commentCount * 2);
    if (sort === 'comments') return b.commentCount - a.commentCount;
    return +new Date(b.createdAt) - +new Date(a.createdAt);
  });
  return rows;
}

export async function listAnonComments(postId: string) {
  const [comments, me] = await Promise.all([repo.listAnonComments(postId), anonKey()]);
  return comments
    .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
    .map((c) => ({ ...c, mine: c.authorKey === me }));
}

/** 마이 랜드에 더해질 내 게시판 활동 */
export async function myBoardContribution() {
  const [posts, comments, me] = await Promise.all([
    repo.listAnonPosts(),
    repo.listAnonComments(),
    anonKey(),
  ]);
  const mine = posts.filter((p) => p.authorKey === me);
  return {
    posts: mine.length,
    comments: comments.filter((c) => c.authorKey === me).length,
    likes: mine.reduce((a, p) => a + p.likedBy.length, 0),
  };
}
