import { useEffect, useRef, useState } from 'react';
import { GameProps } from './types';

/** 🎰 슬롯머신 — 릴 3개를 돌려 같은 그림을 맞춘다. */

const SYMBOLS = ['🍒', '🍋', '🔔', '⭐', '💎', '7️⃣'];
/** 3개 다 맞췄을 때 배당 */
const TRIPLE: Record<string, number> = {
  '🍒': 40, '🍋': 50, '🔔': 60, '⭐': 80, '💎': 100, '7️⃣': 150,
};
/** 2개 맞췄을 때 배당 */
const DOUBLE = 20;

export default function SlotMachine({ onFinish }: GameProps) {
  const [reels, setReels] = useState<string[]>(['🍒', '🔔', '⭐']);
  const [spinning, setSpinning] = useState<boolean[]>([false, false, false]);
  const [result, setResult] = useState<{ score: number; label: string } | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => window.clearInterval(t)), []);

  const spin = () => {
    if (spinning.some(Boolean)) return;
    setResult(null);
    setSpinning([true, true, true]);

    // 릴마다 최종 결과를 미리 뽑아두고, 화면만 굴리다가 순서대로 멈춘다
    const finals = [0, 1, 2].map(() => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]);

    finals.forEach((final, i) => {
      const roll = window.setInterval(() => {
        setReels((prev) => {
          const next = [...prev];
          next[i] = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
          return next;
        });
      }, 70);
      timers.current.push(roll);

      window.setTimeout(() => {
        window.clearInterval(roll);
        setReels((prev) => {
          const next = [...prev];
          next[i] = final;
          return next;
        });
        setSpinning((prev) => {
          const next = [...prev];
          next[i] = false;
          return next;
        });

        if (i === 2) {
          const [a, b, c] = finals;
          let score = 0;
          let label = '꽝… 다시 돌려보세요';
          if (a === b && b === c) {
            score = TRIPLE[a];
            label = `🎉 ${a}${a}${a} 잭팟!`;
          } else if (a === b || b === c || a === c) {
            score = DOUBLE;
            label = '아깝다! 2개 일치';
          }
          setResult({ score, label });
          onFinish(score);
        }
      }, 800 + i * 500);
    });
  };

  const busy = spinning.some(Boolean);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="w-[320px] rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 p-5 shadow-inner">
        <p className="text-center text-[11px] font-black tracking-[0.3em] text-amber-300 mb-3">
          ★ LUCKY SLOT ★
        </p>
        <div className="flex justify-center gap-2">
          {reels.map((s, i) => (
            <div
              key={i}
              className={`w-[88px] h-[110px] rounded-xl bg-white grid place-items-center text-5xl ${
                spinning[i] ? 'blur-[1.5px]' : ''
              }`}
            >
              {s}
            </div>
          ))}
        </div>
        <p className="text-center mt-3 h-5 text-sm font-bold text-amber-200">
          {busy ? '두구두구…' : result?.label ?? ' '}
        </p>
      </div>

      <button
        onClick={spin}
        disabled={busy}
        className="bg-amber-400 disabled:bg-slate-200 disabled:text-slate-400 text-slate-900 font-black px-8 py-3 rounded-xl hover:bg-amber-300"
      >
        {busy ? '돌아가는 중…' : '🎰 돌리기'}
      </button>

      <p className="text-[11px] text-slate-400 text-center leading-relaxed">
        7️⃣ 세 개 150점 · 💎 100점 · ⭐ 80점 · 🔔 60점 · 🍋 50점 · 🍒 40점<br />
        두 개만 맞아도 {DOUBLE}점
      </p>
    </div>
  );
}
