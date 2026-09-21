'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdBanner, BANNER_RATIO } from '../lib/server/ads-types';
import {
  createBannerAction,
  deleteBannerAction,
  moveBannerAction,
  toggleBannerAction,
} from '../lib/server/actions';
import SubmitButton from './SubmitButton';
import UploadButton from './UploadButton';

/** 광고 배너 관리 — 등록 · 순서 변경 · 노출 on/off */
export default function AdManager({ banners }: { banners: AdBanner[] }) {
  const router = useRouter();
  const [state, action] = useActionState(createBannerAction, {});
  const [image, setImage] = useState('');

  useEffect(() => {
    if (!state.ok) return;
    setImage('');
    router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const field =
    'w-full rounded-lg border border-hair bg-ground px-3 py-2.5 text-sm outline-none focus:border-ink/30 focus:bg-white';

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl border border-hair p-4">
        <h2 className="font-bold text-ink mb-3">새 배너 추가</h2>
        <form action={action} className="grid gap-3 sm:grid-cols-[220px_1fr]">
          <input type="hidden" name="image" value={image} />
          <div>
            <div
              className="rounded-xl border border-dashed border-hair bg-ground overflow-hidden grid place-items-center"
              style={{ aspectRatio: BANNER_RATIO }}
            >
              {image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={image} alt="미리보기" className="w-full h-full object-cover" />
              ) : (
                <UploadButton label="이미지 올리기" onUploaded={(f) => setImage(f[0].url)} />
              )}
            </div>
            {image && (
              <button
                type="button"
                onClick={() => setImage('')}
                className="text-[11px] text-ink-faint hover:text-rose-500 mt-1.5"
              >
                다시 고르기
              </button>
            )}
            <p className="text-[11px] text-ink-faint mt-1 text-center">권장 비율 2:1 (예 800×400)</p>
          </div>

          <div className="space-y-2">
            <input name="title" placeholder="배너 이름 (이미지 대체 텍스트)" maxLength={60} className={field} />
            <input name="link" placeholder="연결할 주소 (선택) · https://" className={field} />
            {state.error && <p className="text-sm text-rose-500">{state.error}</p>}
            <SubmitButton className="bg-ink text-white font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-ink-soft">
              배너 추가
            </SubmitButton>
          </div>
        </form>
      </section>

      <section>
        <h2 className="text-[11px] font-bold tracking-[0.14em] text-ink-faint mb-2">
          등록된 배너 {banners.length}개
        </h2>
        {banners.length === 0 ? (
          <p className="bg-white border border-hair rounded-xl py-10 text-center text-sm text-ink-mute">
            아직 등록된 배너가 없습니다.
          </p>
        ) : (
          <ul className="space-y-2">
            {banners.map((b, i) => (
              <li
                key={b.id}
                className={`flex items-center gap-3 bg-white border border-hair rounded-xl p-3 ${
                  b.active ? '' : 'opacity-55'
                }`}
              >
                <span className="text-xs font-black text-ink-faint w-5 text-center tabular-nums">
                  {i + 1}
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={b.image}
                  alt={b.title}
                  className="w-24 rounded-lg border border-hair object-cover shrink-0"
                  style={{ aspectRatio: BANNER_RATIO }}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-ink text-sm truncate">{b.title}</p>
                  <p className="text-[11px] text-ink-faint truncate">{b.link || '연결 주소 없음'}</p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <form action={moveBannerAction.bind(null, b.id, -1)}>
                    <button
                      disabled={i === 0}
                      title="위로"
                      className="w-8 h-8 rounded-lg border border-hair text-ink-mute hover:border-ink/25 disabled:opacity-30"
                    >
                      ↑
                    </button>
                  </form>
                  <form action={moveBannerAction.bind(null, b.id, 1)}>
                    <button
                      disabled={i === banners.length - 1}
                      title="아래로"
                      className="w-8 h-8 rounded-lg border border-hair text-ink-mute hover:border-ink/25 disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </form>
                  <form action={toggleBannerAction.bind(null, b.id)}>
                    <button
                      className={`h-8 px-3 rounded-lg text-xs font-bold border ${
                        b.active
                          ? 'bg-ink text-white border-ink'
                          : 'border-hair text-ink-mute hover:border-ink/25'
                      }`}
                    >
                      {b.active ? '노출 중' : '숨김'}
                    </button>
                  </form>
                  <form
                    action={deleteBannerAction.bind(null, b.id)}
                    onSubmit={(e) => {
                      if (!confirm(`"${b.title}" 배너를 삭제할까요?`)) e.preventDefault();
                    }}
                  >
                    <button
                      title="삭제"
                      className="w-8 h-8 rounded-lg border border-hair text-ink-faint hover:text-rose-500 hover:border-rose-200"
                    >
                      ✕
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
