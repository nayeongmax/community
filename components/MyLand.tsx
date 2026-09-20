'use client';

import { LAND_STAGES, LandStats } from '../lib/arcade';

/**
 * 마이 랜드 — 게임과 게시판 활동이 쌓일수록 마을이 자라난다.
 *
 * 각 단계의 건물은 <g> 하나로 묶여 있고, 해금된 단계까지만 그린다.
 * 바로 다음 단계는 흐린 실루엣으로 미리 보여 준다.
 */

/** 창문 불빛 (조금씩 다른 주기로 깜빡인다) */
function Window({ x, y, w = 6, h = 7, delay = 0 }: { x: number; y: number; w?: number; h?: number; delay?: number }) {
  return (
    <rect x={x} y={y} width={w} height={h} rx={1} fill="#ffd27d" opacity={0.9}>
      <animate
        attributeName="opacity"
        values="0.95;0.55;0.95"
        dur="4s"
        begin={`${delay}s`}
        repeatCount="indefinite"
      />
    </rect>
  );
}

function Tree({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={-2} y={-10} width={4} height={10} fill="#3b2b1c" />
      <circle cx={0} cy={-16} r={9} fill="#1f5b46" />
      <circle cx={-6} cy={-11} r={7} fill="#24684f" />
      <circle cx={6} cy={-12} r={6.5} fill="#1b5040" />
    </g>
  );
}

function Lamp({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x={-1} y={-26} width={2} height={26} fill="#4a5168" />
      <circle cx={0} cy={-29} r={4} fill="#ffd27d" />
      <circle cx={0} cy={-29} r={16} fill="url(#land-glow-warm)" />
    </g>
  );
}

/** 1단계 · 초가집 */
function Hut() {
  return (
    <g>
      <path d="M -34 -32 L 0 -56 L 34 -32 Z" fill="#c69a5a" />
      <path d="M -34 -32 L 0 -56 L 0 -32 Z" fill="#b1854a" />
      <rect x={-26} y={-32} width={52} height={32} fill="#6f4d31" />
      <rect x={-26} y={-32} width={16} height={32} fill="#5c3f28" />
      <rect x={-6} y={-18} width={13} height={18} rx={1} fill="#31200f" />
      <Window x={11} y={-26} delay={0.4} />
      <ellipse cx={0} cy={2} rx={38} ry={6} fill="#000" opacity={0.28} />
    </g>
  );
}

/** 1단계 · 모닥불 */
function Campfire({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle cx={0} cy={-6} r={26} fill="url(#land-glow-warm)" />
      <rect x={-8} y={-3} width={16} height={3} rx={1.5} fill="#4a3320" />
      <path d="M 0 -18 C 6 -12 7 -7 4 -3 L -4 -3 C -7 -7 -6 -12 0 -18 Z" fill="#ffb347">
        <animate attributeName="opacity" values="1;0.65;1" dur="1.1s" repeatCount="indefinite" />
      </path>
    </g>
  );
}

/** 2단계 · 이웃집 */
function House() {
  return (
    <g>
      <path d="M -27 -28 L 0 -46 L 27 -28 Z" fill="#9a5b46" />
      <rect x={-22} y={-28} width={44} height={28} fill="#55607f" />
      <rect x={-22} y={-28} width={13} height={28} fill="#46506b" />
      <Window x={-16} y={-22} delay={1.1} />
      <Window x={8} y={-22} delay={2.2} />
      <rect x={-5} y={-14} width={11} height={14} rx={1} fill="#2b3145" />
      <ellipse cx={0} cy={2} rx={30} ry={5} fill="#000" opacity={0.26} />
    </g>
  );
}

/** 3단계 · 상점 한 채 */
function Shop({ x, awning }: { x: number; awning: string }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <rect x={-21} y={-34} width={42} height={34} fill="#3c4361" />
      <rect x={-21} y={-34} width={12} height={34} fill="#333a55" />
      <rect x={-23} y={-36} width={46} height={5} rx={2} fill={awning} />
      <rect x={-16} y={-27} width={32} height={12} rx={1} fill="#121629" />
      <Window x={-13} y={-25} w={9} h={8} delay={0.8} />
      <Window x={3} y={-25} w={9} h={8} delay={1.9} />
      <rect x={-6} y={-13} width={13} height={13} rx={1} fill="#20263d" />
      <ellipse cx={0} cy={2} rx={26} ry={5} fill="#000" opacity={0.26} />
    </g>
  );
}

