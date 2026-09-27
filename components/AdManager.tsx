'use client';

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdBanner, BANNER_HINT, BANNER_RATIO, BannerSize } from '../lib/server/ads-types';
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
  const [size, setSize] = useState<BannerSize>('wide');
  // 이미지를 올릴지, 제휴사 코드를 붙여넣을지
  const [mode, setMode] = useState<'image' | 'embed'>('image');

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
        <form action={action} className="space-y-4">
          <input type="hidden" name="size" value={size} />
          <input type="hidden" name="image" value={mode === 'image' ? image : ''} />

          {/* 배너 모양 */}
          <div>
            <p className="text-[13px] font-bold text-ink-mute mb-1.5">배너 모양</p>
            <div className="flex gap-2">
              {(['wide', 'card'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setSize(v)}
                  className={`flex-1 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                    size === v ? 'border-ink bg-ground' : 'border-hair hover:border-ink/25'
                  }`}
                >
                  <span className="block text-sm font-bold text-ink">
                    {v === 'wide' ? '가로 배너' : '카드 배너'}
                  </span>
                  <span className="block text-[11px] text-ink-faint mt-0.5">{BANNER_HINT[v]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 무엇을 넣을지 */}
          <div>
            <div className="flex gap-1 mb-2">
              {(['image', 'embed'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setMode(v)}
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold ${
                    mode === v ? 'bg-ink text-white' : 'text-ink-mute hover:bg-ground'
                  }`}
                >
                  {v === 'image' ? '이미지 올리기' : '제휴 코드 붙여넣기'}
                </button>
              ))}
            </div>

            {mode === 'image' ? (
              <div className="max-w-md">
                <div
                  className="rounded-xl border border-dashed border-hair bg-ground overflow-hidden grid place-items-center"
                  style={{ aspectRatio: BANNER_RATIO[size] }}
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
                <p className="text-[11px] text-ink-faint mt-1">{BANNER_HINT[size]}</p>
              </div>
            ) : (
              <div>
                <textarea
                  name="embed"
                  rows={4}
                  placeholder={'쿠팡 파트너스에서 복사한 배너 코드를 그대로 붙여넣으세요.\n<script src="https://ads-partners.coupang.com/g.js"></script> ...'}
                  className={`${field} font-mono text-xs leading-relaxed`}
                />
                <p className="text-[11px] text-ink-faint mt-1 leading-relaxed">
                  쿠팡 파트너스 · 링크프라이스 · 구글 애드센스 코드를 받습니다. 붙여넣은 코드를
                  그대로 실행하지 않고 배너 주소만 뽑아 안전하게 띄웁니다.
                </p>
              </div>
            )}
          </div>

          {/* 이름 · 연결 주소 */}
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              name="title"
              placeholder="배너 이름 (관리용 · 이미지 대체 텍스트)"
              maxLength={60}
              className={field}
            />
            {mode === 'image' && (
              <input name="link" placeholder="연결할 주소 (선택) · https://" className={field} />
            )}
          </div>

          {state.error && <p className="text-sm text-rose-500">{state.error}</p>}
          <SubmitButton className="bg-ink text-white font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-ink-soft">
            배너 추가
          </SubmitButton>
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
                {b.embed ? (
                  <span className="w-24 h-10 shrink-0 rounded-lg border border-hair bg-ground grid place-items-center text-[11px] font-bold text-ink-mute">
                    제휴 배너
                  </span>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={b.image}
                    alt={b.title}
                    className="w-24 rounded-lg border border-hair object-cover shrink-0"
                    style={{ aspectRatio: BANNER_RATIO[b.size] }}
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-ink text-sm truncate">
                    <span className="text-[10px] font-black text-ink-faint mr-1.5">
                      {b.size === 'wide' ? '가로' : '카드'}
                    </span>
                    {b.title}
                  </p>
                  <p className="text-[11px] text-ink-faint truncate">
                    {b.embed || b.link || '연결 주소 없음'}
                  </p>
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
