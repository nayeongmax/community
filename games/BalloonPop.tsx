'use client';

import { useEffect, useRef, useState } from 'react';
import { GameProps } from './types';

/** 🎈 풍선 터뜨리기 — 30초 동안 올라오는 풍선을 클릭해서 터뜨린다. 작을수록 고득점. */

const DURATION = 30;
const W = 440;
const H = 520;
const COLORS = ['#f87171', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f472b6'];

interface Balloon {
  id: number;
  x: number;
  y: number;
  r: number;
  speed: number;
  color: string;
}

interface Pop {
  id: number;
  x: number;
  y: number;
  points: number;
}

export default function BalloonPop({ onFinish }: GameProps) {
  const [phase, setPhase] = useState<'ready' | 'play' | 'over'>('ready');
  const [score, setScore] = useState(0);
  const [left, setLeft] = useState(DURATION);
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [pops, setPops] = useState<Pop[]>([]);
  const seq = useRef(0);
  const scoreRef = useRef(0);

  useEffect(() => {
    if (phase !== 'play') return;
    const startedAt = Date.now();

    const timer = setInterval(() => {
      const elapsed = (Date.now() - startedAt) / 1000;
      setLeft(Math.max(0, Math.ceil(DURATION - elapsed)));

      if (elapsed >= DURATION) {
        setPhase('over');
        onFinish(scoreRef.current);
        return;
      }

      setBalloons((prev) => {
        const moved = prev
          .map((b) => ({ ...b, y: b.y - b.speed }))
          .filter((b) => b.y + b.r > -20);
        // 시간이 갈수록 조금씩 빨리 생성된다
        const rate = 0.3 + (elapsed / DURATION) * 0.25;
        if (moved.length < 12 && Math.random() < rate) {
          const r = 16 + Math.random() * 18;
          moved.push({
            id: ++seq.current,
            x: r + Math.random() * (W - r * 2),
            y: H + r,
            r,
            speed: 1.4 + Math.random() * 1.6 + (34 - r) * 0.05,
            color: COLORS[Math.floor(Math.random() * COLORS.length)],
          });
        }
        return moved;
      });
    }, 40);

    return () => clearInterval(timer);
  }, [phase, onFinish]);

  const pop = (b: Balloon) => {
    if (phase !== 'play') return;
    const points = Math.max(1, Math.round((36 - b.r) / 4) + 1);
    scoreRef.current += points;
    setScore(scoreRef.current);
    setBalloons((prev) => prev.filter((x) => x.id !== b.id));

    const popId = ++seq.current;
    setPops((prev) => [...prev, { id: popId, x: b.x, y: b.y, points }]);
    setTimeout(() => setPops((prev) => prev.filter((p) => p.id !== popId)), 600);
  };

  const start = () => {
    scoreRef.current = 0;
    setScore(0);
    setLeft(DURATION);
    setBalloons([]);
    setPops([]);
    setPhase('play');
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center justify-between w-[440px] text-base font-bold">
        <span className="text-slate-600">
          점수 <span className="text-rose-500 text-lg">{score}</span>
        </span>
        <span className={left <= 5 ? 'text-rose-500' : 'text-slate-600'}>⏱ {left}초</span>
      </div>

      <div
        className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-sky-200 to-sky-50 select-none"
        style={{ width: W, height: H }}
      >
        {balloons.map((b) => (
          <button
            key={b.id}
            onMouseDown={() => pop(b)}
            onTouchStart={(e) => {
              e.preventDefault();
              pop(b);
            }}
            className="absolute"
            style={{
              left: b.x - b.r,
              top: H - b.y - b.r,
              width: b.r * 2,
              height: b.r * 2.25,
              background: b.color,
              borderRadius: '50% 50% 45% 45%',
              boxShadow: 'inset -6px -8px 12px rgba(0,0,0,.18), inset 6px 6px 10px rgba(255,255,255,.5)',
            }}
            aria-label="풍선"
          />
        ))}

        {pops.map((p) => (
          <span
            key={p.id}
            className="absolute font-black text-rose-600 pointer-events-none"
            style={{ left: p.x - 12, top: H - p.y - 12 }}
          >
            +{p.points}
          </span>
        ))}

        {phase !== 'play' && (
          <div className="absolute inset-0 grid place-items-center bg-white/70 backdrop-blur-sm">
            <div className="text-center">
              {phase === 'over' && (
                <p className="text-2xl font-black text-slate-800 mb-1">🎈 {score}점</p>
              )}
              <p className="text-base text-slate-500 mb-4">작은 풍선일수록 점수가 높아요</p>
              <button
                onClick={start}
                className="bg-rose-500 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-rose-600"
              >
                {phase === 'over' ? '다시하기' : '시작하기'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
