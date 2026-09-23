import Link from 'next/link';
import { BANNER_RATIO } from '../lib/server/ads-types';
import type { AdBanner } from '../lib/server/ads-types';

/**
 * 광고 배너 자리 — 한 줄에 2개씩.
 *
 * 배너가 없으면 방문자에게는 아무것도 보이지 않고, 운영자에게만
 * 빈 자리와 '배너 등록하기' 안내가 보인다.
 * (자리가 어디인지 알아야 채울 수 있으니까)
 */
export default function AdSlots({
  ads,
  isAdmin = false,
  dark = false,
  className = '',
}: {
  ads: AdBanner[];
  isAdmin?: boolean;
  /** 게임 랜드처럼 어두운 배경에 얹을 때 */
  dark?: boolean;
  className?: string;
}) {
  if (ads.length === 0 && !isAdmin) return null;

  const label = dark ? 'text-slate-400' : 'text-ink-faint';
  const link = dark ? 'text-slate-300 hover:text-white' : 'text-ink-mute hover:text-ink';
  const frame = dark
    ? 'border-white/10 bg-white/[0.04] hover:border-amber-300/40'
    : 'border-hair bg-white hover:border-ink/25';
  const empty = dark
    ? 'border-white/15 text-slate-500 hover:border-amber-300/40 hover:text-slate-300'
    : 'border-hair text-ink-faint hover:border-ink/25 hover:text-ink-mute';

  return (
    <section className={className}>
      <div className="flex items-center justify-between mb-2">
        <h2 className={`text-[11px] font-bold tracking-[0.14em] ${label}`}>광고</h2>
        {isAdmin && (
          <Link href="/ads" className={`text-xs font-semibold ${link}`}>
            배너 관리 →
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ads.map((b) => {
          const inner = (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={b.image}
                alt={b.title}
                loading="lazy"
                className="w-full h-full object-cover"
                style={{ aspectRatio: BANNER_RATIO }}
              />
              <span className="absolute top-2 left-2 text-[10px] font-bold bg-black/55 text-white px-1.5 py-0.5 rounded">
                AD
              </span>
            </>
          );
          const cls = `relative block overflow-hidden rounded-xl border ${frame}`;
          return b.link ? (
            <a key={b.id} href={b.link} target="_blank" rel="noopener noreferrer sponsored" className={cls}>
              {inner}
            </a>
          ) : (
            <div key={b.id} className={cls}>
              {inner}
            </div>
          );
        })}

        {/*
          운영자에게만 보이는 빈 자리.
          줄이 늘 2칸으로 떨어지도록, 홀수면 1칸 · 짝수면 2칸을 더 보여 준다.
        */}
        {isAdmin &&
          Array.from({ length: ads.length % 2 === 0 ? 2 : 1 }).map(
            (_, i) => (
              // 빈 자리는 화면을 잡아먹지 않도록 낮게 둔다
              <Link
                key={`empty-${i}`}
                href="/ads"
                className={`grid place-items-center h-20 rounded-xl border border-dashed text-sm font-semibold transition-colors ${empty}`}
              >
                + 배너 등록하기
              </Link>
            )
          )}
      </div>
    </section>
  );
}
