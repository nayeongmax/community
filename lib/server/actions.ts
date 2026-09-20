'use server';

// 서버에서 실행되는 동작들 (Server Actions).
// 브라우저가 아니라 서버가 데이터를 고치므로, 권한 검사가 실제로 의미를 갖는다.

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Attachment, Board, Comment, Community, Membership, Post, User } from '../types';
import { colorFromString, slugify, uid } from '../utils';
import { mutate, read } from './db';
import { removeUpload, saveUpload } from './uploads';
import { clearSession, currentUser, setSession } from './session';

export interface ActionState {
  error?: string;
  ok?: boolean;
}

const normalizeTags = (tags: string[]): string[] =>
  [...new Set(tags.map((t) => t.replace(/^#/, '').trim()).filter(Boolean))].slice(0, 5);

// ---------------- 로그인 ----------------

export async function loginAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const email = String(form.get('email') ?? '').trim();
  const password = String(form.get('password') ?? '');

  const db = await read();
  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user || user.password !== password) {
    return { error: '이메일 또는 비밀번호가 올바르지 않습니다.' };
  }
  await setSession(user.id);
  redirect('/');
}

export async function signupAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const email = String(form.get('email') ?? '').trim();
  const nickname = String(form.get('nickname') ?? '').trim();
  const password = String(form.get('password') ?? '');

  if (!email || !nickname || !password) return { error: '모든 항목을 입력해 주세요.' };

  const db = await read();
  if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return { error: '이미 가입된 이메일입니다.' };
  }
  if (db.users.some((u) => u.nickname === nickname)) {
    return { error: '이미 사용 중인 닉네임입니다.' };
  }

  const user: User = {
    id: uid('u_'),
    email,
    nickname,
    password,
    avatarColor: colorFromString(nickname),
    createdAt: new Date().toISOString(),
  };
  await mutate((d) => d.users.push(user));
  await setSession(user.id);
  redirect('/');
}

export async function logoutAction(): Promise<void> {
  await clearSession();
  revalidatePath('/');
  redirect('/');
}

// ---------------- 파일 업로드 ----------------

export interface UploadResult {
  url?: string;
  type?: 'image' | 'video';
  name?: string;
  error?: string;
}

/** 글 첨부·커뮤니티 이미지 업로드 (서버에 저장하므로 모두에게 보인다) */
export async function uploadAction(form: FormData): Promise<UploadResult> {
  const me = await currentUser();
  if (!me) return { error: '로그인이 필요합니다.' };

  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) return { error: '파일을 골라 주세요.' };

  try {
    const saved = await saveUpload(file);
    return { url: saved.url, type: saved.type, name: saved.name };
  } catch (err) {
    return { error: err instanceof Error ? err.message : '파일을 올리지 못했습니다.' };
  }
}

// ---------------- 커뮤니티 ----------------

export async function createCommunityAction(
  _prev: ActionState,
  form: FormData
): Promise<ActionState> {
  const me = await currentUser();
  if (!me) return { error: '로그인이 필요합니다.' };

  const name = String(form.get('name') ?? '').trim();
  const description = String(form.get('description') ?? '').trim();
  const topics = form.getAll('topics').map(String);
  const region = String(form.get('region') ?? '') || undefined;
  const emoji = String(form.get('emoji') ?? '') || undefined;

  if (name.length < 2) return { error: '커뮤니티 이름을 2자 이상 입력해 주세요.' };
  if (topics.length === 0) return { error: '주제를 1개 이상 골라 주세요.' };

  const db = await read();
  let slug = slugify(name);
  let n = 1;
  while (db.communities.some((c) => c.slug === slug)) slug = `${slugify(name)}-${++n}`;

  const community: Community = {
    id: uid('c_'),
    slug,
    name,
    description,
    category: topics[0],
    topics,
    region,
    kind: 'normal',
    themeColor: colorFromString(name + slug),
    emoji,
    ownerId: me.id,
    isPublic: true,
    createdAt: new Date().toISOString(),
  };

  const now = Date.now();
  const boards: Board[] = [
    { id: uid('b_'), communityId: community.id, name: '공지사항', order: 0, isNotice: true, createdAt: new Date(now).toISOString() },
    { id: uid('b_'), communityId: community.id, name: '자유게시판', order: 1, createdAt: new Date(now + 1).toISOString() },
  ];
  const membership: Membership = {
    id: uid('m_'),
    communityId: community.id,
    userId: me.id,
    role: 'owner',
    joinedAt: new Date().toISOString(),
  };

  await mutate((d) => {
    d.communities.push(community);
    d.boards.push(...boards);
    d.memberships.push(membership);
  });

  revalidatePath('/');
  redirect(`/c/${slug}`);
}

