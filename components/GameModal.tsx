'use client';

import { useCallback, useEffect, useState } from 'react';
import { GameDef, xpFor } from '../games/types';
import { PlayResult, recordPlay } from '../lib/arcade';

interface Props {
  game: GameDef;
  onClose: () => void;
  /** 한 판이 끝나 기록이 저장되면 호출 (상단 프로필 갱신용) */
  onRecorded: () => void;
  /** 결과를 게시판에 자랑하기 */
  onBrag: (game: GameDef, score: number) => void;
}

export default function GameModal({ game, onClose, onRecorded, onBrag }: Props) {
  const [result, setResult] = useState<PlayResult | null>(null);
  const Game = game.Component;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  // 게임 내부 루프의 의존성으로 쓰이므로 정체성이 유지돼야 한다
  const handleFinish = useCallback(
    (score: number) => {
      const res = recordPlay(game.id, score, xpFor(game, score));
      setResult(res);
      onRecorded();
    },
    [game, onRecorded]
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-[#050615]/80 backdrop-blur-sm flex items-start sm:items-center justify-center p-3 overflow-y-auto"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="rounded-2xl w-full max-w-2xl my-auto shadow-2xl border border-white/10 bg-[#141834] overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-white/10">
          <span className="text-2xl">{game.emoji}</span>
          <h2 className="text-lg font-black text-white">{game.title}</h2>
          <button
            onClick={onClose}
            className="ml-auto w-9 h-9 rounded-full hover:bg-white/10 text-slate-300 text-xl"
            aria-label="닫기"
          >
            ✕
          </button>
        </div>

        <p className="px-5 py-2.5 text-sm text-slate-300 bg-white/[0.04]">{game.howTo}</p>

        <div className="p-4">
          <div className="rounded-2xl bg-white p-5 flex justify-center">
            <Game onFinish={handleFinish} />
          </div>
        </div>

        {result && (
          <div className="mx-4 mb-4 rounded-xl bg-amber-300/10 border border-amber-300/30 p-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xl font-black text-white">{result.score}점</span>
              <span className="text-base font-bold text-amber-300">+{result.xpGained} XP</span>
              {result.isNewBest && (
                <span className="text-xs font-black bg-rose-500 text-white px-2.5 py-1 rounded-full">
                  🎉 신기록!
                </span>
              )}
              {result.levelUp && (
                <span className="text-xs font-black bg-amber-400 text-slate-900 px-2.5 py-1 rounded-full">
                  ⬆ Lv.{result.level} 달성
                </span>
              )}
              <span className="text-sm text-slate-300 ml-auto">최고 {result.best}점</span>
            </div>
            <button
              onClick={() => onBrag(game, result.score)}
              className="mt-3 w-full text-base font-bold bg-amber-300 text-slate-900 rounded-lg py-2.5 hover:bg-amber-200"
            >
              📢 게시판에 점수 자랑하기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
