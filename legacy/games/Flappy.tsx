import { useEffect, useRef, useState } from 'react';
import { GameProps } from './types';

/** 🐤 파이프 통과 — 클릭(또는 스페이스)으로 날갯짓해서 파이프 사이를 지나간다. */

const W = 320;
const H = 400;
const BIRD_X = 78;
const BIRD_R = 11;
const GRAVITY = 0.42;
const FLAP = -6.6;
const PIPE_W = 48;
const PIPE_GAP = 120;
const PIPE_SPEED = 2.1;
/** 파이프 생성 간격(프레임) */
const PIPE_EVERY = 95;

interface Pipe { x: number; gapY: number; passed: boolean }

export default function Flappy({ onFinish }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bird = useRef({ y: H / 2, vy: 0 });
  const pipes = useRef<Pipe[]>([]);
  const frame = useRef(0);
  const scoreRef = useRef(0);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<'ready' | 'play' | 'over'>('ready');

  const start = () => {
    bird.current = { y: H / 2, vy: 0 };
    pipes.current = [];
    frame.current = 0;
    scoreRef.current = 0;
    setScore(0);
    setPhase('play');
  };

  const flap = () => {
    if (phase === 'play') bird.current.vy = FLAP;
    else start();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        flap();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let alive = true;

    const draw = () => {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#7dd3fc');
      g.addColorStop(1, '#e0f2fe');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = '#22c55e';
      pipes.current.forEach((p) => {
        ctx.fillRect(p.x, 0, PIPE_W, p.gapY - PIPE_GAP / 2);
        ctx.fillRect(p.x, p.gapY + PIPE_GAP / 2, PIPE_W, H - (p.gapY + PIPE_GAP / 2));
      });

      ctx.fillStyle = '#a16207';
      ctx.fillRect(0, H - 14, W, 14);

      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🐤', BIRD_X, bird.current.y);
    };

    const step = () => {
      if (!alive) return;

      if (phase === 'play') {
        frame.current++;
        const b = bird.current;
        b.vy += GRAVITY;
        b.y += b.vy;

        if (frame.current % PIPE_EVERY === 0) {
          pipes.current.push({
            x: W,
            gapY: 90 + Math.random() * (H - 220),
            passed: false,
          });
        }

        pipes.current.forEach((p) => (p.x -= PIPE_SPEED));
        pipes.current = pipes.current.filter((p) => p.x + PIPE_W > -10);

        let dead = b.y + BIRD_R > H - 14 || b.y - BIRD_R < 0;
        for (const p of pipes.current) {
          const inX = BIRD_X + BIRD_R > p.x && BIRD_X - BIRD_R < p.x + PIPE_W;
          if (inX && (b.y - BIRD_R < p.gapY - PIPE_GAP / 2 || b.y + BIRD_R > p.gapY + PIPE_GAP / 2)) {
            dead = true;
          }
          if (!p.passed && p.x + PIPE_W < BIRD_X - BIRD_R) {
            p.passed = true;
            scoreRef.current += 1;
            setScore(scoreRef.current);
          }
        }

        if (dead) {
          draw();
          alive = false;
          setPhase('over');
          onFinish(scoreRef.current);
          return;
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

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm font-bold text-slate-600">
        통과 <span className="text-sky-600 text-lg">{score}</span>개
      </p>

      <div
        className="relative rounded-2xl overflow-hidden cursor-pointer"
        style={{ width: W, height: H }}
        onPointerDown={flap}
      >
        <canvas ref={canvasRef} width={W} height={H} style={{ touchAction: 'none' }} />
        {phase !== 'play' && (
          <div className="absolute inset-0 grid place-items-center bg-white/70 backdrop-blur-sm text-center">
            <div>
              {phase === 'over' && (
                <p className="text-2xl font-black text-slate-800 mb-1">🐤 {score}개 통과</p>
              )}
              <p className="text-xs text-slate-500 mb-3">화면을 클릭하거나 스페이스로 날갯짓</p>
              <span className="inline-block bg-sky-500 text-white font-bold px-6 py-2.5 rounded-xl">
                {phase === 'over' ? '다시하기' : '시작하기'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
