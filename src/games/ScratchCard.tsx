import { useCallback, useEffect, useRef, useState } from 'react';
import { GameProps } from './types';

/** 🎟 긁는 복권 — 은박을 마우스로 긁어서 당첨금을 확인한다. */

const W = 280;
const H = 160;
/** 이만큼 긁으면 자동으로 전체 공개 */
const REVEAL_RATIO = 0.45;
/** [당첨 점수, 가중치] */
const PRIZES: [number, number][] = [
  [0, 25],
  [10, 25],
  [20, 20],
  [30, 15],
  [50, 10],
  [100, 5],
];

function drawPrize(): number {
  const total = PRIZES.reduce((a, [, w]) => a + w, 0);
  let r = Math.random() * total;
  for (const [value, weight] of PRIZES) {
    r -= weight;
    if (r <= 0) return value;
  }
  return 0;
}

export default function ScratchCard({ onFinish }: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const strokes = useRef(0);
  const [prize, setPrize] = useState(drawPrize);
  const [revealed, setRevealed] = useState(false);

  const coat = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.globalCompositeOperation = 'source-over';
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, '#94a3b8');
    g.addColorStop(0.5, '#cbd5e1');
    g.addColorStop(1, '#94a3b8');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // 은박 느낌의 사선 무늬
    ctx.strokeStyle = 'rgba(255,255,255,.35)';
    ctx.lineWidth = 6;
    for (let x = -H; x < W; x += 18) {
      ctx.beginPath();
      ctx.moveTo(x, H);
      ctx.lineTo(x + H, 0);
      ctx.stroke();
    }

    ctx.fillStyle = '#475569';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🪙 여기를 긁어보세요 🪙', W / 2, H / 2 + 5);
  }, []);

  // 카드가 보이는 동안(=아직 안 긁은 동안) 은박을 다시 씌운다
  useEffect(() => {
    if (!revealed) coat();
  }, [revealed, prize, coat]);

  /** 긁어낸 비율을 샘플링해서 계산 */
  const clearedRatio = (ctx: CanvasRenderingContext2D): number => {
    const { data } = ctx.getImageData(0, 0, W, H);
    let clear = 0;
    let total = 0;
    for (let i = 3; i < data.length; i += 4 * 16) {
      total++;
      if (data[i] < 40) clear++;
    }
    return total ? clear / total : 0;
  };

  const finishCard = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, W, H);
    setRevealed(true);
    onFinish(prize);
  };

  const scratch = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (revealed || !drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 17, 0, Math.PI * 2);
    ctx.fill();

    if (++strokes.current % 12 === 0 && clearedRatio(ctx) > REVEAL_RATIO) finishCard();
  };

  const again = () => {
    setPrize(drawPrize());
    setRevealed(false);
    strokes.current = 0;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="relative rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-amber-100 to-amber-50 grid place-items-center"
        style={{ width: W, height: H }}
      >
        <div className="text-center pointer-events-none">
          <p className="text-xs font-bold text-amber-700 tracking-widest">LUCKY TICKET</p>
          <p className={`text-4xl font-black ${prize > 0 ? 'text-amber-600' : 'text-slate-400'}`}>
            {prize > 0 ? `+${prize}점` : '꽝'}
          </p>
        </div>
        {!revealed && (
          <canvas
            ref={canvasRef}
            width={W}
            height={H}
            className="absolute inset-0 cursor-crosshair"
            style={{ touchAction: 'none' }}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              drawing.current = true;
              scratch(e);
            }}
            onPointerMove={scratch}
            onPointerUp={() => (drawing.current = false)}
            onPointerLeave={() => (drawing.current = false)}
          />
        )}
      </div>

      {revealed ? (
        <button
          onClick={again}
          className="bg-amber-500 text-white font-bold px-6 py-2.5 rounded-xl hover:bg-amber-600"
        >
          새 복권 긁기
        </button>
      ) : (
        <p className="text-xs text-slate-400">절반쯤 긁으면 자동으로 공개됩니다</p>
      )}
    </div>
  );
}
