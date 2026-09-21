'use client';

import { useEffect, useRef, useState } from 'react';
import { GameProps } from './types';

/** 🧱 브레이크아웃 — 마우스로 패들을 움직여 벽돌을 모두 깬다. */

const W = 440;
const H = 550;
const PADDLE_W = 92;
const PADDLE_H = 14;
const BALL_R = 8;
const COLS = 6;
const ROWS = 5;
const BRICK_W = 66;
const BRICK_H = 22;
const GAP = 6;
const OFFSET_X = 7;
const OFFSET_Y = 62;
const ROW_COLORS = ['#f43f5e', '#f97316', '#eab308', '#22c55e', '#3b82f6'];

export default function Breakout({ onFinish }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const paddleX = useRef(W / 2);
  const ball = useRef({ x: W / 2, y: 412, vx: 3.3, vy: -4.7 });
  const bricks = useRef<boolean[]>([]);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [phase, setPhase] = useState<'ready' | 'play' | 'over'>('ready');

  const resetBall = () => {
    ball.current = { x: W / 2, y: 300, vx: Math.random() < 0.5 ? -2.4 : 2.4, vy: -3.4 };
    paddleX.current = W / 2;
  };

  const start = () => {
    bricks.current = Array(COLS * ROWS).fill(true);
    scoreRef.current = 0;
    livesRef.current = 3;
    setScore(0);
    setLives(3);
    resetBall();
    setPhase('play');
  };

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let alive = true;

    const finish = (bonus = 0) => {
      alive = false;
      const total = scoreRef.current + bonus;
      scoreRef.current = total;
      setScore(total);
      setPhase('over');
      onFinish(total);
    };

    const draw = () => {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, W, H);

      bricks.current.forEach((live, i) => {
        if (!live) return;
        const row = Math.floor(i / COLS);
        const col = i % COLS;
        ctx.fillStyle = ROW_COLORS[row];
        ctx.beginPath();
        ctx.roundRect(
          OFFSET_X + col * (BRICK_W + GAP),
          OFFSET_Y + row * (BRICK_H + GAP),
          BRICK_W,
          BRICK_H,
          4
        );
        ctx.fill();
      });

      ctx.fillStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.roundRect(paddleX.current - PADDLE_W / 2, H - 24, PADDLE_W, PADDLE_H, 5);
      ctx.fill();

      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(ball.current.x, ball.current.y, BALL_R, 0, Math.PI * 2);
      ctx.fill();
    };

    const step = () => {
      if (!alive) return;

      if (phase === 'play') {
        const b = ball.current;
        b.x += b.vx;
        b.y += b.vy;

        if (b.x - BALL_R < 0) { b.x = BALL_R; b.vx *= -1; }
        if (b.x + BALL_R > W) { b.x = W - BALL_R; b.vx *= -1; }
        if (b.y - BALL_R < 0) { b.y = BALL_R; b.vy *= -1; }

        // 패들 충돌 — 맞은 위치에 따라 반사각이 달라진다
        const py = H - 24;
        if (
          b.vy > 0 &&
          b.y + BALL_R >= py &&
          b.y + BALL_R <= py + PADDLE_H + 6 &&
          b.x >= paddleX.current - PADDLE_W / 2 - BALL_R &&
          b.x <= paddleX.current + PADDLE_W / 2 + BALL_R
        ) {
          const hit = (b.x - paddleX.current) / (PADDLE_W / 2);
          const speed = Math.min(6.2, Math.hypot(b.vx, b.vy) + 0.08);
          const angle = hit * 1.05;
          b.vx = Math.sin(angle) * speed;
          b.vy = -Math.abs(Math.cos(angle) * speed);
          b.y = py - BALL_R;
        }

        // 벽돌 충돌
        for (let i = 0; i < bricks.current.length; i++) {
          if (!bricks.current[i]) continue;
          const row = Math.floor(i / COLS);
          const col = i % COLS;
          const bx = OFFSET_X + col * (BRICK_W + GAP);
          const by = OFFSET_Y + row * (BRICK_H + GAP);
          if (b.x + BALL_R > bx && b.x - BALL_R < bx + BRICK_W && b.y + BALL_R > by && b.y - BALL_R < by + BRICK_H) {
            bricks.current[i] = false;
            b.vy *= -1;
            scoreRef.current += 10;
            setScore(scoreRef.current);
            break;
          }
        }

        if (bricks.current.every((x) => !x)) {
          draw();
          finish(100);
          return;
        }

        // 바닥으로 떨어짐
        if (b.y - BALL_R > H) {
          livesRef.current -= 1;
          setLives(livesRef.current);
          if (livesRef.current <= 0) {
            finish();
            return;
          }
          resetBall();
        }
      }

      draw();
      raf = requestAnimationFrame(step);
    };

    step();
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, [phase, onFinish]);

  const movePaddle = (clientX: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = clientX - rect.left;
    paddleX.current = Math.max(PADDLE_W / 2, Math.min(W - PADDLE_W / 2, x));
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center justify-between w-[440px] text-base font-bold text-slate-700">
        <span>점수 <span className="text-amber-500 text-2xl">{score}</span></span>
        <span>{'❤️'.repeat(Math.max(0, lives))}</span>
      </div>

      <div className="relative rounded-2xl overflow-hidden" style={{ width: W, height: H }}>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="cursor-none"
          style={{ touchAction: 'none' }}
          onPointerMove={(e) => movePaddle(e.clientX)}
        />
        {phase !== 'play' && (
          <div className="absolute inset-0 grid place-items-center bg-slate-900/80 text-center">
            <div>
              {phase === 'over' && <p className="text-4xl font-black text-white mb-2">🧱 {score}점</p>}
              <p className="text-base text-slate-200 mb-4">마우스를 좌우로 움직여 공을 받으세요</p>
              <button
                onClick={start}
                className="bg-amber-400 text-slate-900 text-lg font-bold px-8 py-3 rounded-xl hover:bg-amber-300"
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
