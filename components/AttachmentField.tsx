'use client';

import { useState } from 'react';
import { Attachment } from '../lib/types';
import UploadButton from './UploadButton';

/** 글에 붙일 사진·동영상·링크를 고르는 영역 (서버에 올린다) */
export default function AttachmentField({ initial }: { initial?: Attachment[] }) {
  const [items, setItems] = useState<Attachment[]>(initial ?? []);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkName, setLinkName] = useState('');
  const [error, setError] = useState('');

  const addLink = () => {
    const url = linkUrl.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
      setError('링크는 http:// 또는 https:// 로 시작해야 합니다.');
      return;
    }
    setError('');
    setItems([
      ...items,
      { id: 'l_' + Date.now().toString(36), type: 'link', url, name: linkName.trim() || url },
    ]);
    setLinkUrl('');
    setLinkName('');
  };

  const field =
    'rounded-lg border border-hair bg-ground px-3 py-2 text-sm outline-none focus:border-ink/30 focus:bg-white';

  return (
    <div className="space-y-3">
      {/* 폼 전송 시 함께 넘어간다 */}
      <input type="hidden" name="attachments" value={JSON.stringify(items)} />

      <div className="flex items-center gap-2 flex-wrap">
        <UploadButton
          label="＋ 사진 · 동영상"
          accept="image/*,video/*"
          multiple
          onUploaded={(files) =>
            setItems((prev) => [
              ...prev,
              ...files.map((f) => ({
                id: 'm_' + Math.random().toString(36).slice(2, 9),
                type: f.type,
                url: f.url,
                name: f.name,
              })),
            ])
          }
        />
        <span className="text-[11px] text-ink-faint">
          이미지 8MB · 동영상 50MB 까지 · 서버에 저장되어 모두에게 보입니다
        </span>
      </div>

      <div className="flex gap-2 flex-wrap">
        <input
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addLink();
            }
          }}
          placeholder="링크 주소 (https://)"
          className={`flex-1 min-w-[200px] ${field}`}
        />
        <input
          value={linkName}
          onChange={(e) => setLinkName(e.target.value)}
          placeholder="링크 이름 (선택)"
          className={`w-40 ${field}`}
        />
        <button
          type="button"
          onClick={addLink}
          className="text-sm font-bold border border-hair px-3.5 py-2 rounded-lg hover:border-ink/25"
        >
          링크 추가
        </button>
      </div>

      {error && <p className="text-sm text-rose-500">{error}</p>}

      {items.length > 0 && (
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {items.map((a) => (
            <li key={a.id} className="relative">
              {a.type === 'link' ? (
                <div className="w-full h-24 rounded-lg border border-hair bg-ground p-2 flex flex-col justify-center">
                  <p className="text-xs font-bold text-ink truncate">🔗 {a.name}</p>
                  <p className="text-[10px] text-ink-faint truncate">{a.url}</p>
                </div>
              ) : a.type === 'video' ? (
                <video src={a.url} className="w-full h-24 rounded-lg border border-hair object-cover" muted />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.url} alt={a.name ?? ''} className="w-full h-24 rounded-lg border border-hair object-cover" />
              )}
              <button
                type="button"
                onClick={() => setItems(items.filter((x) => x.id !== a.id))}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs grid place-items-center hover:bg-black/80"
                aria-label="첨부 빼기"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
