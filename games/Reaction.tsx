'use client';

import { useEffect, useRef, useState } from 'react';
import { GameProps } from './types';

/** ⚡ 반응속도 — 초록으로 바뀌는 순간 클릭. 5라운드 평균이 빠를수록 고득점. */

const ROUNDS = 5;
/** 너무 일찍 눌렀을 때 기록되는 값(ms) */
const FALSE_START = 700;

type Phase = 'ready' | 'wait' | 'go' | 'between' | 'over';

export default function Reaction({ onFinish }: GameProps) {
  const [phase, setPhase] = useState<Phase>('ready');
  const [times, setTimes] = useState<number[]>([]);
  const [last, setLast] = useState<string>('');
  const goAt = useRef(0);
  const timer = useRef<number | null>(null);

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  const armRound = () => {
    setPhase('wait');
    setLast('');
    timer.current = window.setTimeout(() => {
      goAt.current = Date.now();
      setPhase('go');
    }, 1200 + Math.random() * 2600);
  };

  const record = (ms: number, label: string) => {
    const next = [...times, ms];
    setTimes(next);
    setLast(label);

    if (next.length >= ROUNDS) {
      const avg = next.reduce((a, b) => a + b, 0) / next.length;
      setPhase('over');
      onFinish(Math.max(0, Math.round(FALSE_START - avg)));
    } else {
      setPhase('between');
    }
  };

  const click = () => {
    if (phase === 'ready' || phase === 'between') {
      armRound();
      return;
    }
    if (phase === 'wait') {
      if (timer.current) window.clearTimeout(timer.current);
      record(FALSE_START, '너무 빨라요! 🚨');
      return;
    }
    if (phase === 'go') {
      const ms = Date.now() - goAt.current;
      record(ms, `${ms}ms`);
      return;
    }
    if (phase === 'over') {
      setTimes([]);
      setLast('');
      armRound();
    }
  };

  const avg = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;

  const bg =
    phase === 'go'
      ? 'bg-emerald-500'
      : phase === 'wait'
        ? 'bg-rose-500'
        : phase === 'over'
          ? 'bg-slate-800'
          : 'bg-indigo-500';

  const text =
    phase === 'ready'
      ? '클릭해서 시작'
      : phase === 'wait'
        ? '초록이 될 때까지 기다리세요…'
        : phase === 'go'
          ? '지금 클릭!'
          : phase === 'between'
            ? `${last} · 클릭해서 다음 라운드`
            : `평균 ${avg}ms · 클릭해서 다시하기`;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-2 text-base font-bold text-slate-700">
        라운드 {Math.min(times.length + (phase === 'over' ? 0 : 1), ROUNDS)}/{ROUNDS}
        <span className="ml-2 flex gap-1">
          {Array.from({ length: ROUNDS }).map((_, i) => (
            <span
              key={i}
              className={`w-2.5 h-2.5 rounded-full ${
                times[i] === undefined
                  ? 'bg-slate-200'
                  : times[i] >= FALSE_START
                    ? 'bg-rose-400'
                    : 'bg-emerald-400'
              }`}
            />
          ))}
        </span>
      </div>

      <button
        onClick={click}
        className={`w-[440px] h-[380px] rounded-2xl text-white font-black text-3xl leading-relaxed transition-colors ${bg}`}
      >
        {text}
      </button>

      <div className="flex flex-wrap justify-center gap-2 text-sm w-[440px]">
        {times.map((t, i) => (
          <span
            key={i}
            className={`px-2 py-1 rounded-lg font-bold ${
              t >= FALSE_START ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'
            }`}
          >
            {t >= FALSE_START ? '실패' : `${t}ms`}
          </span>
        ))}
      </div>
    </div>
  );
}
