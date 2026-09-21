'use client';

import { useEffect, useRef, useState } from 'react';
import { GameProps } from './types';

/** 🎯 다트 던지기 — 흔들리는 조준선을 보고 클릭. 바람이 셀수록 많이 밀린다. 5발 합산. */

const SIZE = 440;
const CX = SIZE / 2;
const CY = SIZE / 2;
const THROWS = 5;
/** [반지름, 점수] — 안쪽부터 */
const RINGS: [number, number][] = [
  [16, 50],
  [34, 40],
  [56, 30],
  [80, 20],
  [104, 10],
];

interface Mark { x: number; y: number; points: number }

function scoreAt(x: number, y: number): number {
  const d = Math.hypot(x - CX, y - CY);
  for (const [r, p] of RINGS) if (d <= r) return p;
  return 0;
}

function windLabel(strength: number): string {
  return ['잔잔', '약함', '보통', '강함'][strength] ?? '보통';
}

export default function Dart({ onFinish }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const marks = useRef<Mark[]>([]);
  const tick = useRef(0);
  const aim = useRef({ x: CX, y: CY });
  const wind = useRef({ strength: 1, dir: 1 });
  const [thrown, setThrown] = useState(0);
  const [total, setTotal] = useState(0);
  const [last, setLast] = useState<number | null>(null);
  const [windView, setWindView] = useState({ strength: 1, dir: 1 });

  const rollWind = () => {
    const next = { strength: Math.floor(Math.random() * 4), dir: Math.random() < 0.5 ? -1 : 1 };
    wind.current = next;
    setWindView(next);
  };

  useEffect(rollWind, []);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    let raf = 0;

    const draw = () => {
      ctx.fillStyle = '#0b1220';
      ctx.fillRect(0, 0, SIZE, SIZE);

      // 과녁
      const colors = ['#dc2626', '#16a34a', '#f8fafc', '#cbd5e1', '#f8fafc'];
      for (let i = RINGS.length - 1; i >= 0; i--) {
        ctx.fillStyle = colors[i];
        ctx.beginPath();
        ctx.arc(CX, CY, RINGS[i][0], 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(15,23,42,.35)';
        ctx.stroke();
      }

      // 꽂힌 다트
      ctx.font = '18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      marks.current.forEach((m) => {
        ctx.fillText(m.points > 0 ? '📌' : '❌', m.x, m.y);
      });

      // 흔들리는 조준선 (바람이 셀수록 크게 흔들린다)
      if (marks.current.length < THROWS) {
        tick.current += 0.035;
        const amp = 46 + wind.current.strength * 16;
        const x = CX + Math.sin(tick.current * 1.7) * amp;
        const y = CY + Math.cos(tick.current * 2.3) * amp * 0.8;
        aim.current = { x, y };

        ctx.strokeStyle = '#f8fafc';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.moveTo(x - 16, y);
        ctx.lineTo(x + 16, y);
        ctx.moveTo(x, y - 16);
        ctx.lineTo(x, y + 16);
        ctx.stroke();
      }

      raf = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(raf);
  }, []);

  const throwDart = () => {
    if (marks.current.length >= THROWS) return;

    const { strength, dir } = wind.current;
    const drift = dir * strength * (4 + Math.random() * 7);
    const x = aim.current.x + drift;
    const y = aim.current.y + (Math.random() - 0.5) * strength * 8;
    const points = scoreAt(x, y);

    marks.current.push({ x, y, points });
    const sum = marks.current.reduce((a, m) => a + m.points, 0);
    setThrown(marks.current.length);
    setTotal(sum);
    setLast(points);

    if (marks.current.length >= THROWS) {
      onFinish(sum);
    } else {
      rollWind();
    }
  };

  const restart = () => {
    marks.current = [];
    setThrown(0);
    setTotal(0);
    setLast(null);
    rollWind();
  };

  const done = thrown >= THROWS;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center justify-between w-[440px] text-base font-bold text-slate-700">
        <span>
          바람{' '}
          <span className={windView.strength >= 2 ? 'text-rose-500' : 'text-emerald-600'}>
            {windView.dir < 0 ? '◀' : '▶'} {windLabel(windView.strength)}
          </span>
        </span>
        <span>
          {thrown}/{THROWS}발 · 합산 <span className="text-rose-500 text-2xl">{total}</span>
        </span>
      </div>

      <div className="relative rounded-2xl overflow-hidden" style={{ width: SIZE, height: SIZE }}>
        <canvas
          ref={canvasRef}
          width={SIZE}
          height={SIZE}
          className={done ? '' : 'cursor-crosshair'}
          style={{ touchAction: 'none' }}
          onPointerDown={throwDart}
        />
        {done && (
          <div className="absolute inset-0 grid place-items-center bg-slate-900/80 text-center">
            <div>
              <p className="text-2xl font-black text-white mb-1">🎯 {total}점</p>
              <p className="text-base text-slate-200 mb-4">한가운데는 50점 (5발 만점 250점)</p>
              <button
                onClick={restart}
                className="bg-rose-500 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-rose-400"
              >
                다시하기
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="h-6 text-base font-bold text-slate-600">
        {last === null ? '과녁을 클릭해서 던지세요' : last > 0 ? `+${last}점!` : '빗나갔습니다…'}
      </p>
    </div>
  );
}
