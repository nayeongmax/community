'use client';

import { useEffect, useRef, useState } from 'react';
import { GameProps } from './types';

/**
 * 🎰 슬롯머신 — 실제 슬롯 규칙
 *
 *  · 크레딧을 걸고 돌린다 (라인당 베팅 × 5라인)
 *  · 라인 5개에서 **왼쪽 릴부터 이어지는** 같은 그림 3개 이상이면 당첨
 *  · 🃏 와일드는 다른 그림을 대신한다 (스캐터 제외)
 *  · 💎 스캐터는 라인과 무관하게 흩어져 있어도 3개 이상이면 프리스핀
 *  · 배당 = 심볼 배당표 × 라인 베팅
 *
 * 크레딧이 떨어지거나 '그만하기'를 누르면 한 판이 끝나고,
 * 남은 크레딧이 점수가 된다. (시작 100)
 */

const COLS = 5;
const ROWS = 3;
const START_CREDIT = 100;
const BETS = [1, 2, 5];
const FREE_SPINS = 8;

const WILD = '🃏';
const SCATTER = '💎';

/** 배당표 — [3개, 4개, 5개] 일 때 라인 베팅의 몇 배인가 */
const PAYTABLE: { face: string; weight: number; pay: [number, number, number] }[] = [
  { face: '🍒', weight: 28, pay: [2, 5, 15] },
  { face: '🍋', weight: 24, pay: [3, 8, 20] },
  { face: '🔔', weight: 18, pay: [4, 12, 30] },
  { face: '⭐', weight: 12, pay: [6, 20, 50] },
  { face: '7️⃣', weight: 6, pay: [10, 40, 120] },
  { face: WILD, weight: 5, pay: [15, 60, 200] },
  { face: SCATTER, weight: 7, pay: [0, 0, 0] }, // 스캐터는 프리스핀으로 보상
];

const PAY_BY_FACE = new Map(PAYTABLE.map((s) => [s.face, s.pay]));
const TOTAL_WEIGHT = PAYTABLE.reduce((a, s) => a + s.weight, 0);

/** 라인마다 각 열에서 어느 행을 지나는지 */
const PAYLINES: { name: string; rows: number[] }[] = [
  { name: '가운데', rows: [1, 1, 1, 1, 1] },
  { name: '윗줄', rows: [0, 0, 0, 0, 0] },
  { name: '아랫줄', rows: [2, 2, 2, 2, 2] },
  { name: 'V자', rows: [0, 1, 2, 1, 0] },
  { name: '∧자', rows: [2, 1, 0, 1, 2] },
];

function randomSymbol(): string {
  let r = Math.random() * TOTAL_WEIGHT;
  for (const s of PAYTABLE) {
    r -= s.weight;
    if (r <= 0) return s.face;
  }
  return PAYTABLE[0].face;
}

/** [열][행] */
type Grid = string[][];

const randomGrid = (): Grid =>
  Array.from({ length: COLS }, () => Array.from({ length: ROWS }, randomSymbol));

interface Win {
  line: string;
  face: string;
  count: number;
  credits: number;
  /** 빛나게 할 칸들 ("열-행") */
  cells: string[];
}

interface SpinResult {
  wins: Win[];
  credits: number;
  scatters: string[];
  freeSpins: number;
}

/**
 * 한 라인을 왼쪽부터 훑는다.
 * 와일드는 아무 그림이나 대신하므로, 첫 그림은 와일드가 아닌 것으로 정한다.
 */
function evaluateLine(faces: string[], lineBet: number, name: string, rows: number[]): Win | null {
  // 스캐터는 라인으로 치지 않는다
  if (faces[0] === SCATTER) return null;

  const base = faces.find((f) => f !== WILD && f !== SCATTER);
  if (!base) return null; // 와일드만 늘어선 경우는 아래 와일드 배당으로 잡힌다

  let count = 0;
  for (const f of faces) {
    if (f === base || f === WILD) count++;
    else break;
  }
  if (count < 3) return null;

  // 전부 와일드면 와일드 배당으로 쳐 준다 (더 높은 쪽)
  const allWild = faces.slice(0, count).every((f) => f === WILD);
  const face = allWild ? WILD : base;
  const pay = PAY_BY_FACE.get(face);
  if (!pay) return null;

  return {
    line: name,
    face,
    count,
    credits: pay[count - 3] * lineBet,
    cells: rows.slice(0, count).map((row, col) => `${col}-${row}`),
  };
}

