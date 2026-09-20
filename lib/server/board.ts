// 익명 자유게시판 (서버 저장)
//
// 예전에는 브라우저에만 저장돼 서로의 글이 보이지 않았다. 서버로 옮겨
// 방문자끼리 실제로 대화가 되게 하고, 익명 신원은 쿠키 하나로 구분한다.

import { cookies } from 'next/headers';
import { promises as fs } from 'fs';
import path from 'path';
import { colorFromString, uid } from '../utils';
import type { AnonComment, AnonPost, AnonPostView, BoardCategory, BoardSort } from '../board-types';

interface BoardDB {
  posts: AnonPost[];
  comments: AnonComment[];
}

const FILE = path.join(process.cwd(), 'data', 'board.json');
const ANON_COOKIE = 'community_anon';

const NICK_HEAD = [
  '지나가던', '배고픈', '잠 못 드는', '오늘도', '뒹굴대는', '심심한', '조용한',
  '신난', '수줍은', '용감한', '느긋한', '반짝이는', '커피 마신', '야근하는',
];
const NICK_TAIL = [
  '감자', '고양이', '너구리', '펭귄', '햄스터', '붕어빵', '두더지', '수달',
  '알파카', '토끼', '문어', '다람쥐', '판다', '개구리',
];

export function randomNickname(): string {
  const h = NICK_HEAD[Math.floor(Math.random() * NICK_HEAD.length)];
  const t = NICK_TAIL[Math.floor(Math.random() * NICK_TAIL.length)];
  return `${h} ${t}`;
}

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

let cache: BoardDB | null = null;

export async function readBoard(): Promise<BoardDB> {
  if (cache) return cache;
  try {
    cache = JSON.parse(await fs.readFile(FILE, 'utf8')) as BoardDB;
    return cache;
  } catch {
    cache = seed();
    await writeBoard(cache);
    return cache;
  }
}

export async function writeBoard(db: BoardDB): Promise<void> {
  cache = db;
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(db, null, 2), 'utf8');
}


export async function listAnonPosts(opts: {
  category?: BoardCategory | '전체';
  sort?: BoardSort;
  q?: string;
} = {}): Promise<AnonPostView[]> {
  const db = await readBoard();
  const me = await anonKey();
  const q = opts.q?.trim().toLowerCase();

  let rows = db.posts.map((p) => ({
    ...p,
    commentCount: db.comments.filter((c) => c.postId === p.id).length,
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
  const db = await readBoard();
  const me = await anonKey();
  return db.comments
    .filter((c) => c.postId === postId)
    .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
    .map((c) => ({ ...c, mine: c.authorKey === me }));
}

/** 마이 랜드에 더해질 내 게시판 활동 */
export async function myBoardContribution() {
  const db = await readBoard();
  const me = await anonKey();
  const myPosts = db.posts.filter((p) => p.authorKey === me);
  return {
    posts: myPosts.length,
    comments: db.comments.filter((c) => c.authorKey === me).length,
    likes: myPosts.reduce((a, p) => a + p.likedBy.length, 0),
  };
}

function seed(): BoardDB {
  const now = Date.now();
  const at = (min: number) => new Date(now - min * 60000).toISOString();
  const mk = (
    i: number,
    category: BoardCategory,
    title: string,
    content: string,
    min: number,
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
      likedBy: Array.from({ length: likes }, (_, k) => 'seed_like_' + i + '_' + k),
      scoreBadge,
      createdAt: at(min),
    };
  };

  const posts = [
    mk(1, '게임', '다트 5발 만점 나온 사람 있음?', '바람 강할 때 조준이 진짜 안 되네요… 저는 218점이 최고입니다.', 6, 12, '🎯 다트 던지기 218점'),
    mk(2, '유머', '스네이크 하다가 자기 꼬리 물고 현타옴', '분명히 왼쪽 눌렀는데 몸이 오른쪽으로 갔어요.', 24, 21),
    mk(3, '자유', '다들 점심 뭐 드셨나요', '저는 편의점 삼각김밥… 오늘도 책상 앞에서 해결했습니다.', 41, 5),
    mk(4, '질문', '브레이크아웃 마지막 벽돌 깨는 팁 있나요', '한 개 남기고 계속 실패 중입니다. 각도 조절 어떻게 하세요?', 78, 8),
    mk(5, '고민', '취미가 없어서 고민입니다', '퇴근하면 누워서 폰만 보다가 하루가 끝나요.', 150, 9),
    mk(6, '정보', '반응속도 200ms 아래로 내리는 법', '화면 전체를 보지 말고 초점을 살짝 흐리게 두면 더 빨리 보입니다.', 220, 14),
  ];

  const cmt = (i: number, postId: string, content: string, min: number): AnonComment => {
    const nickname = randomNickname();
    return {
      id: 'seed_c' + i,
      postId,
      nickname,
      color: colorFromString(nickname + 'c' + i),
      content,
      password: '0000',
      authorKey: 'seed',
      createdAt: at(min),
    };
  };

  return {
    posts,
    comments: [
      cmt(1, 'seed_p1', '저 236점이요. 바람 약할 때만 던지면 됩니다', 4),
      cmt(2, 'seed_p2', '그거 저도 당했습니다 ㅋㅋㅋ', 20),
      cmt(3, 'seed_p4', '벽 튕기는 각도로 위쪽에 넣으면 알아서 깨져요', 60),
      cmt(4, 'seed_p5', '저는 산책이요. 생각보다 머리가 비워집니다', 120),
    ],
  };
}
