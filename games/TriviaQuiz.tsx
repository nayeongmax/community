'use client';

import { useEffect, useRef, useState } from 'react';
import { GameProps } from './types';
import { TRIVIA, TriviaQuestion } from './quizData';

/** 🧠 일반상식 퀴즈 — 4지선다 10문제. 빨리 맞힐수록 점수가 높다. */

const ROUNDS = 10;
/** 문제당 제한 시간(초) */
const LIMIT = 15;
/** 정답 기본 점수 (여기에 남은 시간이 보너스로 붙는다) */
const BASE = 10;

function pickQuestions(): TriviaQuestion[] {
  const pool = [...TRIVIA];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, ROUNDS);
}

export default function TriviaQuiz({ onFinish }: GameProps) {
  const [phase, setPhase] = useState<'ready' | 'play' | 'over'>('ready');
  const [questions, setQuestions] = useState<TriviaQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [timeLeft, setTimeLeft] = useState(LIMIT);
  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const idxRef = useRef(0);
  const advanceTimer = useRef<number | null>(null);

  useEffect(() => () => { if (advanceTimer.current) window.clearTimeout(advanceTimer.current); }, []);

  const start = () => {
    scoreRef.current = 0;
    correctRef.current = 0;
    idxRef.current = 0;
    setQuestions(pickQuestions());
    setIdx(0);
    setPicked(null);
    setScore(0);
    setCorrect(0);
    setTimeLeft(LIMIT);
    setPhase('play');
  };

  const goNext = () => {
    const next = idxRef.current + 1;
    if (next >= ROUNDS) {
      setPhase('over');
      onFinish(scoreRef.current);
      return;
    }
    idxRef.current = next;
    setIdx(next);
    setPicked(null);
    setTimeLeft(LIMIT);
  };

  /** 보기를 고르거나 시간이 다 됐을 때 (-1 은 시간 초과) */
  const answer = (choice: number) => {
    if (picked !== null || phase !== 'play') return;
    setPicked(choice);

    if (choice === questions[idx].answer) {
      const gained = BASE + timeLeft;
      scoreRef.current += gained;
      correctRef.current += 1;
      setScore(scoreRef.current);
      setCorrect(correctRef.current);
    }
    advanceTimer.current = window.setTimeout(goNext, 1500);
  };

  // 문제당 제한 시간 — 1초씩 줄이다가 0 이 되면 시간 초과 처리
  useEffect(() => {
    if (phase !== 'play' || picked !== null) return;
    if (timeLeft <= 0) {
      answer(-1);
      return;
    }
    const t = window.setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [phase, picked, idx, timeLeft]);

  if (phase === 'ready' || questions.length === 0) {
    return (
      <div className="w-[320px] py-10 text-center">
        <p className="text-5xl mb-3">🧠</p>
        <p className="font-black text-slate-800 text-lg">일반상식 퀴즈</p>
        <p className="text-sm text-slate-500 mt-1 mb-5">
          4지선다 {ROUNDS}문제 · 문제당 {LIMIT}초
          <br />
          빨리 맞힐수록 점수가 올라갑니다
        </p>
        <button
          onClick={start}
          className="bg-indigo-600 text-white font-bold px-7 py-3 rounded-xl hover:bg-indigo-700"
        >
          시작하기
        </button>
      </div>
    );
  }

  if (phase === 'over') {
    return (
      <div className="w-[320px] py-10 text-center">
        <p className="text-5xl mb-3">{correct >= 8 ? '🏆' : correct >= 5 ? '👍' : '📚'}</p>
        <p className="text-2xl font-black text-slate-800">{score}점</p>
        <p className="text-sm text-slate-500 mt-1 mb-5">
          {ROUNDS}문제 중 <span className="font-bold text-indigo-600">{correct}문제</span> 정답
        </p>
        <button
          onClick={start}
          className="bg-indigo-600 text-white font-bold px-7 py-3 rounded-xl hover:bg-indigo-700"
        >
          다시하기
        </button>
      </div>
    );
  }

  const q = questions[idx];
  const revealed = picked !== null;

  return (
    <div className="w-[320px]">
      <div className="flex items-center justify-between text-sm font-bold text-slate-600 mb-1.5">
        <span>
          {idx + 1} / {ROUNDS}
        </span>
        <span className="text-indigo-600">{score}점</span>
      </div>

      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden mb-1">
        <div
          className="h-full bg-indigo-500 transition-all duration-300"
          style={{ width: `${((idx + (revealed ? 1 : 0)) / ROUNDS) * 100}%` }}
        />
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden mb-3">
        <div
          className={`h-full transition-all duration-1000 ease-linear ${
            timeLeft <= 5 ? 'bg-rose-500' : 'bg-emerald-400'
          }`}
          style={{ width: `${(timeLeft / LIMIT) * 100}%` }}
        />
      </div>

      <p className="font-bold text-slate-800 leading-relaxed min-h-[56px] mb-3">{q.q}</p>

      <div className="space-y-2">
        {q.choices.map((c, i) => {
          const isAnswer = i === q.answer;
          const isPicked = i === picked;
          const style = !revealed
            ? 'bg-white border-slate-200 hover:border-indigo-400 hover:bg-indigo-50'
            : isAnswer
              ? 'bg-emerald-50 border-emerald-400 text-emerald-700'
              : isPicked
                ? 'bg-rose-50 border-rose-400 text-rose-600'
                : 'bg-white border-slate-100 text-slate-400';
          return (
            <button
              key={i}
              onClick={() => answer(i)}
              disabled={revealed}
              className={`w-full text-left border rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors ${style}`}
            >
              <span className="text-slate-400 mr-2">{['①', '②', '③', '④'][i]}</span>
              {c}
              {revealed && isAnswer && <span className="float-right">✓</span>}
              {revealed && isPicked && !isAnswer && <span className="float-right">✕</span>}
            </button>
          );
        })}
      </div>

      <p className="h-6 mt-2 text-center text-sm font-bold">
        {revealed &&
          (picked === q.answer ? (
            <span className="text-emerald-600">정답! +{BASE + timeLeft}점</span>
          ) : picked === -1 ? (
            <span className="text-slate-400">시간 초과…</span>
          ) : (
            <span className="text-rose-500">아쉽네요</span>
          ))}
      </p>
    </div>
  );
}