export async function toggleJoinAction(communityId: string, slug: string): Promise<void> {
  const me = await currentUser();
  if (!me) redirect('/login');

  await mutate((d) => {
    const i = d.memberships.findIndex((m) => m.communityId === communityId && m.userId === me.id);
    if (i >= 0) {
      if (d.memberships[i].role === 'owner') return;
      d.memberships.splice(i, 1);
    } else {
      d.memberships.push({
        id: uid('m_'),
        communityId,
        userId: me.id,
        role: 'member',
        joinedAt: new Date().toISOString(),
      });
    }
  });
  revalidatePath(`/c/${slug}`);
}

export async function updateCommunityAction(
  _prev: ActionState,
  form: FormData
): Promise<ActionState> {
  const communityId = String(form.get('communityId') ?? '');
  const db = await read();
  const community = db.communities.find((c) => c.id === communityId);
  if (!community) return { error: '커뮤니티를 찾을 수 없습니다.' };

  const me = await currentUser();
  const role = db.memberships.find((m) => m.communityId === communityId && m.userId === me?.id)?.role;
  if (role !== 'owner' && role !== 'admin') return { error: '운영자만 바꿀 수 있습니다.' };

  const description = String(form.get('description') ?? '').trim();
  const emoji = String(form.get('emoji') ?? '');
  const avatarUrl = String(form.get('avatarUrl') ?? '');
  const titleUrl = String(form.get('titleUrl') ?? '');

  // 바뀐 이미지의 예전 파일은 지운다
  if (avatarUrl !== (community.avatarUrl ?? '')) await removeUpload(community.avatarUrl);
  if (titleUrl !== (community.titleUrl ?? '')) await removeUpload(community.titleUrl);

  await mutate((d) => {
    const c = d.communities.find((x) => x.id === communityId)!;
    c.description = description;
    c.emoji = emoji || undefined;
    c.avatarUrl = avatarUrl || undefined;
    c.titleUrl = titleUrl || undefined;
  });

  revalidatePath(`/c/${community.slug}`);
  revalidatePath(`/c/${community.slug}/settings`);
  return { ok: true };
}

export async function createBoardAction(communityId: string, slug: string, name: string): Promise<void> {
  const db = await read();
  const me = await currentUser();
  const role = db.memberships.find((m) => m.communityId === communityId && m.userId === me?.id)?.role;
  if (role !== 'owner' && role !== 'admin') return;
  if (!name.trim()) return;

  await mutate((d) => {
    const order = d.boards.filter((b) => b.communityId === communityId).length;
    d.boards.push({
      id: uid('b_'),
      communityId,
      name: name.trim(),
      order,
      createdAt: new Date().toISOString(),
    });
  });
  revalidatePath(`/c/${slug}/settings`);
  revalidatePath(`/c/${slug}`);
}

export async function deleteBoardAction(boardId: string, slug: string): Promise<void> {
  const db = await read();
  const board = db.boards.find((b) => b.id === boardId);
  if (!board || board.isNotice) return;

  const me = await currentUser();
  const role = db.memberships.find((m) => m.communityId === board.communityId && m.userId === me?.id)?.role;
  if (role !== 'owner' && role !== 'admin') return;

  await mutate((d) => {
    d.boards = d.boards.filter((b) => b.id !== boardId);
    const postIds = d.posts.filter((p) => p.boardId === boardId).map((p) => p.id);
    d.posts = d.posts.filter((p) => p.boardId !== boardId);
    d.comments = d.comments.filter((c) => !postIds.includes(c.postId));
  });
  revalidatePath(`/c/${slug}/settings`);
  revalidatePath(`/c/${slug}`);
}

// ---------------- 글 ----------------