function evaluate(grid: Grid, lineBet: number): SpinResult {
  const wins: Win[] = [];
  for (const { name, rows } of PAYLINES) {
    const faces = rows.map((row, col) => grid[col][row]);
    const win = evaluateLine(faces, lineBet, name, rows);
    if (win) wins.push(win);
  }

  // 스캐터는 어디에 있든 개수만 센다
  const scatters: string[] = [];
  grid.forEach((column, col) =>
    column.forEach((face, row) => {
      if (face === SCATTER) scatters.push(`${col}-${row}`);
    })
  );

  return {
    wins,
    credits: wins.reduce((a, w) => a + w.credits, 0),
    scatters,
    freeSpins: scatters.length >= 3 ? FREE_SPINS : 0,
  };
}

export default function SlotMachine({ onFinish }: GameProps) {
  const [grid, setGrid] = useState<Grid>(randomGrid);
  const [spinning, setSpinning] = useState<boolean[]>(Array(COLS).fill(false));
  const [credits, setCredits] = useState(START_CREDIT);
  const [betIndex, setBetIndex] = useState(0);
  const [free, setFree] = useState(0);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [over, setOver] = useState(false);
  const [showPaytable, setShowPaytable] = useState(false);
  const timers = useRef<number[]>([]);

  const lineBet = BETS[betIndex];
  const totalBet = lineBet * PAYLINES.length;
  const busy = spinning.some(Boolean);
  const onFree = free > 0;
  const canSpin = !busy && !over && (onFree || credits >= totalBet);

  useEffect(
    () => () => {
      timers.current.forEach((t) => window.clearInterval(t));
      timers.current.forEach((t) => window.clearTimeout(t));
    },
    []
  );

  const finish = (finalCredits: number) => {
    setOver(true);
    onFinish(finalCredits);
  };

  const spin = () => {
    if (!canSpin) return;

    // 프리스핀이면 베팅을 깎지 않는다
    const after = onFree ? credits : credits - totalBet;
    if (onFree) setFree((f) => f - 1);
    else setCredits(after);

    setResult(null);
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

      const stop = window.setTimeout(
        () => {
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
            const res = evaluate(final, lineBet);
            setResult(res);
            const paid = after + res.credits;
            setCredits(paid);
            if (res.freeSpins) setFree((f) => f + res.freeSpins);

            // 다음 판을 돌릴 수 없으면 여기서 끝.
            // free 는 이 판을 시작할 때의 값이므로, 이번에 쓴 한 번을 빼고 센다.
            const freeLeft = (onFree ? free - 1 : free) + res.freeSpins;
            if (freeLeft === 0 && paid < BETS[0] * PAYLINES.length) finish(paid);
          }
        },
        700 + col * 300
      );
      timers.current.push(stop);
    });
  };

  // 스캐터는 3개 이상 모여 프리스핀이 될 때만 빛낸다 (2개는 아무 의미가 없다)
  const lit = new Set([
    ...(result?.wins.flatMap((w) => w.cells) ?? []),
    ...(result?.freeSpins ? result.scatters : []),
  ]);
  const dim = result !== null && lit.size > 0;

  return (
    <div className="flex flex-col items-center gap-3 w-[440px]">
      {/* 크레딧 · 베팅 */}
      <div className="w-full grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-slate-900 px-3 py-2 text-center">
          <p className="text-[11px] font-bold text-slate-400">크레딧</p>
          <p className="text-2xl font-black text-amber-300 tabular-nums">{credits}</p>
        </div>
        <div className="rounded-xl bg-slate-900 px-3 py-2 text-center">
          <p className="text-[11px] font-bold text-slate-400">베팅 (5라인)</p>
          <p className="text-2xl font-black text-white tabular-nums">{totalBet}</p>
        </div>
        <div
          className={`rounded-xl px-3 py-2 text-center ${
            onFree ? 'bg-emerald-600' : 'bg-slate-900'
          }`}
        >
          <p className="text-[11px] font-bold text-slate-300">프리스핀</p>
          <p className="text-2xl font-black text-white tabular-nums">{free}</p>
        </div>
      </div>

      {/* 릴 */}
      <div className="w-full rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 p-4 shadow-inner">
        <p className="text-center text-xs font-black tracking-[0.3em] text-amber-300 mb-3">
          ★ LUCKY SLOT 5×3 ★
        </p>

        <div className="flex justify-center gap-1.5">
          {grid.map((column, col) => (
            <div key={col} className="flex flex-col gap-1.5">
              {column.map((face, row) => {
                const isLit = lit.has(`${col}-${row}`);
                const isWild = face === WILD && !spinning[col];
                return (
                  <div
                    key={row}
                    className={`relative w-[76px] h-[68px] rounded-lg grid place-items-center text-[38px] transition-all ${
                      spinning[col]
                        ? 'bg-white blur-[2px]'
                        : isWild
                          ? // 와일드는 한눈에 보이도록 따로 칠한다
                            'bg-violet-600 ring-2 ring-violet-300'
                          : isLit
                            ? 'bg-amber-200 scale-105 ring-2 ring-amber-400'
                            : 'bg-white'
                    } ${isLit && isWild ? 'scale-105' : ''} ${dim && !isLit ? 'opacity-40' : ''}`}
                  >
                    {isWild ? (
                      <span className="text-lg font-black tracking-wider text-white">WILD</span>
                    ) : (
                      face
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <p className="text-center mt-3 h-7 text-lg font-bold text-amber-200">
          {busy
            ? '두구두구…'
            : over
              ? `게임 끝 · 최종 ${credits} 크레딧`
              : result === null
                ? ' '
                : result.credits > 0
                  ? `+${result.credits} 크레딧!`
                  : result.freeSpins > 0
                    ? '스캐터 3개! 프리스핀 획득'
                    : '꽝… 다시 돌려보세요'}
        </p>
      </div>

      {/* 조작 */}
      {over ? (
        <p className="text-base font-bold text-slate-600 py-2">
          크레딧을 모두 쓰셨습니다 · 최종 {credits}점
        </p>
      ) : (
        <div className="w-full flex items-center gap-2">
          <div className="flex rounded-xl border border-slate-200 overflow-hidden">
            {BETS.map((b, i) => (
              <button
                key={b}
                onClick={() => setBetIndex(i)}
                disabled={busy || onFree}
                className={`px-3.5 py-3 text-base font-bold disabled:opacity-40 ${
                  i === betIndex ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 hover:bg-slate-50'
                }`}
              >
                {b}
              </button>
            ))}
          </div>

          <button
            onClick={spin}
            disabled={!canSpin}
            className="flex-1 bg-amber-400 disabled:bg-slate-200 disabled:text-slate-400 text-slate-900 text-lg font-black py-3 rounded-xl hover:bg-amber-300"
          >
            {busy ? '돌아가는 중…' : onFree ? `🎁 프리스핀 (${free})` : `🎰 돌리기 · ${totalBet}`}
          </button>

          <button
            onClick={() => finish(credits)}
            disabled={busy}
            className="px-4 py-3 rounded-xl border border-slate-200 text-base font-bold text-slate-500 hover:bg-slate-50 disabled:opacity-40"
          >
            그만
          </button>
        </div>
      )}

      {/* 당첨 라인 · 배당표 */}
      <div className="w-full min-h-[58px]">
        {result && (result.wins.length > 0 || result.freeSpins > 0) ? (
          <ul className="flex flex-wrap justify-center gap-2">
            {result.wins.map((w, i) => (
              <li
                key={i}
                className="text-sm font-bold bg-amber-50 text-amber-800 border border-amber-200 rounded-lg px-2.5 py-1.5"
              >
                {w.line} · {w.face === WILD ? 'WILD' : w.face}×{w.count}{' '}
                <span className="text-amber-600">+{w.credits}</span>
              </li>
            ))}
            {result.freeSpins > 0 && (
              <li className="text-sm font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg px-2.5 py-1.5">
                💎×{result.scatters.length} · 프리스핀 +{result.freeSpins}
              </li>
            )}
          </ul>
        ) : (
          <button
            onClick={() => setShowPaytable((v) => !v)}
            className="w-full text-sm text-slate-500 hover:text-slate-700 text-center leading-relaxed"
          >
            라인 5개에서 <b>왼쪽 릴부터</b> 3개 이상 같은 그림 ·{' '}
            <b className="text-violet-600">WILD</b> 는 아무 그림이나 대신하고 · 💎 스캐터 3개면
            프리스핀
            <span className="block mt-1 underline">{showPaytable ? '배당표 접기' : '배당표 보기'}</span>
          </button>
        )}
      </div>

      {showPaytable && (
        <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="py-1.5 font-bold">그림</th>
              <th className="py-1.5 font-bold">3개</th>
              <th className="py-1.5 font-bold">4개</th>
              <th className="py-1.5 font-bold">5개</th>
            </tr>
          </thead>
          <tbody className="text-center tabular-nums">
            {PAYTABLE.filter((s) => s.face !== SCATTER).map((s) => (
              <tr key={s.face} className="border-t border-slate-100">
                <td className="py-1.5 text-xl">
                  {s.face === WILD ? (
                    <span className="text-sm font-black text-violet-600">WILD</span>
                  ) : (
                    s.face
                  )}
                </td>
                {s.pay.map((p, i) => (
                  <td key={i} className="py-1.5 font-bold text-slate-700">
                    {p * lineBet}
                  </td>
                ))}
              </tr>
            ))}
            <tr className="border-t border-slate-100 bg-emerald-50/60">
              <td className="py-1.5 text-xl">💎</td>
              <td colSpan={3} className="py-1.5 font-bold text-emerald-700">
                어디에 있든 3개 이상 → 프리스핀 {FREE_SPINS}회
              </td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}
