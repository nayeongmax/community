'use client';

import { useRef, useState } from 'react';
import { uploadAction } from '../lib/server/actions';

/** 파일을 골라 서버에 올리고 주소를 돌려준다 */
export default function UploadButton({
  accept = 'image/*',
  label,
  multiple = false,
  onUploaded,
  className = '',
}: {
  accept?: string;
  label: string;
  multiple?: boolean;
  onUploaded: (files: { url: string; type: 'image' | 'video'; name: string }[]) => void;
  className?: string;
}) {
  const ref = useRef<HTMLInputElement | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const pick = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    setError('');
    const done: { url: string; type: 'image' | 'video'; name: string }[] = [];
    for (const file of Array.from(files)) {
      const form = new FormData();
      form.append('file', file);
      const res = await uploadAction(form);
      if (res.error) {
        setError(res.error);
        break;
      }
      if (res.url && res.type) done.push({ url: res.url, type: res.type, name: res.name ?? '' });
    }
    if (done.length) onUploaded(done);
    setBusy(false);
    if (ref.current) ref.current.value = '';
  };

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={() => ref.current?.click()}
        disabled={busy}
        className={className || 'text-sm font-bold border border-hair px-3.5 py-2 rounded-lg hover:border-ink/25 disabled:opacity-50'}
      >
        {busy ? '올리는 중…' : label}
      </button>
      <input
        ref={ref}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => pick(e.target.files)}
      />
      {error && <span className="text-xs text-rose-500">{error}</span>}
    </span>
  );
}