export async function writePostAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const me = await currentUser();
  if (!me) return { error: '로그인이 필요합니다.' };

  const slug = String(form.get('slug') ?? '');
  const postId = String(form.get('postId') ?? '');
  const boardId = String(form.get('boardId') ?? '');
  const title = String(form.get('title') ?? '').trim();
  const content = String(form.get('content') ?? '').trim();
  const tags = normalizeTags(String(form.get('tags') ?? '').split(/[,\s]+/));
  const attachments = JSON.parse(String(form.get('attachments') || '[]')) as Attachment[];

  if (!title) return { error: '제목을 입력해 주세요.' };
  if (!content) return { error: '내용을 입력해 주세요.' };
  if (!boardId) return { error: '게시판을 골라 주세요.' };

  const db = await read();
  const community = db.communities.find((c) => c.slug === slug);
  if (!community) return { error: '커뮤니티를 찾을 수 없습니다.' };

  // 수정
  if (postId) {
    const post = db.posts.find((p) => p.id === postId);
    if (!post) return { error: '이미 삭제된 글입니다.' };
    if (post.authorId !== me.id) return { error: '글을 수정할 권한이 없습니다.' };

    await mutate((d) => {
      const p = d.posts.find((x) => x.id === postId)!;
      p.title = title;
      p.content = content;
      p.tags = tags;
      p.boardId = boardId;
      p.attachments = attachments;
      p.updatedAt = new Date().toISOString();
    });
    revalidatePath(`/c/${slug}/post/${postId}`);
    redirect(`/c/${slug}/post/${postId}`);
  }

  // 새 글 — 멤버가 아니면 자동 가입
  const newPost: Post = {
    id: uid('p_'),
    communityId: community.id,
    boardId,
    authorId: me.id,
    title,
    content,
    tags,
    views: 0,
    likedBy: [],
    dislikedBy: [],
    attachments,
    createdAt: new Date().toISOString(),
  };

  await mutate((d) => {
    if (!d.memberships.some((m) => m.communityId === community.id && m.userId === me.id)) {
      d.memberships.push({
        id: uid('m_'),
        communityId: community.id,
        userId: me.id,
        role: 'member',
        joinedAt: new Date().toISOString(),
      });
    }
    d.posts.push(newPost);
  });

  revalidatePath(`/c/${slug}`);
  revalidatePath('/');
  redirect(`/c/${slug}/post/${newPost.id}`);
}

/** 작성자 본인이거나 그 커뮤니티 운영진이면 지울 수 있다 */
export async function deletePostAction(postId: string, slug: string): Promise<void> {
  const me = await currentUser();
  if (!me) redirect('/login');

  const db = await read();
  const post = db.posts.find((p) => p.id === postId);
  if (!post) return;

  const role = db.memberships.find((m) => m.communityId === post.communityId && m.userId === me.id)?.role;
  const allowed = post.authorId === me.id || role === 'owner' || role === 'admin';
  if (!allowed) return;

  await mutate((d) => {
    d.posts = d.posts.filter((p) => p.id !== postId);
    d.comments = d.comments.filter((c) => c.postId !== postId);
  });

  revalidatePath(`/c/${slug}`);
  revalidatePath('/');
  redirect(`/c/${slug}`);
}

export async function reactAction(
  postId: string,
  slug: string,
  kind: 'like' | 'dislike'
): Promise<void> {
  const me = await currentUser();
  if (!me) redirect('/login');

  await mutate((d) => {
    const p = d.posts.find((x) => x.id === postId);
    if (!p) return;
    const mine = kind === 'like' ? p.likedBy : p.dislikedBy;
    const other = kind === 'like' ? p.dislikedBy : p.likedBy;
    const i = mine.indexOf(me.id);
    if (i >= 0) mine.splice(i, 1);
    else {
      mine.push(me.id);
      const j = other.indexOf(me.id);
      if (j >= 0) other.splice(j, 1);
    }
  });
  revalidatePath(`/c/${slug}/post/${postId}`);
}

/** 조회수 — 글을 열 때 서버에서 올린다 */
export async function countViewAction(postId: string): Promise<void> {
  await mutate((d) => {
    const p = d.posts.find((x) => x.id === postId);
    if (p) p.views += 1;
  });
}

// ---------------- 댓글 ----------------

export async function writeCommentAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const me = await currentUser();
  if (!me) return { error: '로그인이 필요합니다.' };

  const postId = String(form.get('postId') ?? '');
  const slug = String(form.get('slug') ?? '');
  const content = String(form.get('content') ?? '').trim();
  if (!content) return { error: '댓글 내용을 입력해 주세요.' };

  const comment: Comment = {
    id: uid('cm_'),
    postId,
    authorId: me.id,
    content,
    parentId: null,
    likedBy: [],
    createdAt: new Date().toISOString(),
  };
  await mutate((d) => d.comments.push(comment));

  revalidatePath(`/c/${slug}/post/${postId}`);
  return {};
}

export async function deleteCommentAction(
  commentId: string,
  postId: string,
  slug: string
): Promise<void> {
  const me = await currentUser();
  if (!me) return;

  const db = await read();
  const comment = db.comments.find((c) => c.id === commentId);
  const post = db.posts.find((p) => p.id === postId);
  if (!comment || !post) return;

  const role = db.memberships.find((m) => m.communityId === post.communityId && m.userId === me.id)?.role;
  const allowed = comment.authorId === me.id || role === 'owner' || role === 'admin';
  if (!allowed) return;

  await mutate((d) => {
    d.comments = d.comments.filter((c) => c.id !== commentId);
  });
  revalidatePath(`/c/${slug}/post/${postId}`);
}
