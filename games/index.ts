// 게임 센터에 노출되는 게임 목록
//
// 여기에 GameDef 하나를 추가하면 카드/모달/기록이 자동으로 붙는다.

import { GameDef } from './types';
import BalloonPop from './BalloonPop';
import Reaction from './Reaction';
import MemoryFlip from './MemoryFlip';
import SlotMachine from './SlotMachine';
import Roulette from './Roulette';
import ScratchCard from './ScratchCard';
import Snake from './Snake';
import Breakout from './Breakout';
import Flappy from './Flappy';
import Dart from './Dart';
import TriviaQuiz from './TriviaQuiz';
import OXQuiz from './OXQuiz';

export const GAMES: GameDef[] = [
  {
    id: 'trivia',
    title: '일반상식 퀴즈',
    emoji: '🧠',
    tagline: '4지선다 10문제',
    howTo: '문제당 15초 · 빨리 맞힐수록 점수가 올라갑니다',
    badge: 'NEW',
    card: 'bg-gradient-to-br from-blue-100 to-indigo-50 border-blue-200',
    accent: 'text-blue-600',
    xpRate: 0.25,
    maxXp: 60,
    Component: TriviaQuiz,
  },
  {
    id: 'oxquiz',
    title: '카지노 OX 퀴즈',
    emoji: '🃏',
    tagline: '룰 · 확률 · 상식',
    howTo: '카지노 룰·확률·문화 문제 · O 인지 X 인지 고르세요 · 3연속 정답부터 콤보 보너스',
    badge: 'NEW',
    card: 'bg-gradient-to-br from-teal-100 to-emerald-50 border-teal-200',
    accent: 'text-teal-600',
    xpRate: 0.45,
    maxXp: 60,
    Component: OXQuiz,
  },
  {
    id: 'dart',
    title: '다트 던지기',
    emoji: '🎯',
    tagline: '5발 합산 점수',
    howTo: '흔들리는 조준선을 보고 클릭 · 바람이 셀수록 많이 밀립니다',
    badge: 'HOT',
    card: 'bg-gradient-to-br from-rose-100 to-rose-50 border-rose-200',
    accent: 'text-rose-600',
    xpRate: 0.25,
    maxXp: 60,
    Component: Dart,
  },
  {
    id: 'roulette',
    title: '행운 룰렛',
    emoji: '🎡',
    tagline: '한 번에 최대 100점',
    howTo: '버튼을 눌러 돌리고 멈춘 칸의 점수를 얻습니다',
    badge: 'SPECIAL',
    card: 'bg-gradient-to-br from-violet-100 to-indigo-50 border-violet-200',
    accent: 'text-violet-600',
    xpRate: 0.4,
    maxXp: 40,
    Component: Roulette,
  },
  {
    id: 'slot',
    title: '슬롯머신',
    emoji: '🎰',
    tagline: '크레딧 100 · 5라인',
    howTo: '크레딧을 걸고 돌립니다 · 왼쪽 릴부터 3개 이상 · WILD 는 아무 그림이나 대신 · 💎 스캐터 3개면 프리스핀',
    card: 'bg-gradient-to-br from-slate-800 to-slate-700 border-slate-700 text-white',
    accent: 'text-amber-300',
    // 점수 = 남은 크레딧 (시작 100). 본전이면 25XP 쯤 된다.
    xpRate: 0.25,
    maxXp: 60,
    Component: SlotMachine,
  },
  {
    id: 'scratch',
    title: '긁는 복권',
    emoji: '🎟',
    tagline: '긁어서 당첨 확인',
    howTo: '은박을 마우스로 긁으면 당첨금이 보입니다',
    card: 'bg-gradient-to-br from-amber-100 to-amber-50 border-amber-200',
    accent: 'text-amber-600',
    xpRate: 0.4,
    maxXp: 40,
    Component: ScratchCard,
  },
  {
    id: 'flappy',
    title: '파이프 통과',
    emoji: '🐤',
    tagline: '몇 개나 통과할까',
    howTo: '클릭 또는 스페이스로 날갯짓해서 파이프 사이를 지나갑니다',
    badge: 'NEW',
    card: 'bg-gradient-to-br from-sky-100 to-sky-50 border-sky-200',
    accent: 'text-sky-600',
    xpRate: 4,
    maxXp: 60,
    Component: Flappy,
  },
  {
    id: 'snake',
    title: '스네이크',
    emoji: '🐍',
    tagline: '사과 먹고 길어지기',
    howTo: '방향키 · WASD · 화면 버튼으로 조작합니다',
    badge: 'NEW',
    card: 'bg-gradient-to-br from-emerald-100 to-emerald-50 border-emerald-200',
    accent: 'text-emerald-600',
    xpRate: 0.5,
    maxXp: 60,
    Component: Snake,
  },
  {
    id: 'breakout',
    title: '브레이크아웃',
    emoji: '🧱',
    tagline: '벽돌 30개 격파',
    howTo: '마우스를 좌우로 움직여 공을 받아냅니다 · 목숨 3개',
    badge: 'NEW',
    card: 'bg-gradient-to-br from-fuchsia-100 to-purple-50 border-fuchsia-200',
    accent: 'text-fuchsia-600',
    xpRate: 0.15,
    maxXp: 60,
    Component: Breakout,
  },
  {
    id: 'balloon',
    title: '풍선 터뜨리기',
    emoji: '🎈',
    tagline: '30초 클릭 승부',
    howTo: '올라오는 풍선을 클릭 · 작은 풍선일수록 고득점',
    card: 'bg-gradient-to-br from-pink-100 to-rose-50 border-pink-200',
    accent: 'text-pink-600',
    xpRate: 0.5,
    maxXp: 60,
    Component: BalloonPop,
  },
  {
    id: 'reaction',
    title: '반응속도',
    emoji: '⚡',
    tagline: '초록 보이면 바로 클릭',
    howTo: '빨강일 때 기다렸다가 초록으로 바뀌면 클릭 · 5라운드',
    card: 'bg-gradient-to-br from-yellow-100 to-amber-50 border-yellow-200',
    accent: 'text-yellow-600',
    xpRate: 0.12,
    maxXp: 50,
    Component: Reaction,
  },
  {
    id: 'memory',
    title: '짝 맞추기',
    emoji: '🃏',
    tagline: '6쌍을 빠르게',
    howTo: '카드를 뒤집어 같은 그림 6쌍을 모두 찾습니다',
    card: 'bg-gradient-to-br from-cyan-100 to-teal-50 border-cyan-200',
    accent: 'text-cyan-600',
    xpRate: 0.12,
    maxXp: 50,
    Component: MemoryFlip,
  },
];

export function getGame(id: string): GameDef | undefined {
  return GAMES.find((g) => g.id === id);
}
