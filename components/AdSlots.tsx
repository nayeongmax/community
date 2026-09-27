import Link from 'next/link';
import { BANNER_RATIO, EMBED_FALLBACK_HEIGHT, embedSize } from '../lib/server/ads-types';
import type { AdBanner } from '../lib/server/ads-types';

/**
 * 광고 배너 자리.
 *
 *   가로 배너(wide) — 한 줄 전체. 쿠팡 파트너스 같은 제휴 배너용
 *   카드 배너(card) — 한 줄에 2개
 *
 * 배너가 없으면 방문자에게는 아무것도 보이지 않고, 운영자에게만
 * 빈 자리와 '배너 등록하기' 안내가 보인다. (자리를 알아야 채울 수 있으니까)
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

  const wide = ads.filter((b) => b.size === 'wide');
  const cards = ads.filter((b) => b.size !== 'wide');

  const label = dark ? 'text-slate-400' : 'text-ink-faint';
  const linkCls = dark ? 'text-slate-300 hover:text-white' : 'text-ink-mute hover:text-ink';
  const frame = dark
    ? 'border-white/10 bg-white/[0.04] hover:border-amber-300/40'
    : 'border-hair bg-white hover:border-ink/25';
  const empty = dark
    ? 'border-white/15 text-slate-500 hover:border-amber-300/40 hover:text-slate-300'
    : 'border-hair text-ink-faint hover:border-ink/25 hover:text-ink-mute';

  /** 배너 한 장의 내용 */
  const body = (b: AdBanner) => {
    if (b.embed) {
      // 제휴사 위젯은 정해진 크기로 그려진다. 비율로 늘리면 안쪽이 잘린다.
      const { width, height } = embedSize(b.embed);
      return (
        <span className="block w-full overflow-x-auto" style={{ textAlign: 'center' }}>
          {/* sandbox 로 우리 페이지를 건드리지 못하게 묶어 둔다 */}
          <iframe
            src={b.embed}
            title={b.title}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            sandbox="allow-scripts allow-popups allow-popups-to-escape-sandbox"
            className="border-0 inline-block align-top"
            style={{
              width: width ? `${width}px` : '100%',
              maxWidth: '100%',
              height: `${height ?? EMBED_FALLBACK_HEIGHT}px`,
            }}
          />
        </span>
      );
    }
    return (
      <>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={b.image}
          alt={b.title}
          loading="lazy"
          className="w-full h-full object-cover"
          style={{ aspectRatio: BANNER_RATIO[b.size] }}
        />
        <span className="absolute top-2 left-2 text-[10px] font-bold bg-black/55 text-white px-1.5 py-0.5 rounded">
          AD
        </span>
      </>
    );
  };

  const slot = (b: AdBanner) => {
    const cls = `relative block overflow-hidden rounded-xl border ${frame}`;
    // 임베드는 제휴사가 클릭까지 처리하므로 링크로 감싸지 않는다
    if (b.embed) {
      return (
        <div key={b.id} className={cls}>
          {body(b)}
        </div>
      );
    }
    return b.link ? (
      <a
        key={b.id}
        href={b.link}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className={cls}
      >
        {body(b)}
      </a>
    ) : (
      <div key={b.id} className={cls}>
        {body(b)}
      </div>
    );
  };

  return (
    <section className={className}>
      <div className="flex items-center justify-between mb-2">
        <h2 className={`text-[11px] font-bold tracking-[0.14em] ${label}`}>광고</h2>
        {isAdmin && (
          <Link href="/ads" className={`text-xs font-semibold ${linkCls}`}>
            배너 관리 →
          </Link>
        )}
      </div>

      {/* 가로 배너 — 한 줄 전체 */}
      {wide.length > 0 && <div className="space-y-3 mb-3">{wide.map(slot)}</div>}

      {/* 카드 배너 — 한 줄에 2개 */}
      {cards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">{cards.map(slot)}</div>
      )}

      {/* 운영자에게만 보이는 빈 자리 */}
      {isAdmin && (
        <Link
          href="/ads"
          className={`mt-3 grid place-items-center h-16 rounded-xl border border-dashed text-sm font-semibold transition-colors ${empty}`}
        >
          + 배너 등록하기
        </Link>
      )}
    </section>
  );
}
