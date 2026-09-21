'use client';

import { useEffect, useRef, useState } from 'react';
import { GameProps } from './types';

/** 🃏 짝 맞추기 — 6쌍의 카드를 뒤집어 짝을 찾는다. 빠르고 적은 횟수일수록 고득점. */

const FACES = ['🍑', '🐤', '🌊', '🍀', '🎧', '🚀'];

interface Card {
  id: number;
  face: string;
  matched: boolean;
}

function shuffled(): Card[] {
  const deck = [...FACES, ...FACES].map((face, id) => ({ id, face, matched: false }));
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export default function MemoryFlip({ onFinish }: GameProps) {
  const [cards, setCards] = useState<Card[]>(shuffled);
  const [open, setOpen] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [done, setDone] = useState(false);
  const [score, setScore] = useState(0);
  const startedAt = useRef<number | null>(null);
  const lock = useRef(false);

  useEffect(() => {
    if (done || startedAt.current === null) return;
    const t = setInterval(() => {
      setElapsed(Math.floor((Date.now() - (startedAt.current ?? Date.now())) / 1000));
    }, 250);
    return () => clearInterval(t);
  }, [done, moves]);

  const flip = (idx: number) => {
    if (done || lock.current) return;
    if (cards[idx].matched || open.includes(idx)) return;
    if (startedAt.current === null) startedAt.current = Date.now();

    const next = [...open, idx];
    setOpen(next);
    if (next.length < 2) return;

    setMoves((m) => m + 1);
    const [a, b] = next;

    if (cards[a].face === cards[b].face) {
      const board = cards.map((c, i) => (i === a || i === b ? { ...c, matched: true } : c));
      setCards(board);
      setOpen([]);

      if (board.every((c) => c.matched)) {
        const secs = Math.floor((Date.now() - (startedAt.current ?? Date.now())) / 1000);
        const total = Math.max(50, 500 - secs * 6 - Math.max(0, moves + 1 - 6) * 12);
        setDone(true);
        setScore(total);
        onFinish(total);
      }
      return;
    }

    lock.current = true;
    setTimeout(() => {
      setOpen([]);
      lock.current = false;
    }, 700);
  };

  const restart = () => {
    setCards(shuffled());
    setOpen([]);
    setMoves(0);
    setElapsed(0);
    setDone(false);
    setScore(0);
    startedAt.current = null;
    lock.current = false;
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center justify-between w-[440px] text-base font-bold text-slate-700">
        <span>🔁 {moves}번</span>
        <span>⏱ {elapsed}초</span>
      </div>

      <div className="grid grid-cols-4 gap-3 w-[440px]">
        {cards.map((c, i) => {
          const face = c.matched || open.includes(i);
          return (
            <button
              key={c.id}
              onClick={() => flip(i)}
              className={`h-[100px] rounded-xl text-5xl grid place-items-center transition-all ${
                face
                  ? c.matched
                    ? 'bg-emerald-100 ring-2 ring-emerald-300'
                    : 'bg-white ring-2 ring-indigo-300'
                  : 'bg-gradient-to-br from-indigo-500 to-violet-500 text-white/70'
              }`}
            >
              {face ? c.face : '?'}
            </button>
          );
        })}
      </div>

      {done ? (
        <div className="text-center">
          <p className="font-black text-slate-800 text-lg">🎉 완성! {score}점</p>
          <button
            onClick={restart}
            className="mt-2 bg-indigo-600 text-white font-bold px-5 py-2 rounded-xl hover:bg-indigo-700"
          >
            다시하기
          </button>
        </div>
      ) : (
        <button onClick={restart} className="text-sm text-slate-500 hover:text-slate-700 underline">
          카드 다시 섞기
        </button>
      )}
    </div>
  );
}
