import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import * as ads from '../lib/ads';
import { AdBanner, BANNER_RATIO, approxBytes, formatBytes } from '../lib/ads';

/** 광고 배너 관리 — 등록 · 순서 변경 · 노출 on/off */
export default function AdsPage() {
  const [list, setList] = useState<AdBanner[]>([]);
  const [image, setImage] = useState('');
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const reload = () => ads.listBanners().then(setList);
  useEffect(() => {
    reload();
  }, []);

  const pickFile = async (file?: File) => {
    if (!file) return;
    setError('');
    setBusy(true);
    try {
      const dataUrl = await ads.fileToImage(file);
      setImage(dataUrl);
      if (!title) setTitle(file.name.replace(/\.[^.]+$/, ''));
    } catch (err) {
      setError(err instanceof Error ? err.message : '이미지를 불러오지 못했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await ads.createBanner({ title, image, link });
      setImage('');
      setTitle('');
      setLink('');
      setError('');
      if (fileRef.current) fileRef.current.value = '';
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : '배너를 저장하지 못했습니다.');
    }
  };

  const totalBytes = list.reduce((a, b) => a + approxBytes(b.image), 0);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-bold tracking-[0.18em] text-ink-faint">ADS</p>
        <h1 className="text-2xl font-black text-ink mt-1">광고 배너 관리</h1>
        <p className="text-sm text-ink-mute mt-1">
          홈에 한 줄에 2개씩 노출됩니다. 목록 순서가 곧 노출 순서예요.
        </p>
      </div>

      {/* 새 배너 */}
      <section className="bg-white rounded-2xl border border-hair p-4">
        <h2 className="font-bold text-ink mb-3">새 배너 추가</h2>
        <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[220px_1fr]">
          <div>
            <label
              className="block rounded-xl border border-dashed border-hair bg-ground overflow-hidden cursor-pointer transition-colors hover:border-ink/25"
              style={{ aspectRatio: BANNER_RATIO }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                pickFile(e.dataTransfer.files?.[0]);
              }}
            >
              {image ? (
                <img src={image} alt="미리보기" className="w-full h-full object-cover" />
              ) : (
                <span className="w-full h-full grid place-items-center text-center px-3">
                  <span className="text-xs text-ink-mute">
                    {busy ? '이미지 처리 중…' : '이미지 선택 또는 끌어다 놓기'}
                    <br />
                    <span className="text-ink-faint">권장 비율 2:1 (예: 800×400)</span>
                  </span>
                </span>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0])}
              />
            </label>
            {image && (
              <p className="text-[11px] text-ink-faint mt-1.5 text-center">
                약 {formatBytes(approxBytes(image))}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="배너 이름 (이미지 대체 텍스트로도 쓰입니다)"
              maxLength={60}
              className="w-full rounded-lg border border-hair bg-ground px-3 py-2.5 text-sm outline-none focus:border-ink/30 focus:bg-white"
            />
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="연결할 주소 (선택) · https://"
              className="w-full rounded-lg border border-hair bg-ground px-3 py-2.5 text-sm outline-none focus:border-ink/30 focus:bg-white"
            />
            {error && <p className="text-sm text-rose-500">{error}</p>}
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={busy}
                className="bg-ink text-white font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-ink-soft disabled:opacity-50"
              >
                배너 추가
              </button>
              <p className="text-[11px] text-ink-faint">
                이미지는 가로 900px 로 줄여 이 브라우저에 저장됩니다
              </p>
            </div>
          </div>
        </form>
      </section>

      {/* 목록 */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[11px] font-bold tracking-[0.14em] text-ink-faint">
            등록된 배너 {list.length}개
          </h2>
          {list.length > 0 && (
            <span className="text-[11px] text-ink-faint">
              사용 중 약 {formatBytes(totalBytes)}
            </span>
          )}
        </div>

        {list.length === 0 ? (
          <p className="bg-white border border-hair rounded-xl py-10 text-center text-sm text-ink-mute">
            아직 등록된 배너가 없습니다.
          </p>
        ) : (
          <ul className="space-y-2">
            {list.map((b, i) => (
              <li
                key={b.id}
                className={`flex items-center gap-3 bg-white border border-hair rounded-xl p-3 ${
                  b.active ? '' : 'opacity-55'
                }`}
              >
                <span className="text-xs font-black text-ink-faint w-5 text-center tabular-nums">
                  {i + 1}
                </span>
                <img
                  src={b.image}
                  alt={b.title}
                  className="w-24 rounded-lg border border-hair object-cover shrink-0"
                  style={{ aspectRatio: BANNER_RATIO }}
                />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-ink text-sm truncate">{b.title}</p>
                  <p className="text-[11px] text-ink-faint truncate">
                    {b.link || '연결 주소 없음'} · {formatBytes(approxBytes(b.image))}
                  </p>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => ads.moveBanner(b.id, -1).then(reload)}
                    disabled={i === 0}
                    className="w-8 h-8 rounded-lg border border-hair text-ink-mute hover:border-ink/25 disabled:opacity-30"
                    title="위로"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => ads.moveBanner(b.id, 1).then(reload)}
                    disabled={i === list.length - 1}
                    className="w-8 h-8 rounded-lg border border-hair text-ink-mute hover:border-ink/25 disabled:opacity-30"
                    title="아래로"
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => ads.updateBanner(b.id, { active: !b.active }).then(reload)}
                    className={`h-8 px-3 rounded-lg text-xs font-bold border ${
                      b.active
                        ? 'bg-ink text-white border-ink'
                        : 'border-hair text-ink-mute hover:border-ink/25'
                    }`}
                  >
                    {b.active ? '노출 중' : '숨김'}
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`"${b.title}" 배너를 삭제할까요?`)) {
                        ads.deleteBanner(b.id).then(reload);
                      }
                    }}
                    className="w-8 h-8 rounded-lg border border-hair text-ink-faint hover:text-rose-500 hover:border-rose-200"
                    title="삭제"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-xs text-ink-faint">
        데모 모드에서는 배너가 이 브라우저에만 저장됩니다 ·{' '}
        <Link to="/" className="font-semibold text-ink-mute hover:text-ink">
          홈에서 확인하기 →
        </Link>
      </p>
    </div>
  );
}
