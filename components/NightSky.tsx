'use client';

import { useEffect, useRef } from 'react';

/**
 * 게임 랜드 배경 — 별이 흐르는 밤하늘 + 마우스를 따라다니는 빛.
 *
 * - 별은 캔버스에 그린다 (DOM 노드 수백 개를 만들지 않기 위해)
 * - 포인터 빛은 ref 로 transform 만 바꾼다 (리렌더 없음)
 * - prefers-reduced-motion 이면 반짝임과 흐름을 멈추고 한 번만 그린다
 */

interface Star {
  x: number;
  y: number;
  r: number;
  /** 깜빡임 위상 */
  phase: number;
  /** 시차(뒤쪽 별일수록 작다) */
  depth: number;
}

export default function NightSky() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let stars: Star[] = [];
    let w = 0;
    let h = 0;
    const pointer = { x: -1000, y: -1000 };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.round((w * h) / 9000);
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.3 + 0.3,
        phase: Math.random() * Math.PI * 2,
        depth: Math.random() * 0.8 + 0.2,
      }));
    };

    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        // 포인터 쪽으로 살짝 밀리는 시차 효과
        const px = (pointer.x - w / 2) * 0.012 * s.depth;
        const py = (pointer.y - h / 2) * 0.012 * s.depth;
        const twinkle = reduced ? 0.7 : 0.55 + Math.sin(t * 0.03 + s.phase) * 0.35;

        // 포인터 근처 별은 더 밝게
        const dist = Math.hypot(s.x + px - pointer.x, s.y + py - pointer.y);
        const near = dist < 160 ? (1 - dist / 160) * 0.7 : 0;

        ctx.globalAlpha = Math.min(1, twinkle * (0.35 + s.depth * 0.65) + near);
        ctx.fillStyle = near > 0.25 ? '#ffe9b0' : '#dfe4ff';
        ctx.beginPath();
        ctx.arc(s.x + px, s.y + py, s.r + near * 0.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    let raf = 0;
    const loop = () => {
      t += 1;
      draw();
      raf = requestAnimationFrame(loop);
    };

    const onPointer = (e: PointerEvent) => {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      if (glowRef.current) {
        glowRef.current.style.transform = `translate3d(${e.clientX - 160}px, ${e.clientY - 160}px, 0)`;
        glowRef.current.style.opacity = '1';
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${e.clientX - 13}px, ${e.clientY - 13}px, 0)`;
        ringRef.current.style.opacity = '1';
      }
    };

    const onLeave = () => {
      if (glowRef.current) glowRef.current.style.opacity = '0';
      if (ringRef.current) ringRef.current.style.opacity = '0';
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', onPointer);
    document.addEventListener('pointerleave', onLeave);

    if (reduced) draw();
    else loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* 밤하늘 바탕 */}
      <div className="absolute inset-0 bg-[#080a1c]" />
      {/* 보랏빛 성운 */}
      <div
        className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[700px] opacity-70"
        style={{
          background: 'radial-gradient(closest-side, rgba(109,64,214,.55), rgba(109,64,214,0))',
        }}
      />
      <div
        className="absolute top-1/3 -left-40 w-[620px] h-[620px] opacity-60"
        style={{
          background: 'radial-gradient(closest-side, rgba(29,78,216,.45), rgba(29,78,216,0))',
        }}
      />
      <div
        className="absolute bottom-0 right-0 w-[700px] h-[560px] opacity-50"
        style={{
          background: 'radial-gradient(closest-side, rgba(180,120,40,.35), rgba(180,120,40,0))',
        }}
      />

      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* 마우스를 따라다니는 빛무리 */}
      <div
        ref={glowRef}
        className="absolute top-0 left-0 w-[320px] h-[320px] opacity-0 transition-opacity duration-500 will-change-transform"
        style={{
          background:
            'radial-gradient(closest-side, rgba(245,199,101,.20), rgba(139,92,246,.12) 45%, rgba(0,0,0,0))',
        }}
      />
      {/* 포인터를 감싸는 얇은 고리 */}
      <div
        ref={ringRef}
        className="absolute top-0 left-0 w-[26px] h-[26px] rounded-full opacity-0 transition-opacity duration-300 will-change-transform"
        style={{ border: '1px solid rgba(245,199,101,.55)', boxShadow: '0 0 12px rgba(245,199,101,.35)' }}
      />
    </div>
  );
}
