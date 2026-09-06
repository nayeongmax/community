// 게임 센터 · 익명 자유게시판 데이터 계층
//
// - 게시판 데이터는 store.ts 와 동일하게 Promise 를 반환한다.
//   (추후 Supabase 로 교체할 때 UI 를 건드리지 않기 위함)
// - 게임 기록/XP 는 "이 브라우저의 기록" 이라는 성격이라 동기 함수로 둔다.

import { uid, colorFromString } from './utils';

// ---------------- 게임 기록 ----------------

export interface GameRecord {
  gameId: string;
  /** 최고 점수 */
  best: number;
  /** 총 플레이 횟수 */
  plays: number;
  lastPlayedAt: string;
}

export interface ArcadeProfile {
  xp: number;
  records: Record<string, GameRecord>;
}

const PROFILE_KEY = 'arcade-profile-v1';
/** 레벨 1칸에 필요한 XP */
const XP_PER_LEVEL = 300;

function emptyProfile(): ArcadeProfile {
  return { xp: 0, records: {} };
}

export function getProfile(): ArcadeProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return { ...emptyProfile(), ...(JSON.parse(raw) as ArcadeProfile) };
  } catch {
    /* ignore */
  }
  return emptyProfile();
}

function saveProfile(p: ArcadeProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
}

export interface PlayResult {
  score: number;
  xpGained: number;
  best: number;
  isNewBest: boolean;
  level: number;
  levelUp: boolean;
}

/** 한 판이 끝났을 때 점수를 기록하고 XP 를 지급한다. */
export function recordPlay(gameId: string, score: number, xpGained: number): PlayResult {
  const p = getProfile();
  const prev = p.records[gameId];
  const beforeLevel = levelOf(p.xp);
  const best = Math.max(prev?.best ?? 0, score);

  p.records[gameId] = {
    gameId,
    best,
    plays: (prev?.plays ?? 0) + 1,
    lastPlayedAt: new Date().toISOString(),
  };
  p.xp += Math.max(0, xpGained);
  saveProfile(p);

  const level = levelOf(p.xp);
  return {
    score,
    xpGained,
    best,
    isNewBest: score > (prev?.best ?? -1) && score > 0,
    level,
    levelUp: level > beforeLevel,
  };
}

export function levelOf(xp: number): number {
  return Math.floor(xp / XP_PER_LEVEL) + 1;
}

/** 현재 레벨 안에서의 진행도 (0~1) 와 다음 레벨까지 남은 XP */
export function levelProgress(xp: number): { ratio: number; remain: number } {
  const inLevel = xp % XP_PER_LEVEL;
  return { ratio: inLevel / XP_PER_LEVEL, remain: XP_PER_LEVEL - inLevel };
}

export function resetProfile(): void {
  localStorage.removeItem(PROFILE_KEY);
}

// ---------------- 익명 자유게시판 ----------------

export const BOARD_CATEGORIES = ['자유', '유머', '질문', '게임', '고민', '정보'] as const;
export type BoardCategory = (typeof BOARD_CATEGORIES)[number];

export type BoardSort = 'new' | 'hot' | 'comments';

export interface AnonComment {
  id: string;
  postId: string;
  nickname: string;
  color: string;
  content: string;
  /** 삭제용 비밀번호 (데모: 평문 저장. 실제 서비스라면 서버에서 해시 처리) */
  password: string;
  /** 작성한 브라우저 식별자 — 본인 글 표시/삭제용 */
  authorKey: string;
  createdAt: string;
}

export interface AnonPost {
  id: string;
  category: BoardCategory;
  nickname: string;
  color: string;
  title: string;
  content: string;
  password: string;
  authorKey: string;
  views: number;
  likes: number;
  /** 게임 점수 자랑 글이면 표시되는 배지 (예: "🎯 다트 던지기 120점") */
  scoreBadge?: string;
  createdAt: string;
}

interface BoardDB {
  posts: AnonPost[];
  comments: AnonComment[];
}

const BOARD_KEY = 'arcade-board-v1';
const AUTHOR_KEY = 'arcade-author-key';
const LIKED_KEY = 'arcade-liked-v1';

/** 이 브라우저의 익명 식별자 (본인 글 판별용) */
export function authorKey(): string {
  let k = localStorage.getItem(AUTHOR_KEY);
  if (!k) {
    k = uid('a_');
    localStorage.setItem(AUTHOR_KEY, k);
  }
  return k;
}

const NICK_HEAD = [
  '지나가던', '배고픈', '잠 못 드는', '오늘도', '뒹굴대는', '심심한', '조용한',
  '신난', '수줍은', '용감한', '느긋한', '반짝이는', '커피 마신', '야근하는',
];
const NICK_TAIL = [
  '감자', '고양이', '너구리', '펭귄', '햄스터', '붕어빵', '두더지', '수달',
  '알파카', '토끼', '문어', '다람쥐', '판다', '개구리',
];

