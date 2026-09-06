import { useCallback, useEffect, useRef, useState } from 'react';
import { GameProps } from './types';

/** 🐍 스네이크 — 방향키(또는 화면 버튼)로 사과를 먹고 길어진다. */

const CELL = 20;
const COLS = 16;
const ROWS = 16;
const W = COLS * CELL;
const H = ROWS * CELL;

type Dir = 'up' | 'down' | 'left' | 'right';
const DELTA: Record<Dir, [number, number]> = {
  up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0],
};
const OPPOSITE: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' };

interface Cell { x: number; y: number }

export default function Snake({ onFinish }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const snake = useRef<Cell[]>([]);
  const dir = useRef<Dir>('right');
  const queued = useRef<Dir[]>([]);
  const food = useRef<Cell>({ x: 10, y: 8 });
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState<'ready' | 'play' | 'over'>('ready');
  const scoreRef = useRef(0);

  const placeFood = () => {
    let spot: Cell;
    do {
      spot = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    } while (snake.current.some((s) => s.x === spot.x && s.y === spot.y));
    food.current = spot;
  };

  const draw = useCallback(() => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, W, H);

    // 격자
    ctx.strokeStyle = 'rgba(255,255,255,.04)';
    for (let i = 1; i < COLS; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL, 0);
      ctx.lineTo(i * CELL, H);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL);
      ctx.lineTo(W, i * CELL);
      ctx.stroke();
    }

    ctx.font = `${CELL - 3}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🍎', food.current.x * CELL + CELL / 2, food.current.y * CELL + CELL / 2 + 1);

    snake.current.forEach((s, i) => {
      ctx.fillStyle = i === 0 ? '#4ade80' : `hsl(142, 60%, ${52 - Math.min(i * 1.5, 22)}%)`;
      ctx.beginPath();
      ctx.roundRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2, 5);
      ctx.fill();
    });
  }, []);

  const start = () => {
    snake.current = [
      { x: 6, y: 8 },
      { x: 5, y: 8 },
      { x: 4, y: 8 },
    ];
    dir.current = 'right';
    queued.current = [];
    scoreRef.current = 0;
    setScore(0);
    placeFood();
    setPhase('play');
  };

  const turn = (d: Dir) => {
    const lastDir = queued.current[queued.current.length - 1] ?? dir.current;
    if (d === lastDir || d === OPPOSITE[lastDir]) return;
    if (queued.current.length < 2) queued.current.push(d);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Dir> = {
        ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
        w: 'up', s: 'down', a: 'left', d: 'right',
      };
      const d = map[e.key];
      if (!d) return;
      e.preventDefault();
      turn(d);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    draw();
  }, [draw, phase]);

  useEffect(() => {
    if (phase !== 'play') return;

    const step = () => {
      const next = queued.current.shift();
      if (next) dir.current = next;

      const [dx, dy] = DELTA[dir.current];
      const head = snake.current[0];
      const nh: Cell = { x: head.x + dx, y: head.y + dy };

      const hitWall = nh.x < 0 || nh.y < 0 || nh.x >= COLS || nh.y >= ROWS;
      const hitSelf = snake.current.some((s, i) => i < snake.current.length - 1 && s.x === nh.x && s.y === nh.y);
      if (hitWall || hitSelf) {
        setPhase('over');
        onFinish(scoreRef.current);
        return;
      }

      snake.current.unshift(nh);
      if (nh.x === food.current.x && nh.y === food.current.y) {
        scoreRef.current += 10;
        setScore(scoreRef.current);
        placeFood();
      } else {
        snake.current.pop();
      }
      draw();
    };

    // 길어질수록 조금씩 빨라진다
    const speed = Math.max(80, 150 - Math.floor(scoreRef.current / 30) * 10);
    const timer = setInterval(step, speed);
    return () => clearInterval(timer);
  }, [phase, score, draw, onFinish]);

  const DPad = ({ d, label }: { d: Dir; label: string }) => (
    <button
      onClick={() => turn(d)}
      className="w-12 h-12 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-600"
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm font-bold text-slate-600">
        점수 <span className="text-emerald-600 text-lg">{score}</span>
      </p>

      <div className="relative rounded-2xl overflow-hidden" style={{ width: W, height: H }}>
        <canvas ref={canvasRef} width={W} height={H} />
        {phase !== 'play' && (
          <div className="absolute inset-0 grid place-items-center bg-slate-900/80 text-center">
            <div>
              {phase === 'over' && <p className="text-2xl font-black text-white mb-1">🐍 {score}점</p>}
              <p className="text-xs text-slate-300 mb-3">방향키 · WASD · 아래 버튼으로 조작</p>
              <button
                onClick={start}
                className="bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-emerald-400"
              >
                {phase === 'over' ? '다시하기' : '시작하기'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-1.5">
        <DPad d="up" label="↑" />
        <div className="flex gap-1.5">
          <DPad d="left" label="←" />
          <DPad d="down" label="↓" />
          <DPad d="right" label="→" />
        </div>
      </div>
    </div>
  );
}
