// 게임 공통 계약
//
// 모든 게임은 한 판이 끝나면 onFinish(점수) 를 딱 한 번 호출한다.
// 점수 → XP 변환과 최고기록 저장은 게임 센터(GameModal)가 담당한다.

import type { ComponentType } from 'react';

export interface GameProps {
  /** 한 판이 끝났을 때 점수를 보고한다 */
  onFinish: (score: number) => void;
}

export interface GameDef {
  id: string;
  title: string;
  emoji: string;
  /** 카드에 보이는 한 줄 설명 */
  tagline: string;
  /** 모달 상단 조작법 */
  howTo: string;
  badge?: string;
  /** 카드 배경 (tailwind) */
  card: string;
  /** 카드 텍스트 강조색 (tailwind) */
  accent: string;
  /** 점수 1점당 XP */
  xpRate: number;
  /** 한 판에서 받을 수 있는 최대 XP */
  maxXp: number;
  Component: ComponentType<GameProps>;
}

/** 점수를 XP 로 환산 */
export function xpFor(def: GameDef, score: number): number {
  return Math.max(0, Math.min(def.maxXp, Math.round(score * def.xpRate)));
}
