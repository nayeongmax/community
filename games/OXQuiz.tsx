'use client';

import { useEffect, useRef, useState } from 'react';
import { GameProps } from './types';
import { OX_QUESTIONS, OXQuestion } from './quizData';

/** ⭕ 카지노 OX 퀴즈 — 카지노 룰·확률·문화를 O/X 로 맞힌다. 연속 정답이면 콤보 보너스. */

const ROUNDS = 10;
/** 정답 기본 점수 */
const BASE = 10;
/** 3연속부터 붙는 콤보 보너스 */
const COMBO_BONUS = 5;

/** 주제 배지 색 */
const TOPIC_STYLE: Record<OXQuestion['topic'], string> = {
  '룰': 'bg-rose-100 text-rose-600',
  '확률·배당': 'bg-amber-100 text-amber-700',
  '상식·역사': 'bg-violet-100 text-violet-600',
};

function pickQuestions(): OXQuestion[] {
  const pool = [...OX_QUESTIONS];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, ROUNDS);
}

export default function OXQuiz({ onFinish }: GameProps) {
  const [phase, setPhase] = useState<'ready' | 'play' | 'over'>('ready');
  const [questions, setQuestions] = useState<OXQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [combo, setCombo] = useState(0);
  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const comboRef = useRef(0);

  const start = () => {
    scoreRef.current = 0;
    correctRef.current = 0;
    comboRef.current = 0;
    setQuestions(pickQuestions());
    setIdx(0);
    setPicked(null);
    setScore(0);
    setCorrect(0);
    setCombo(0);
    setPhase('play');
  };

  const answer = (choice: boolean) => {
    if (picked !== null) return;
    setPicked(choice);

    if (choice === questions[idx].answer) {
      comboRef.current += 1;
      correctRef.current += 1;
      scoreRef.current += BASE + (comboRef.current >= 3 ? COMBO_BONUS : 0);
      setCorrect(correctRef.current);
    } else {
      comboRef.current = 0;
    }
    setCombo(comboRef.current);
    setScore(scoreRef.current);
  };

  const next = () => {
    if (idx + 1 >= ROUNDS) {
      setPhase('over');
      onFinish(scoreRef.current);
      return;
    }
    setIdx(idx + 1);
    setPicked(null);
  };

  // 정답을 확인한 뒤 스페이스/엔터로도 넘어갈 수 있게
  useEffect(() => {
    if (phase !== 'play' || picked === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        next();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (phase === 'ready' || questions.length === 0) {
    return (
      <div className="w-[320px] py-10 text-center">
        <p className="text-5xl mb-3">🎲</p>
        <p className="font-black text-slate-800 text-lg">카지노 OX 퀴즈</p>
        <p className="text-sm text-slate-500 mt-1 mb-5">
          카지노 룰 · 확률 · 상식 {ROUNDS}문제
          <br />
          3연속 정답부터 콤보 보너스 +{COMBO_BONUS}점
        </p>
        <button
          onClick={start}
          className="bg-emerald-600 text-white font-bold px-7 py-3 rounded-xl hover:bg-emerald-700"
        >
          시작하기
        </button>
      </div>
    );
  }

  if (phase === 'over') {
    return (
      <div className="w-[320px] py-10 text-center">
        <p className="text-5xl mb-3">{correct >= 8 ? '🃏' : correct >= 5 ? '👍' : '📖'}</p>
        <p className="text-2xl font-black text-slate-800">{score}점</p>
        <p className="text-sm text-slate-500 mt-1 mb-5">
          {ROUNDS}문제 중 <span className="font-bold text-emerald-600">{correct}문제</span> 정답
        </p>
        <button
          onClick={start}
          className="bg-emerald-600 text-white font-bold px-7 py-3 rounded-xl hover:bg-emerald-700"
        >
          다시하기
        </button>
      </div>
    );
  }

  const q = questions[idx];
  const revealed = picked !== null;
  const isCorrect = picked === q.answer;

  return (
    <div className="w-[320px]">
      <div className="flex items-center justify-between text-sm font-bold text-slate-600 mb-1.5">
        <span>
          {idx + 1} / {ROUNDS}
        </span>
        <span className="flex items-center gap-2">
          {combo >= 3 && <span className="text-amber-500">🔥 {combo}연속</span>}
          <span className="text-emerald-600">{score}점</span>
        </span>
      </div>

      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden mb-3">
        <div
          className="h-full bg-emerald-500 transition-all duration-300"
          style={{ width: `${((idx + (revealed ? 1 : 0)) / ROUNDS) * 100}%` }}
        />
      </div>

      <span
        className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full mb-2 ${TOPIC_STYLE[q.topic]}`}
      >
        {q.topic}
      </span>

      <p className="font-bold text-slate-800 leading-relaxed min-h-[72px]">{q.q}</p>

      <div className="grid grid-cols-2 gap-3 mt-1">
        {([true, false] as const).map((v) => {
          const label = v ? 'O' : 'X';
          const base = 'h-24 rounded-2xl text-4xl font-black border-2 transition-colors';
          let style: string;
          if (!revealed) {
            style = v
              ? 'bg-white border-sky-300 text-sky-500 hover:bg-sky-50'
              : 'bg-white border-rose-300 text-rose-500 hover:bg-rose-50';
          } else if (v === q.answer) {
            style = 'bg-emerald-500 border-emerald-500 text-white';
          } else if (v === picked) {
            style = 'bg-rose-100 border-rose-300 text-rose-400';
          } else {
            style = 'bg-slate-50 border-slate-100 text-slate-300';
          }
          return (
            <button key={label} onClick={() => answer(v)} disabled={revealed} className={`${base} ${style}`}>
              {label}
            </button>
          );
        })}
      </div>

      {revealed && (
        <div
          className={`mt-3 rounded-xl p-3 border ${
            isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
          }`}
        >
          <p className={`text-sm font-black ${isCorrect ? 'text-emerald-700' : 'text-rose-600'}`}>
            {isCorrect ? '정답!' : '오답'} · 답은 {q.answer ? 'O' : 'X'}
            {isCorrect && comboRef.current >= 3 && (
              <span className="ml-1 text-amber-500">콤보 +{COMBO_BONUS}점</span>
            )}
          </p>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">{q.note}</p>
          <button
            onClick={next}
            className="mt-2.5 w-full bg-slate-800 text-white font-bold text-sm py-2 rounded-lg hover:bg-slate-700"
          >
            {idx + 1 >= ROUNDS ? '결과 보기' : '다음 문제 →'}
          </button>
        </div>
      )}
    </div>
  );
}