/** 글마다 새로 뽑는 익명 닉네임 */
export function randomNickname(): string {
  const h = NICK_HEAD[Math.floor(Math.random() * NICK_HEAD.length)];
  const t = NICK_TAIL[Math.floor(Math.random() * NICK_TAIL.length)];
  return `${h} ${t}`;
}

function emptyBoard(): BoardDB {
  return { posts: [], comments: [] };
}

let _board: BoardDB | null = null;

function board(): BoardDB {
  if (_board) return _board;
  try {
    const raw = localStorage.getItem(BOARD_KEY);
    if (raw) {
      _board = { ...emptyBoard(), ...(JSON.parse(raw) as BoardDB) };
      return _board;
    }
  } catch {
    /* ignore */
  }
  _board = seedBoard();
  commit();
  return _board;
}

function commit(): void {
  if (_board) localStorage.setItem(BOARD_KEY, JSON.stringify(_board));
}

function likedSet(): Set<string> {
  try {
    const raw = localStorage.getItem(LIKED_KEY);
    if (raw) return new Set(JSON.parse(raw) as string[]);
  } catch {
    /* ignore */
  }
  return new Set();
}

export function hasLiked(postId: string): boolean {
  return likedSet().has(postId);
}

export interface PostView extends AnonPost {
  commentCount: number;
  liked: boolean;
  mine: boolean;
}

function toView(p: AnonPost, d: BoardDB, liked: Set<string>, me: string): PostView {
  return {
    ...p,
    commentCount: d.comments.filter((c) => c.postId === p.id).length,
    liked: liked.has(p.id),
    mine: p.authorKey === me,
  };
}

