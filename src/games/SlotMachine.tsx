import { useEffect, useRef, useState } from 'react';
import { GameProps } from './types';

/** 🎰 슬롯머신 — 5열 3행 릴을 돌려 5개 라인에서 같은 그림을 맞춘다. */

const COLS = 5;
const ROWS = 3;

/** 심볼과 등장 가중치 (흔할수록 배당이 낮다) */
const SYMBOLS: { face: string; weight: number; pay: number }[] = [
  { face: '🍒', weight: 30, pay: 12 },
  { face: '🍋', weight: 25, pay: 15 },
  { face: '🔔', weight: 20, pay: 20 },
  { face: '⭐', weight: 13, pay: 30 },
  { face: '💎', weight: 8, pay: 50 },
  { face: '7️⃣', weight: 4, pay: 80 },
];

const PAY_BY_FACE: Record<string, number> = Object.fromEntries(
  SYMBOLS.map((s) => [s.face, s.pay])
);

/** 왼쪽부터 몇 개가 연속으로 같은지에 따른 배수 */
const MULTIPLIER: Record<number, number> = { 3: 1, 4: 3, 5: 8 };

/** 라인마다 각 열에서 어느 행을 지나는지 */
const PAYLINES: { name: string; rows: number[] }[] = [
  { name: '가운데', rows: [1, 1, 1, 1, 1] },
  { name: '윗줄', rows: [0, 0, 0, 0, 0] },
  { name: '아랫줄', rows: [2, 2, 2, 2, 2] },
  { name: 'V자', rows: [0, 1, 2, 1, 0] },
  { name: '∧자', rows: [2, 1, 0, 1, 2] },
];

const TOTAL_WEIGHT = SYMBOLS.reduce((a, s) => a + s.weight, 0);

function randomSymbol(): string {
  let r = Math.random() * TOTAL_WEIGHT;
  for (const s of SYMBOLS) {
    r -= s.weight;
    if (r <= 0) return s.face;
  }
  return SYMBOLS[0].face;
}

/** [열][행] */
type Grid = string[][];

function randomGrid(): Grid {
  return Array.from({ length: COLS }, () => Array.from({ length: ROWS }, randomSymbol));
}

interface Win {
  line: string;
  face: string;
  count: number;
  points: number;
  /** 빛나게 할 칸들 ("열-행") */
  cells: string[];
}

function evaluate(grid: Grid): Win[] {
  const wins: Win[] = [];
  for (const { name, rows } of PAYLINES) {
    const faces = rows.map((row, col) => grid[col][row]);
    let count = 1;
    while (count < COLS && faces[count] === faces[0]) count++;
    if (count < 3) continue;
    wins.push({
      line: name,
      face: faces[0],
      count,
      points: PAY_BY_FACE[faces[0]] * MULTIPLIER[count],
      cells: rows.slice(0, count).map((row, col) => `${col}-${row}`),
    });
  }
  return wins;
}

export default function SlotMachine({ onFinish }: GameProps) {
  const [grid, setGrid] = useState<Grid>(randomGrid);
  const [spinning, setSpinning] = useState<boolean[]>(Array(COLS).fill(false));
  const [wins, setWins] = useState<Win[] | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearInterval(t));
      timers.current.forEach((t) => window.clearTimeout(t));
    },
    []
  );

  const spin = () => {
    if (spinning.some(Boolean)) return;
    setWins(null);
    setSpinning(Array(COLS).fill(true));

    // 최종 결과를 먼저 정하고, 화면만 굴리다가 왼쪽부터 차례로 멈춘다
    const final = randomGrid();

    final.forEach((column, col) => {
      const roll = window.setInterval(() => {
        setGrid((prev) => {
          const next = prev.map((c) => [...c]);
          next[col] = Array.from({ length: ROWS }, randomSymbol);
          return next;
        });
      }, 70);
      timers.current.push(roll);

      const stop = window.setTimeout(() => {
        window.clearInterval(roll);
        setGrid((prev) => {
          const next = prev.map((c) => [...c]);
          next[col] = column;
          return next;
        });
        setSpinning((prev) => {
          const next = [...prev];
          next[col] = false;
          return next;
        });

        if (col === COLS - 1) {
          const result = evaluate(final);
          setWins(result);
          onFinish(result.reduce((a, w) => a + w.points, 0));
        }
      }, 700 + col * 320);
      timers.current.push(stop);
    });
  };

  const busy = spinning.some(Boolean);
  const lit = new Set(wins?.flatMap((w) => w.cells) ?? []);
  const total = wins?.reduce((a, w) => a + w.points, 0) ?? 0;

  return (
    <div className="flex flex-col items-center gap-3 w-[320px]">
      <div className="w-full rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 p-3 shadow-inner">
        <p className="text-center text-[11px] font-black tracking-[0.3em] text-amber-300 mb-2">
          ★ LUCKY SLOT 5×3 ★
        </p>

        <div className="flex justify-center gap-1">
          {grid.map((column, col) => (
            <div key={col} className="flex flex-col gap-1">
              {column.map((face, row) => {
                const isLit = lit.has(`${col}-${row}`);
                return (
                  <div
                    key={row}
                    className={`w-[56px] h-[50px] rounded-lg grid place-items-center text-[26px] transition-all ${
                      spinning[col] ? 'bg-white blur-[1.5px]' : isLit ? 'bg-amber-200 scale-105' : 'bg-white'
                    } ${wins && !isLit && wins.length > 0 ? 'opacity-45' : ''}`}
                  >
                    {face}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <p className="text-center mt-2 h-5 text-sm font-bold text-amber-200">
          {busy ? '두구두구…' : wins === null ? ' ' : total > 0 ? `+${total}점!` : '꽝… 다시 돌려보세요'}
        </p>
      </div>

      <button
        onClick={spin}
        disabled={busy}
        className="bg-amber-400 disabled:bg-slate-200 disabled:text-slate-400 text-slate-900 font-black px-8 py-3 rounded-xl hover:bg-amber-300"
      >
        {busy ? '돌아가는 중…' : '🎰 돌리기'}
      </button>

      {/* 당첨 라인 */}
      <div className="w-full min-h-[46px]">
        {wins && wins.length > 0 ? (
          <ul className="flex flex-wrap justify-center gap-1.5">
            {wins.map((w, i) => (
              <li
                key={i}
                className="text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 rounded-lg px-2 py-1"
              >
                {w.line} · {w.face}×{w.count} <span className="text-amber-500">+{w.points}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[11px] text-slate-400 text-center leading-relaxed">
            라인 5개(가운데 · 윗줄 · 아랫줄 · V자 · ∧자)에서
            <br />
            <b>왼쪽부터 3개 이상</b> 같은 그림이면 당첨 · 4개 3배 · 5개 8배
          </p>
        )}
      </div>
    </div>
  );
}
