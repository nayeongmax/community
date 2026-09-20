// 게임 기록 · 마이 랜드
//
// 게임 기록과 XP 는 "이 브라우저의 기록" 이라 localStorage 에 둔다.
// 익명 게시판은 서로 보여야 하므로 서버로 옮겼다 (lib/server/board.ts).

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

// ---------------- 마이 랜드 ----------------
//
// 게임을 즐기고 게시판에서 활동할수록 내 랜드가 자라난다.
// 포인트는 "이 브라우저의 활동"을 집계한 값이다.

/** 활동 1건당 랜드 포인트 */
const LAND_WEIGHTS = { xp: 1, post: 25, comment: 10, like: 6 };

export const LAND_STAGES = [
  { name: '빈 터', at: 0, hint: '아직 아무것도 없는 땅이에요. 게임 한 판이면 시작됩니다.' },
  { name: '초가집', at: 120, hint: '첫 집이 생겼습니다. 불빛이 하나 켜졌어요.' },
  { name: '마을 어귀', at: 350, hint: '이웃이 들어오고 나무가 자랐습니다.' },
  { name: '상점 거리', at: 800, hint: '가게가 문을 열고 가로등이 켜졌어요.' },
  { name: '아파트 단지', at: 1600, hint: '땅값이 오르는 중입니다. 크레인이 돌아가요.' },
  { name: '랜드마크 타워', at: 3000, hint: '도시의 상징이 세워졌습니다. 최고 단계예요!' },
] as const;

export interface BoardContribution {
  /** 내가 쓴 글 수 */
  posts: number;
  /** 내가 쓴 댓글 수 */
  comments: number;
  /** 내 글이 받은 추천 수 */
  likes: number;
}

export interface LandStats {
  points: number;
  /** 항목별 획득 포인트 */
  breakdown: { games: number; posts: number; comments: number; likes: number };
  /** 항목별 활동 개수 */
  counts: { plays: number; posts: number; comments: number; likes: number };
  /** 0 ~ LAND_STAGES.length - 1 */
  stage: number;
  stageName: string;
  /** 다음 단계 필요 포인트 (최고 단계면 null) */
  nextAt: number | null;
  /** 현재 단계 안에서의 진행도 0~1 */
  progress: number;
}

/**
 * 랜드 포인트 계산.
 * 게임 기록은 브라우저에, 게시판 활동은 서버에 있어서 둘을 합쳐 쓴다.
 */
export function getLandStats(board: BoardContribution): LandStats {
  const profile = getProfile();
  const plays = Object.values(profile.records).reduce((a, r) => a + r.plays, 0);

  const breakdown = {
    games: profile.xp * LAND_WEIGHTS.xp,
    posts: board.posts * LAND_WEIGHTS.post,
    comments: board.comments * LAND_WEIGHTS.comment,
    likes: board.likes * LAND_WEIGHTS.like,
  };
  const points = breakdown.games + breakdown.posts + breakdown.comments + breakdown.likes;

  let stage = 0;
  for (let i = LAND_STAGES.length - 1; i >= 0; i--) {
    if (points >= LAND_STAGES[i].at) {
      stage = i;
      break;
    }
  }

  const isMax = stage === LAND_STAGES.length - 1;
  const from = LAND_STAGES[stage].at;
  const nextAt = isMax ? null : LAND_STAGES[stage + 1].at;

  return {
    points,
    breakdown,
    counts: { plays, ...board },
    stage,
    stageName: LAND_STAGES[stage].name,
    nextAt,
    progress: nextAt === null ? 1 : Math.min(1, (points - from) / (nextAt - from)),
  };
}
