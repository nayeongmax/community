import { useRef, useState } from 'react';
import { Attachment } from '../lib/types';
import { putMedia, formatBytes, VIDEO_MAX_BYTES } from '../lib/media';
import { useMediaUrl } from './MediaImage';

/** 글에 붙일 이미지·동영상·링크를 고르는 영역 */
export default function AttachmentEditor({
  items,
  onChange,
}: {
  items: Attachment[];
  onChange: (next: Attachment[]) => void;
}) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkName, setLinkName] = useState('');
  const fileRef = useRef<HTMLInputElement | null>(null);

  const addFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError('');
    setBusy(true);
    try {
      const added: Attachment[] = [];
      for (const file of Array.from(files)) {
        const meta = await putMedia(file);
        added.push({
          id: meta.id,
          type: meta.type.startsWith('video/') ? 'video' : 'image',
          mediaId: meta.id,
          name: meta.name,
        });
      }
      onChange([...items, ...added]);
    } catch (err) {
      setError(err instanceof Error ? err.message : '파일을 올리지 못했습니다.');
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const addLink = () => {
    const url = linkUrl.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
      setError('링크는 http:// 또는 https:// 로 시작해야 합니다.');
      return;
    }
    setError('');
    onChange([
      ...items,
      { id: 'l_' + Date.now().toString(36), type: 'link', url, name: linkName.trim() || url },
    ]);
    setLinkUrl('');
    setLinkName('');
  };

  const remove = (id: string) => onChange(items.filter((a) => a.id !== id));

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="text-sm font-bold border border-hair px-3.5 py-2 rounded-lg hover:border-ink/25 disabled:opacity-50"
        >
          {busy ? '올리는 중…' : '＋ 사진 · 동영상'}
        </button>
        <span className="text-[11px] text-ink-faint">
          이미지는 가로 1400px 로 줄여 저장 · 동영상 {formatBytes(VIDEO_MAX_BYTES)} 까지
        </span>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
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
          className="flex-1 min-w-[200px] rounded-lg border border-hair bg-ground px-3 py-2 text-sm outline-none focus:border-ink/30 focus:bg-white"
        />
        <input
          value={linkName}
          onChange={(e) => setLinkName(e.target.value)}
          placeholder="링크 이름 (선택)"
          className="w-40 rounded-lg border border-hair bg-ground px-3 py-2 text-sm outline-none focus:border-ink/30 focus:bg-white"
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
              <AttachmentThumb item={a} />
              <button
                type="button"
                onClick={() => remove(a.id)}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white text-xs grid place-items-center hover:bg-black/80"
                aria-label="첨부 삭제"
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

function AttachmentThumb({ item }: { item: Attachment }) {
  const url = useMediaUrl(item.mediaId);
  const box = 'w-full h-24 rounded-lg border border-hair overflow-hidden bg-ground';

  if (item.type === 'link') {
    return (
      <div className={`${box} p-2 flex flex-col justify-center`}>
        <p className="text-xs font-bold text-ink truncate">🔗 {item.name}</p>
        <p className="text-[10px] text-ink-faint truncate">{item.url}</p>
      </div>
    );
  }
  if (!url) return <div className={box} />;
  return item.type === 'video' ? (
    <video src={url} className={`${box} object-cover`} muted />
  ) : (
    <img src={url} alt={item.name ?? ''} className={`${box} object-cover`} />
  );
}
