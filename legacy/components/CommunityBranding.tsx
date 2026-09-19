import { useRef, useState } from 'react';
import * as store from '../lib/store';
import { Community } from '../lib/types';
import { EMOJI_CHOICES } from '../lib/emoji';
import { putMedia, deleteMedia, formatBytes } from '../lib/media';
import MediaImage, { useMediaUrl } from './MediaImage';
import CommunityAvatar from './CommunityAvatar';

/**
 * 커뮤니티 꾸미기 — 운영자가 대표 이미지(또는 이모지)와 타이틀 이미지를 정한다.
 * 이미지는 IndexedDB 에 저장하고 커뮤니티에는 id 만 남긴다.
 */
export default function CommunityBranding({
  community,
  onChanged,
}: {
  community: Community;
  onChanged: () => void;
}) {
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<'avatar' | 'title' | null>(null);
  const avatarRef = useRef<HTMLInputElement | null>(null);
  const titleRef = useRef<HTMLInputElement | null>(null);
  const titleUrl = useMediaUrl(community.titleMediaId);

  const upload = async (file: File | undefined, target: 'avatar' | 'title') => {
    if (!file) return;
    setError('');
    setBusy(target);
    try {
      const meta = await putMedia(file);
      const prev = target === 'avatar' ? community.avatarMediaId : community.titleMediaId;
      await store.updateCommunity(
        community.id,
        target === 'avatar' ? { avatarMediaId: meta.id } : { titleMediaId: meta.id }
      );
      if (prev) await deleteMedia(prev).catch(() => undefined);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : '이미지를 올리지 못했습니다.');
    } finally {
      setBusy(null);
    }
  };

  const clearImage = async (target: 'avatar' | 'title') => {
    const prev = target === 'avatar' ? community.avatarMediaId : community.titleMediaId;
    await store.updateCommunity(
      community.id,
      target === 'avatar' ? { avatarMediaId: undefined } : { titleMediaId: undefined }
    );
    if (prev) await deleteMedia(prev).catch(() => undefined);
    onChanged();
  };

  const pickEmoji = async (e: string) => {
    await store.updateCommunity(community.id, { emoji: community.emoji === e ? undefined : e });
    onChanged();
  };

  return (
    <section className="bg-white rounded-2xl border border-hair p-5 mb-4">
      <h2 className="font-bold text-ink mb-1">커뮤니티 꾸미기</h2>
      <p className="text-xs text-ink-mute mb-4">
        대표 이미지와 타이틀 이미지는 이 브라우저에 저장됩니다.
      </p>

      {/* 대표 이미지 */}
      <div className="mb-5">
        <p className="text-sm font-bold text-ink-soft mb-2">대표 이미지</p>
        <div className="flex items-center gap-3 flex-wrap">
          {community.avatarMediaId ? (
            <MediaImage
              id={community.avatarMediaId}
              alt={`${community.name} 대표 이미지`}
              className="w-14 h-14 rounded-xl object-cover border border-hair"
            />
          ) : (
            <CommunityAvatar slug={community.slug} emoji={community.emoji} size={56} />
          )}

          <button
            type="button"
            onClick={() => avatarRef.current?.click()}
            disabled={busy === 'avatar'}
            className="text-sm font-bold border border-hair px-3.5 py-2 rounded-lg hover:border-ink/25 disabled:opacity-50"
          >
            {busy === 'avatar' ? '올리는 중…' : '사진으로 바꾸기'}
          </button>
          {community.avatarMediaId && (
            <button
              type="button"
              onClick={() => clearImage('avatar')}
              className="text-xs text-ink-faint hover:text-rose-500"
            >
              사진 지우고 이모지 쓰기
            </button>
          )}
          <input
            ref={avatarRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => upload(e.target.files?.[0], 'avatar')}
          />
        </div>

        {!community.avatarMediaId && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {EMOJI_CHOICES.slice(0, 18).map((e) => (
              <button
                type="button"
                key={e}
                onClick={() => pickEmoji(e)}
                className={`w-9 h-9 rounded-lg text-lg grid place-items-center border transition-colors ${
                  community.emoji === e ? 'border-ink bg-ground' : 'border-hair hover:border-ink/25'
                }`}
              >
                {e}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 타이틀 이미지 */}
      <div>
        <p className="text-sm font-bold text-ink-soft mb-2">
          타이틀 이미지{' '}
          <span className="text-ink-faint font-normal">(커뮤니티 홈 맨 위에 걸립니다 · 권장 1200×300)</span>
        </p>

        <label
          className="block rounded-xl border border-dashed border-hair bg-ground overflow-hidden cursor-pointer transition-colors hover:border-ink/25"
          style={{ aspectRatio: '4 / 1' }}
          onDragOver={(ev) => ev.preventDefault()}
          onDrop={(ev) => {
            ev.preventDefault();
            upload(ev.dataTransfer.files?.[0], 'title');
          }}
        >
          {titleUrl ? (
            <img src={titleUrl} alt="타이틀 이미지" className="w-full h-full object-cover" />
          ) : (
            <span className="w-full h-full grid place-items-center text-xs text-ink-mute text-center px-3">
              {busy === 'title' ? '올리는 중…' : '이미지 선택 또는 끌어다 놓기'}
            </span>
          )}
          <input
            ref={titleRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => upload(e.target.files?.[0], 'title')}
          />
        </label>

        {community.titleMediaId && (
          <button
            type="button"
            onClick={() => clearImage('title')}
            className="text-xs text-ink-faint hover:text-rose-500 mt-2"
          >
            타이틀 이미지 지우기
          </button>
        )}
      </div>

      {error && <p className="text-sm text-rose-500 mt-3">{error}</p>}
      <p className="text-[11px] text-ink-faint mt-3">
        이미지는 가로 1400px 로 줄여 저장합니다 · 동영상은 {formatBytes(40 * 1024 * 1024)} 까지
      </p>
    </section>
  );
}