export async function listPosts(opts: {
  category?: BoardCategory | '전체';
  sort?: BoardSort;
  q?: string;
} = {}): Promise<PostView[]> {
  const d = board();
  const liked = likedSet();
  const me = authorKey();
  const q = opts.q?.trim().toLowerCase();

  let rows = d.posts.map((p) => toView(p, d, liked, me));

  if (opts.category && opts.category !== '전체') {
    rows = rows.filter((p) => p.category === opts.category);
  }
  if (q) {
    rows = rows.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.content.toLowerCase().includes(q) ||
        p.nickname.toLowerCase().includes(q)
    );
  }

  const sort = opts.sort ?? 'new';
  rows.sort((a, b) => {
    if (sort === 'hot') return b.likes * 3 + b.commentCount * 2 - (a.likes * 3 + a.commentCount * 2);
    if (sort === 'comments') return b.commentCount - a.commentCount;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return rows;
}

export async function createPost(input: {
  category: BoardCategory;
  title: string;
  content: string;
  password: string;
  nickname?: string;
  scoreBadge?: string;
}): Promise<AnonPost> {
  const title = input.title.trim();
  const content = input.content.trim();
  if (!title) throw new Error('제목을 입력해 주세요.');
  if (!content) throw new Error('내용을 입력해 주세요.');
  if (!/^\d{4}$/.test(input.password)) throw new Error('삭제용 비밀번호는 숫자 4자리로 입력해 주세요.');

  const nickname = input.nickname?.trim() || randomNickname();
  const post: AnonPost = {
    id: uid('ap_'),
    category: input.category,
    nickname,
    color: colorFromString(nickname + Date.now()),
    title,
    content,
    password: input.password,
    authorKey: authorKey(),
    views: 0,
    likes: 0,
    scoreBadge: input.scoreBadge,
    createdAt: new Date().toISOString(),
  };
  const d = board();
  d.posts.unshift(post);
  commit();
  return post;
}

export async function deletePost(postId: string, password: string): Promise<void> {
  const d = board();
  const post = d.posts.find((p) => p.id === postId);
  if (!post) throw new Error('이미 삭제된 글입니다.');
  if (post.authorKey !== authorKey() && post.password !== password) {
    throw new Error('비밀번호가 올바르지 않습니다.');
  }
  d.posts = d.posts.filter((p) => p.id !== postId);
  d.comments = d.comments.filter((c) => c.postId !== postId);
  commit();
}

export async function toggleLike(postId: string): Promise<number> {
  const d = board();
  const post = d.posts.find((p) => p.id === postId);
  if (!post) throw new Error('이미 삭제된 글입니다.');

  const liked = likedSet();
  if (liked.has(postId)) {
    liked.delete(postId);
    post.likes = Math.max(0, post.likes - 1);
  } else {
    liked.add(postId);
    post.likes += 1;
  }
  localStorage.setItem(LIKED_KEY, JSON.stringify([...liked]));
  commit();
  return post.likes;
}

export async function viewPost(postId: string): Promise<void> {
  const d = board();
  const post = d.posts.find((p) => p.id === postId);
  if (post) {
    post.views += 1;
    commit();
  }
}

export async function listComments(postId: string): Promise<(AnonComment & { mine: boolean })[]> {
  const me = authorKey();
  return board()
    .comments.filter((c) => c.postId === postId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((c) => ({ ...c, mine: c.authorKey === me }));
}

export async function addComment(
  postId: string,
  content: string,
  password: string
): Promise<AnonComment> {
  const text = content.trim();
  if (!text) throw new Error('댓글 내용을 입력해 주세요.');
  if (!/^\d{4}$/.test(password)) throw new Error('삭제용 비밀번호는 숫자 4자리로 입력해 주세요.');

  const nickname = randomNickname();
  const comment: AnonComment = {
    id: uid('ac_'),
    postId,
    nickname,
    color: colorFromString(nickname + Date.now()),
    content: text,
    password,
    authorKey: authorKey(),
    createdAt: new Date().toISOString(),
  };
  const d = board();
  d.comments.push(comment);
  commit();
  return comment;
}

export async function deleteComment(commentId: string, password: string): Promise<void> {
  const d = board();
  const c = d.comments.find((x) => x.id === commentId);
  if (!c) throw new Error('이미 삭제된 댓글입니다.');
  if (c.authorKey !== authorKey() && c.password !== password) {
    throw new Error('비밀번호가 올바르지 않습니다.');
  }
  d.comments = d.comments.filter((x) => x.id !== commentId);
  commit();
}

// ---------------- 데모 시드 ----------------

function seedBoard(): BoardDB {
  const now = Date.now();
  const at = (minAgo: number) => new Date(now - minAgo * 60000).toISOString();
  const mk = (
    i: number,
    category: BoardCategory,
    title: string,
    content: string,
    minAgo: number,
    likes: number,
    scoreBadge?: string
  ): AnonPost => {
    const nickname = randomNickname();
    return {
      id: 'seed_p' + i,
      category,
      nickname,
      color: colorFromString(nickname + i),
      title,
      content,
      password: '0000',
      authorKey: 'seed',
      views: 20 + ((i * 37) % 400),
      likes,
      scoreBadge,
      createdAt: at(minAgo),
    };
  };

  const posts: AnonPost[] = [
    mk(1, '게임', '다트 5발 만점 나온 사람 있음?', '바람 강할 때 조준이 진짜 안 되네요… 저는 218점이 최고입니다.', 6, 12, '🎯 다트 던지기 218점'),
    mk(2, '유머', '스네이크 하다가 자기 꼬리 물고 현타옴', '분명히 왼쪽 눌렀는데 몸이 오른쪽으로 갔어요. 손가락 탓이 아님.', 24, 21),
    mk(3, '자유', '다들 점심 뭐 드셨나요', '저는 편의점 삼각김밥… 오늘도 책상 앞에서 해결했습니다.', 41, 5),
    mk(4, '질문', '브레이크아웃 마지막 벽돌 깨는 팁 있나요', '한 개 남기고 계속 놓쳐서 3판 연속 실패 중입니다. 각도 조절 어떻게 하세요?', 78, 8),
    mk(5, '게임', '풍선 터뜨리기 68개 찍었습니다', '작은 풍선만 노리는 게 점수는 더 잘 나오는 것 같아요.', 96, 17, '🎈 풍선 터뜨리기 68점'),
    mk(6, '고민', '취미가 없어서 고민입니다', '퇴근하면 누워서 폰만 보다가 하루가 끝나요. 다들 뭐 하면서 시간 보내세요?', 150, 9),
    mk(7, '정보', '반응속도 200ms 아래로 내리는 법', '화면 전체를 보지 말고 살짝 초점을 흐리게 두면 색 변화가 더 빨리 보입니다.', 220, 14),
    mk(8, '유머', '슬롯머신 3연속 꽝', '오늘 운은 다 쓴 것 같으니 복권은 내일 긁겠습니다.', 300, 6),
  ];

  const cmt = (i: number, postId: string, content: string, minAgo: number): AnonComment => {
    const nickname = randomNickname();
    return {
      id: 'seed_c' + i,
      postId,
      nickname,
      color: colorFromString(nickname + 'c' + i),
      content,
      password: '0000',
      authorKey: 'seed',
      createdAt: at(minAgo),
    };
  };

  const comments: AnonComment[] = [
    cmt(1, 'seed_p1', '저 236점이요. 바람 약할 때만 던지면 됩니다', 4),
    cmt(2, 'seed_p1', '218도 충분히 잘하신 거예요…', 2),
    cmt(3, 'seed_p2', '그거 저도 당했습니다 ㅋㅋㅋ', 20),
    cmt(4, 'seed_p4', '벽 튕기는 각도로 위쪽에 넣으면 알아서 깨져요', 60),
    cmt(5, 'seed_p4', '패들 끝에 맞히면 각이 커집니다', 55),
    cmt(6, 'seed_p6', '저는 산책이요. 생각보다 머리가 비워집니다', 120),
    cmt(7, 'seed_p7', '오 이거 해보니까 진짜 빨라졌어요', 180),
  ];

  return { posts, comments };
}
