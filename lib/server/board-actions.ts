'use server';

// 익명 게시판 동작 (서버에서 저장)

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { colorFromString, uid } from '../utils';
import type { AnonComment, AnonPost, BoardCategory } from '../board-types';
import { anonKey, randomNickname } from './board';
import { repo } from './repo';

export interface BoardActionState {
  error?: string;
  ok?: boolean;
}

/** 쿠키에 익명 식별자를 확실히 심는다 (화면 렌더 중에는 심을 수 없어서) */
async function ensureAnonKey(): Promise<string> {
  const key = await anonKey();
  (await cookies()).set('community_anon', key, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });
  return key;
}

export async function createAnonPostAction(
  _prev: BoardActionState,
  form: FormData
): Promise<BoardActionState> {
  const title = String(form.get('title') ?? '').trim();
  const content = String(form.get('content') ?? '').trim();
  const password = String(form.get('password') ?? '');
  const category = String(form.get('category') ?? '자유') as BoardCategory;
  const scoreBadge = String(form.get('scoreBadge') ?? '') || undefined;

  if (!title) return { error: '제목을 입력해 주세요.' };
  if (!content) return { error: '내용을 입력해 주세요.' };
  if (!/^\d{4}$/.test(password)) return { error: '삭제용 비밀번호는 숫자 4자리입니다.' };

  const key = await ensureAnonKey();
  const nickname = randomNickname();
  const post: AnonPost = {
    id: uid('ap_'),
    category,
    nickname,
    color: colorFromString(nickname + Date.now()),
    title,
    content,
    password,
    authorKey: key,
    views: 0,
    likedBy: [],
    scoreBadge,
    createdAt: new Date().toISOString(),
  };

  await repo.createAnonPost(post);

  revalidatePath('/games');
  return { ok: true };
}

export async function createAnonCommentAction(
  _prev: BoardActionState,
  form: FormData
): Promise<BoardActionState> {
  const postId = String(form.get('postId') ?? '');
  const content = String(form.get('content') ?? '').trim();
  const password = String(form.get('password') ?? '');

  if (!content) return { error: '댓글 내용을 입력해 주세요.' };
  if (!/^\d{4}$/.test(password)) return { error: '삭제용 비밀번호는 숫자 4자리입니다.' };

  const key = await ensureAnonKey();
  const nickname = randomNickname();
  const comment: AnonComment = {
    id: uid('ac_'),
    postId,
    nickname,
    color: colorFromString(nickname + Date.now()),
    content,
    password,
    authorKey: key,
    createdAt: new Date().toISOString(),
  };

  await repo.createAnonComment(comment);

  revalidatePath('/games');
  return { ok: true };
}

export async function toggleAnonLikeAction(postId: string): Promise<void> {
  const key = await ensureAnonKey();
  const post = await repo.getAnonPost(postId);
  if (!post) return;

  const likedBy = [...post.likedBy];
  const i = likedBy.indexOf(key);
  if (i >= 0) likedBy.splice(i, 1);
  else likedBy.push(key);

  await repo.updateAnonPost(postId, { likedBy });
  revalidatePath('/games');
}

export async function viewAnonPostAction(postId: string): Promise<void> {
  const post = await repo.getAnonPost(postId);
  if (post) await repo.updateAnonPost(postId, { views: post.views + 1 });
}

/** 본인(같은 브라우저)이거나 비밀번호가 맞으면 삭제 */
export async function deleteAnonPostAction(
  postId: string,
  password: string
): Promise<BoardActionState> {
  const key = await anonKey();
  const post = await repo.getAnonPost(postId);
  if (!post) return { error: '이미 삭제된 글입니다.' };

  if (post.authorKey !== key && post.password !== password) {
    return { error: '비밀번호가 올바르지 않습니다.' };
  }
  await repo.deleteAnonPost(postId);

  revalidatePath('/games');
  return { ok: true };
}

export async function deleteAnonCommentAction(
  commentId: string,
  password: string
): Promise<BoardActionState> {
  const key = await anonKey();
  const comment = await repo.getAnonComment(commentId);
  if (!comment) return { error: '이미 삭제된 댓글입니다.' };

  if (comment.authorKey !== key && comment.password !== password) {
    return { error: '비밀번호가 올바르지 않습니다.' };
  }
  await repo.deleteAnonComment(commentId);

  revalidatePath('/games');
  return { ok: true };
}
