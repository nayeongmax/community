'use server';

// 서버에서 실행되는 동작들 (Server Actions).
// 브라우저가 아니라 서버가 데이터를 고치므로, 권한 검사가 실제로 의미를 갖는다.

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { Attachment, Board, Comment, Community, Membership, Post, User } from '../types';
import { colorFromString, slugify, uid } from '../utils';
import { repo } from './repo';
import { removeUpload, saveUpload } from './uploads';
import { clearSession, currentUser, isSiteAdmin, setSession } from './session';
import { hashPassword, isHashed, verifyPassword } from './password';

export interface ActionState {
  error?: string;
  ok?: boolean;
}

const normalizeTags = (tags: string[]): string[] =>
  [...new Set(tags.map((t) => t.replace(/^#/, '').trim()).filter(Boolean))].slice(0, 5);

// ---------------- 로그인 ----------------

export async function loginAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const loginId = String(form.get('loginId') ?? '').trim();
  const password = String(form.get('password') ?? '');

  const user = await repo.getUserByLoginId(loginId);
  // 아이디가 없을 때와 비밀번호가 틀렸을 때를 구분해서 알려 주지 않는다
  if (!user || !user.password || !(await verifyPassword(password, user.password))) {
    return { error: '아이디 또는 비밀번호가 올바르지 않습니다.' };
  }

  // 예전 평문 계정은 이번 로그인에 맞춰 해시로 올려 둔다
  if (!isHashed(user.password)) {
    await repo.updateUser(user.id, { password: await hashPassword(password) });
  }

  await setSession(user.id);
  redirect('/');
}

/** 아이디 규칙 — 영문/숫자/밑줄 4~20자 */
const ID_RULE = /^[a-zA-Z0-9_]{4,20}$/;
/** 생년월일 YYYY-MM-DD */
const BIRTHDAY_RULE = /^\d{4}-\d{2}-\d{2}$/;

export async function signupAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const name = String(form.get('name') ?? '').trim();
  const loginId = String(form.get('loginId') ?? '').trim();
  const password = String(form.get('password') ?? '');
  const phone = String(form.get('phone') ?? '').replace(/[^0-9]/g, '');
  const birthday = String(form.get('birthday') ?? '').trim();

  if (!name || !loginId || !password || !phone || !birthday) {
    return { error: '모든 항목을 입력해 주세요.' };
  }
  if (!ID_RULE.test(loginId)) {
    return { error: '아이디는 영문·숫자·밑줄 4~20자로 지어 주세요.' };
  }
  if (password.length < 8) {
    return { error: '비밀번호는 8자 이상으로 지어 주세요.' };
  }
  if (phone.length < 9 || phone.length > 11) {
    return { error: '연락처를 다시 확인해 주세요.' };
  }
  if (!BIRTHDAY_RULE.test(birthday)) {
    return { error: '생년월일을 선택해 주세요.' };
  }

  if (await repo.getUserByLoginId(loginId)) return { error: '이미 사용 중인 아이디입니다.' };
  if (await repo.getUserByNickname(loginId)) return { error: '이미 사용 중인 아이디입니다.' };

  const user: User = {
    id: uid('u_'),
    loginId,
    name,
    // 글·댓글에 보이는 이름. 이름·연락처·생년월일은 공개하지 않는다.
    nickname: loginId,
    phone,
    birthday,
    password: await hashPassword(password),
    avatarColor: colorFromString(loginId),
    createdAt: new Date().toISOString(),
  };
  await repo.createUser(user);
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

  let slug = slugify(name);
  let n = 1;
  while (await repo.slugExists(slug)) slug = `${slugify(name)}-${++n}`;

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

  await repo.createCommunity(community, boards, membership);

  revalidatePath('/');
  redirect(`/c/${slug}`);
}

export async function toggleJoinAction(communityId: string, slug: string): Promise<void> {
  const me = await currentUser();
  if (!me) redirect('/login');

  const existing = await repo.getMembership(communityId, me.id);
  if (existing) {
    if (existing.role !== 'owner') await repo.deleteMembership(existing.id);
  } else {
    await repo.createMembership({
      id: uid('m_'),
      communityId,
      userId: me.id,
      role: 'member',
      joinedAt: new Date().toISOString(),
    });
  }
  revalidatePath(`/c/${slug}`);
}

export async function updateCommunityAction(
  _prev: ActionState,
  form: FormData
): Promise<ActionState> {
  const communityId = String(form.get('communityId') ?? '');
  const community = await repo.getCommunityById(communityId);
  if (!community) return { error: '커뮤니티를 찾을 수 없습니다.' };

  const me = await currentUser();
  const role = me ? (await repo.getMembership(communityId, me.id))?.role : undefined;
  if (role !== 'owner' && role !== 'admin') return { error: '운영자만 바꿀 수 있습니다.' };

  const description = String(form.get('description') ?? '').trim();
  const emoji = String(form.get('emoji') ?? '');
  const avatarUrl = String(form.get('avatarUrl') ?? '');
  const titleUrl = String(form.get('titleUrl') ?? '');

  // 바뀐 이미지의 예전 파일은 지운다
  if (avatarUrl !== (community.avatarUrl ?? '')) await removeUpload(community.avatarUrl);
  if (titleUrl !== (community.titleUrl ?? '')) await removeUpload(community.titleUrl);

  await repo.updateCommunity(communityId, {
    description,
    emoji: emoji || undefined,
    avatarUrl: avatarUrl || undefined,
    titleUrl: titleUrl || undefined,
  });

  revalidatePath(`/c/${community.slug}`);
  revalidatePath(`/c/${community.slug}/settings`);
  return { ok: true };
}

export async function createBoardAction(communityId: string, slug: string, name: string): Promise<void> {
  const me = await currentUser();
  const role = me ? (await repo.getMembership(communityId, me.id))?.role : undefined;
  if (role !== 'owner' && role !== 'admin') return;
  if (!name.trim()) return;

  const boards = await repo.listBoards(communityId);
  await repo.createBoard({
    id: uid('b_'),
    communityId,
    name: name.trim(),
    order: boards.length,
    createdAt: new Date().toISOString(),
  });
  revalidatePath(`/c/${slug}/settings`);
  revalidatePath(`/c/${slug}`);
}

export async function deleteBoardAction(boardId: string, slug: string): Promise<void> {
  const board = await repo.getBoard(boardId);
  if (!board || board.isNotice) return;

  const me = await currentUser();
  const role = me ? (await repo.getMembership(board.communityId, me.id))?.role : undefined;
  if (role !== 'owner' && role !== 'admin') return;

  await repo.deleteBoard(boardId);
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

  const community = await repo.getCommunityBySlug(slug);
  if (!community) return { error: '커뮤니티를 찾을 수 없습니다.' };

  // 수정
  if (postId) {
    const post = await repo.getPost(postId);
    if (!post) return { error: '이미 삭제된 글입니다.' };
    if (post.authorId !== me.id) return { error: '글을 수정할 권한이 없습니다.' };

    await repo.updatePost(postId, {
      title,
      content,
      tags,
      boardId,
      attachments,
      updatedAt: new Date().toISOString(),
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

  if (!(await repo.getMembership(community.id, me.id))) {
    await repo.createMembership({
      id: uid('m_'),
      communityId: community.id,
      userId: me.id,
      role: 'member',
      joinedAt: new Date().toISOString(),
    });
  }
  await repo.createPost(newPost);

  revalidatePath(`/c/${slug}`);
  revalidatePath('/');
  redirect(`/c/${slug}/post/${newPost.id}`);
}

/** 작성자 본인이거나 그 커뮤니티 운영진이면 지울 수 있다 */
export async function deletePostAction(postId: string, slug: string): Promise<void> {
  const me = await currentUser();
  if (!me) redirect('/login');

  const post = await repo.getPost(postId);
  if (!post) return;

  const role = (await repo.getMembership(post.communityId, me.id))?.role;
  const allowed = post.authorId === me.id || role === 'owner' || role === 'admin';
  if (!allowed) return;

  await repo.deletePost(postId);

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

  const post = await repo.getPost(postId);
  if (!post) return;

  const liked = [...post.likedBy];
  const disliked = [...post.dislikedBy];
  const mine = kind === 'like' ? liked : disliked;
  const other = kind === 'like' ? disliked : liked;

  const i = mine.indexOf(me.id);
  if (i >= 0) mine.splice(i, 1);
  else {
    mine.push(me.id);
    const j = other.indexOf(me.id);
    if (j >= 0) other.splice(j, 1);
  }
  await repo.updatePost(postId, { likedBy: liked, dislikedBy: disliked });
  revalidatePath(`/c/${slug}/post/${postId}`);
}

/** 조회수 — 글을 열 때 서버에서 올린다 */
export async function countViewAction(postId: string): Promise<void> {
  const post = await repo.getPost(postId);
  if (post) await repo.updatePost(postId, { views: post.views + 1 });
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
  await repo.createComment(comment);

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

  const [comment, post] = await Promise.all([repo.getComment(commentId), repo.getPost(postId)]);
  if (!comment || !post) return;

  const role = (await repo.getMembership(post.communityId, me.id))?.role;
  const allowed = comment.authorId === me.id || role === 'owner' || role === 'admin';
  if (!allowed) return;

  await repo.deleteComment(commentId);
  revalidatePath(`/c/${slug}/post/${postId}`);
}

// ---------------- 광고 배너 ----------------
//
// 배너는 사이트 전체에 보이고 수익과 직결되므로 사이트 운영자만 다룰 수 있다.
// 화면에서 버튼을 숨기는 것만으로는 부족해서, 동작마다 여기서 다시 확인한다.

/** 운영자가 아니면 막는다 */
async function requireSiteAdmin(): Promise<boolean> {
  return isSiteAdmin();
}


export async function createBannerAction(
  _prev: ActionState,
  form: FormData
): Promise<ActionState> {
  const title = String(form.get('title') ?? '').trim();
  const image = String(form.get('image') ?? '');
  const link = String(form.get('link') ?? '').trim() || undefined;

  if (!(await requireSiteAdmin())) return { error: '광고 배너는 운영자만 등록할 수 있습니다.' };
  if (!title) return { error: '배너 이름을 입력해 주세요.' };
  if (!image) return { error: '이미지를 올려 주세요.' };

  const { newBanner } = await import('./ads');
  const list = await repo.listAds();
  await repo.createAd(newBanner({ title, image, link }), list.length);

  revalidatePath('/');
  revalidatePath('/games');
  revalidatePath('/ads');
  return { ok: true };
}

export async function moveBannerAction(id: string, dir: -1 | 1): Promise<void> {
  if (!(await requireSiteAdmin())) return;
  const list = await repo.listAds();
  const i = list.findIndex((b) => b.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  await repo.reorderAds(list.map((b) => b.id));
  revalidatePath('/');
  revalidatePath('/games');
  revalidatePath('/ads');
}

export async function toggleBannerAction(id: string): Promise<void> {
  if (!(await requireSiteAdmin())) return;
  const list = await repo.listAds();
  const b = list.find((x) => x.id === id);
  if (b) await repo.updateAd(id, { active: !b.active });
  revalidatePath('/');
  revalidatePath('/games');
  revalidatePath('/ads');
}

export async function deleteBannerAction(id: string): Promise<void> {
  if (!(await requireSiteAdmin())) return;
  const list = await repo.listAds();
  const target = list.find((b) => b.id === id);
  if (target) await removeUpload(target.image);
  await repo.deleteAd(id);
  revalidatePath('/');
  revalidatePath('/games');
  revalidatePath('/ads');
}
