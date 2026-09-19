import { useRef, useState } from 'react';
import { GameProps } from './types';

/** 🎡 행운 룰렛 — 버튼을 눌러 돌리고 멈춘 칸의 점수를 얻는다. */

const SEGMENTS = [
  { value: 100, color: '#f59e0b' },
  { value: 20, color: '#1e293b' },
  { value: 65, color: '#7c3aed' },
  { value: 35, color: '#b45309' },
  { value: 90, color: '#059669' },
  { value: 10, color: '#475569' },
  { value: 50, color: '#dc2626' },
  { value: 80, color: '#2563eb' },
];

const SLICE = 360 / SEGMENTS.length;

/** conic-gradient 로 원판 색을 만든다 */
const WHEEL_BG = `conic-gradient(${SEGMENTS.map(
  (s, i) => `${s.color} ${i * SLICE}deg ${(i + 1) * SLICE}deg`
).join(', ')})`;

export default function Roulette({ onFinish }: GameProps) {
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [landed, setLanded] = useState<number | null>(null);
  const turns = useRef(0);

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    setLanded(null);

    const idx = Math.floor(Math.random() * SEGMENTS.length);
    turns.current += 6;
    // 포인터는 12시 방향. 해당 칸의 중앙이 위로 오도록 회전각을 만든다.
    const target = turns.current * 360 + (360 - (idx * SLICE + SLICE / 2));
    setRotation(target);

    window.setTimeout(() => {
      setSpinning(false);
      setLanded(SEGMENTS[idx].value);
      onFinish(SEGMENTS[idx].value);
    }, 4200);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-[300px] h-[300px] grid place-items-center">
        {/* 포인터 */}
        <div
          className="absolute -top-1 z-20 w-0 h-0"
          style={{
            borderLeft: '11px solid transparent',
            borderRight: '11px solid transparent',
            borderTop: '20px solid #f59e0b',
          }}
        />
        <div
          className="w-[280px] h-[280px] rounded-full border-[6px] border-amber-400 shadow-xl relative"
          style={{
            background: WHEEL_BG,
            transform: `rotate(${rotation}deg)`,
            transition: spinning ? 'transform 4s cubic-bezier(0.15, 0.6, 0.15, 1)' : 'none',
          }}
        >
          {SEGMENTS.map((s, i) => (
            <span
              key={i}
              className="absolute left-1/2 top-1/2 text-white font-black text-lg"
              style={{
                transform: `rotate(${i * SLICE + SLICE / 2}deg) translateY(-104px) translateX(-50%)`,
                transformOrigin: 'top left',
              }}
            >
              {s.value}
            </span>
          ))}
          <div className="absolute inset-0 m-auto w-11 h-11 rounded-full bg-amber-400 border-4 border-white grid place-items-center text-lg">
            ★
          </div>
        </div>
      </div>

      <p className="h-7 text-xl font-black text-amber-500">
        {landed !== null ? `+${landed} 점!` : spinning ? ' ' : ' '}
      </p>

      <button
        onClick={spin}
        disabled={spinning}
        className="bg-amber-400 disabled:bg-slate-200 disabled:text-slate-400 text-slate-900 font-black px-8 py-3 rounded-xl hover:bg-amber-300"
      >
        {spinning ? '돌아가는 중…' : '🎡 돌리기'}
      </button>
    </div>
  );
}
