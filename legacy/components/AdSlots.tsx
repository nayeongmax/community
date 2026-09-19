import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as ads from '../lib/ads';
import { AdBanner, BANNER_RATIO } from '../lib/ads';

/** 홈 등에 노출되는 광고 배너 — 한 줄에 2개씩 */
export default function AdSlots({ className = '' }: { className?: string }) {
  const [banners, setBanners] = useState<AdBanner[] | null>(null);

  useEffect(() => {
    ads.listActiveBanners().then(setBanners);
  }, []);

  if (banners === null) return null;

  return (
    <section className={className}>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-[11px] font-bold tracking-[0.14em] text-ink-faint">광고</h2>
        <Link to="/ads" className="text-xs font-semibold text-ink-mute hover:text-ink">
          배너 관리 →
        </Link>
      </div>

      {banners.length === 0 ? (
        <Link
          to="/ads"
          className="grid place-items-center rounded-xl border border-dashed border-hair bg-white py-7 text-center transition-colors hover:border-ink/25"
        >
          <p className="text-sm font-bold text-ink">배너 자리가 비어 있습니다</p>
          <p className="text-xs text-ink-mute mt-1">
            이미지를 올려 광고 배너를 채워 보세요 · 한 줄에 2개씩 노출됩니다
          </p>
        </Link>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {banners.map((b) => {
            const inner = (
              <>
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
            const cls =
              'relative block overflow-hidden rounded-xl border border-hair bg-white transition-colors hover:border-ink/25';
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
        </div>
      )}
    </section>
  );
}