/** 4단계 · 아파트 두 동 + 크레인 */
function Apartments() {
  const rows = [0, 1, 2, 3, 4, 5];
  const cols = [0, 1, 2];
  return (
    <g>
      {/* 큰 동 */}
      <rect x={-46} y={-116} width={44} height={116} fill="#2d3555" />
      <rect x={-46} y={-116} width={13} height={116} fill="#262d49" />
      {rows.map((r) =>
        cols.map((c) => (
          <Window
            key={`a${r}${c}`}
            x={-40 + c * 12}
            y={-108 + r * 18}
            w={7}
            h={9}
            delay={(r + c) * 0.5}
          />
        ))
      )}
      {/* 작은 동 */}
      <rect x={4} y={-84} width={36} height={84} fill="#323a5e" />
      <rect x={4} y={-84} width={11} height={84} fill="#2a3150" />
      {rows.slice(0, 4).map((r) =>
        cols.slice(0, 2).map((c) => (
          <Window key={`b${r}${c}`} x={10 + c * 13} y={-76 + r * 18} w={7} h={9} delay={r * 0.7 + 1} />
        ))
      )}
      {/* 크레인 */}
      <g stroke="#8c94b5" strokeWidth={1.6} fill="none">
        <path d="M 52 0 L 52 -128" />
        <path d="M 30 -128 L 86 -128" />
        <path d="M 52 -128 L 40 -112 M 52 -128 L 64 -112" />
        <path d="M 74 -128 L 74 -104" strokeDasharray="3 3" />
      </g>
      <circle cx={52} cy={-132} r={2.6} fill="#ff6b6b">
        <animate attributeName="opacity" values="1;0.2;1" dur="1.6s" repeatCount="indefinite" />
      </circle>
      <ellipse cx={-6} cy={2} rx={54} ry={7} fill="#000" opacity={0.3} />
    </g>
  );
}

/** 5단계 · 랜드마크 타워 */
function Tower() {
  return (
    <g>
      <ellipse cx={0} cy={2} rx={40} ry={7} fill="#000" opacity={0.3} />
      <circle cx={0} cy={-90} r={92} fill="url(#land-glow-warm)" />
      <path d="M -30 0 L -22 -54 L 22 -54 L 30 0 Z" fill="#b98330" />
      <path d="M -30 0 L -22 -54 L 0 -54 L 0 0 Z" fill="#d6a04a" />
      <path d="M -22 -58 L 22 -58 L 26 -50 L -26 -50 Z" fill="#f0c064" />
      <path d="M -18 -58 L -13 -100 L 13 -100 L 18 -58 Z" fill="#c99038" />
      <path d="M -18 -58 L -13 -100 L 0 -100 L 0 -58 Z" fill="#e8b155" />
      <path d="M -14 -104 L 14 -104 L 17 -96 L -17 -96 Z" fill="#f0c064" />
      <path d="M -9 -104 L -5 -136 L 5 -136 L 9 -104 Z" fill="#dcae58" />
      <path d="M 0 -136 L 0 -160" stroke="#f5c765" strokeWidth={2.5} />
      <circle cx={0} cy={-163} r={5} fill="#fff3d0" />
      <circle cx={0} cy={-163} r={16} fill="url(#land-glow-warm)">
        <animate attributeName="r" values="12;26;12" dur="2.6s" repeatCount="indefinite" />
      </circle>
      <Window x={-6} y={-46} w={12} h={10} delay={0.3} />
      <Window x={-5} y={-92} w={10} h={9} delay={1.4} />

      {/* 불꽃놀이 */}
      {[
        { x: -66, y: -132, c: '#ff8fb1', d: 0 },
        { x: 62, y: -150, c: '#8fd3ff', d: 1.1 },
        { x: 34, y: -186, c: '#ffe08a', d: 2.2 },
      ].map((f, i) => (
        <g key={i} transform={`translate(${f.x} ${f.y})`} stroke={f.c} strokeWidth={1.6} strokeLinecap="round">
          {Array.from({ length: 8 }).map((_, k) => {
            const a = (k / 8) * Math.PI * 2;
            return (
              <line
                key={k}
                x1={Math.cos(a) * 4}
                y1={Math.sin(a) * 4}
                x2={Math.cos(a) * 13}
                y2={Math.sin(a) * 13}
              />
            );
          })}
          <animateTransform
            attributeName="transform"
            type="scale"
            values="0.2;1.1;0.2"
            dur="3.2s"
            begin={`${f.d}s`}
            repeatCount="indefinite"
            additive="sum"
          />
          <animate attributeName="opacity" values="0;1;0" dur="3.2s" begin={`${f.d}s`} repeatCount="indefinite" />
        </g>
      ))}
    </g>
  );
}

/**
 * 단계별 배치.
 * y 가 클수록 앞쪽(= 섬이 넓은 곳)이라 큰 건물일수록 아래에 둔다.
 * 단계 순서대로 그리면 자연스럽게 뒤 → 앞 순서가 된다.
 */
const PLACEMENT: Record<number, { x: number; y: number }> = {
  1: { x: 305, y: 198 },
  2: { x: 235, y: 200 },
  3: { x: 390, y: 206 },
  4: { x: 135, y: 214 },
  5: { x: 468, y: 220 },
};

function StageGroup({ stage }: { stage: number }) {
  const at = PLACEMENT[stage];
  if (!at) return null;
  return (
    <g transform={`translate(${at.x} ${at.y})`}>
      {stage === 1 && <Hut />}
      {stage === 2 && <House />}
      {stage === 3 && (
        <>
          <Shop x={-24} awning="#c2536b" />
          <Shop x={22} awning="#3f8f7a" />
        </>
      )}
      {stage === 4 && <Apartments />}
      {stage === 5 && <Tower />}
    </g>
  );
}

export default function MyLand({ land }: { land: LandStats }) {
  const isMax = land.nextAt === null;
  const nextStage = isMax ? null : LAND_STAGES[land.stage + 1];
  const remain = land.nextAt === null ? 0 : land.nextAt - land.points;

  const chips = [
    { label: '게임 XP', value: land.breakdown.games, sub: `${land.counts.plays}판` },
    { label: '내 글', value: land.breakdown.posts, sub: `${land.counts.posts}개` },
    { label: '내 댓글', value: land.breakdown.comments, sub: `${land.counts.comments}개` },
    { label: '받은 추천', value: land.breakdown.likes, sub: `${land.counts.likes}개` },
  ];

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
        <h2 className="font-black text-white">🏝 마이 랜드</h2>
        <span className="text-xs text-slate-400">게임하고 글 쓰면 내 땅이 자랍니다</span>
        <span className="ml-auto text-xs font-bold text-amber-300">{land.points.toLocaleString()} P</span>
      </div>

      <div className="px-4 py-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="lg:order-2 flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] font-black bg-amber-300 text-slate-900 px-2 py-0.5 rounded-full">
            {land.stage + 1}단계
          </span>
          <span className="font-black text-white text-lg">{land.stageName}</span>
          {isMax && (
            <span className="text-[11px] font-bold text-amber-300 border border-amber-300/40 px-2 py-0.5 rounded-full">
              MAX
            </span>
          )}
        </div>

        {/* 진행도 */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
            <span className="text-slate-300">
              {isMax ? '모든 단계를 완성했습니다 🎉' : `다음 단계 · ${nextStage?.name}`}
            </span>
            {!isMax && <span className="text-amber-300">{remain.toLocaleString()} P</span>}
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-300 to-amber-500 transition-all duration-500"
              style={{ width: `${Math.round(land.progress * 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">{LAND_STAGES[land.stage].hint}</p>
        </div>

        {/* 포인트 내역 */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          {chips.map((c) => (
            <div key={c.label} className="rounded-xl bg-white/[0.04] border border-white/5 px-3 py-2">
              <p className="text-[11px] text-slate-400">{c.label}</p>
              <p className="font-black text-white text-sm">
                +{c.value.toLocaleString()}
                <span className="ml-1 text-[11px] font-normal text-slate-500">P · {c.sub}</span>
              </p>
            </div>
          ))}
        </div>
        </div>

        {/* 마을 풍경 */}
        <div className="lg:order-1 rounded-xl overflow-hidden bg-gradient-to-b from-[#121634] to-[#1d2145] border border-white/5">
          <svg viewBox="0 0 560 300" className="w-full block" role="img" aria-label={`${land.stageName} 단계의 마이 랜드`}>
            <defs>
              {/* 빛무리 — 단색 원은 회색 원반처럼 보여서 방사형 그라디언트를 쓴다 */}
              <radialGradient id="land-glow-warm">
                <stop offset="0%" stopColor="#f5c765" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#f5c765" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="land-glow-moon">
                <stop offset="0%" stopColor="#f6f2e2" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#f6f2e2" stopOpacity="0" />
              </radialGradient>
              {/* 초승달 — 배경색으로 덮지 않고 마스크로 깎는다 */}
              <mask id="land-moon">
                <circle cx={78} cy={54} r={19} fill="#fff" />
                <circle cx={69} cy={48} r={17} fill="#000" />
              </mask>
            </defs>

            <circle cx={78} cy={54} r={19} fill="#f6f2e2" mask="url(#land-moon)" />
            <circle cx={78} cy={54} r={46} fill="url(#land-glow-moon)" />

            {[
              [150, 44], [210, 76], [268, 34], [330, 66], [392, 30], [440, 84], [120, 118], [300, 112], [500, 56],
            ].map(([cx, cy], i) => (
              <circle key={i} cx={cx} cy={cy} r={1.4} fill="#cfd6ff" opacity={0.75}>
                <animate
                  attributeName="opacity"
                  values="0.8;0.25;0.8"
                  dur={`${3 + (i % 4)}s`}
                  repeatCount="indefinite"
                />
              </circle>
            ))}

            {/* 섬 */}
            <path d="M 44 236 Q 280 350 516 236 L 516 242 Q 280 362 44 242 Z" fill="#241a12" />
            <path d="M 44 236 Q 96 306 280 306 Q 464 306 516 236 L 516 246 Q 280 338 44 246 Z" fill="#2e2118" />
            <ellipse cx={280} cy={236} rx={236} ry={44} fill="#2f5d43" />
            <ellipse cx={280} cy={232} rx={230} ry={40} fill="#3a7050" />

            {/* 길 */}
            {land.stage >= 2 && (
              <path
                d="M 150 244 Q 280 218 430 240"
                stroke="#6b5a3e"
                strokeWidth={9}
                fill="none"
                opacity={0.35}
                strokeLinecap="round"
              />
            )}

            {/* 나무 */}
            {land.stage >= 2 && (
              <>
                <Tree x={78} y={224} s={0.9} />
                <Tree x={272} y={226} s={0.7} />
                <Tree x={508} y={228} s={0.8} />
              </>
            )}

            {/* 해금된 단계 */}
            {Array.from({ length: land.stage }, (_, i) => i + 1).map((s) => (
              <StageGroup key={s} stage={s} />
            ))}
            {land.stage >= 1 && <Campfire x={360} y={216} />}
            {land.stage >= 3 && (
              <>
                <Lamp x={175} y={210} />
                <Lamp x={340} y={206} />
              </>
            )}

            {/* 다음 단계 미리보기 */}
            {!isMax && land.stage + 1 <= 5 && (
              <g opacity={0.13}>
                <StageGroup stage={land.stage + 1} />
              </g>
            )}

            {land.stage === 0 && (
              <>
                <g transform="translate(290 200)">
                  <rect x={-2} y={-28} width={4} height={28} fill="#5b4630" />
                  <rect x={-24} y={-40} width={48} height={16} rx={2} fill="#6b5236" />
                </g>
                <text x={280} y={276} textAnchor="middle" fill="#8b93b8" fontSize={13} fontWeight="700">
                  게임 한 판이면 첫 집이 생겨요
                </text>
              </>
            )}
          </svg>
        </div>

      </div>

      <p className="px-4 py-2 text-[11px] text-slate-400 bg-white/[0.03] border-t border-white/10">
        게임 XP 1점 = 1P · 글 25P · 댓글 10P · 내 글이 받은 추천 6P
      </p>
    </section>
  );
}
