'use client';

import { useActionState, useState } from 'react';
import { Community } from '../lib/types';
import { updateCommunityAction } from '../lib/server/actions';
import { EMOJI_CHOICES, communityEmoji } from '../lib/emoji';
import SubmitButton from './SubmitButton';
import UploadButton from './UploadButton';

/** 커뮤니티 꾸미기 — 대표 이미지(사진/이모지)와 타이틀 이미지 */
export default function CommunityBrandingForm({ community }: { community: Community }) {
  const [state, action] = useActionState(updateCommunityAction, {});
  const [emoji, setEmoji] = useState(community.emoji ?? '');
  const [avatarUrl, setAvatarUrl] = useState(community.avatarUrl ?? '');
  const [titleUrl, setTitleUrl] = useState(community.titleUrl ?? '');

  return (
    <form action={action} className="bg-white rounded-2xl border border-hair p-5 space-y-5">
      <input type="hidden" name="communityId" value={community.id} />
      <input type="hidden" name="emoji" value={avatarUrl ? '' : emoji} />
      <input type="hidden" name="avatarUrl" value={avatarUrl} />
      <input type="hidden" name="titleUrl" value={titleUrl} />

      <div>
        <h2 className="font-bold text-ink">커뮤니티 꾸미기</h2>
        <p className="text-xs text-ink-mute mt-1">
          올린 이미지는 서버에 저장되어 방문자 모두에게 보이고, 공유 카드 이미지로도 쓰입니다.
        </p>
      </div>

      {/* 대표 이미지 */}
      <div>
        <p className="text-sm font-bold text-ink-soft mb-2">대표 이미지</p>
        <div className="flex items-center gap-3 flex-wrap">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt="대표 이미지"
              className="w-14 h-14 rounded-xl object-cover border border-hair"
            />
          ) : (
            <span className="w-14 h-14 rounded-xl bg-ground border border-hair grid place-items-center text-2xl">
              {emoji || communityEmoji(community.slug)}
            </span>
          )}

          <UploadButton
            label="사진으로 바꾸기"
            onUploaded={(files) => setAvatarUrl(files[0].url)}
          />
          {avatarUrl && (
            <button
              type="button"
              onClick={() => setAvatarUrl('')}
              className="text-xs text-ink-faint hover:text-rose-500"
            >
              사진 지우고 이모지 쓰기
            </button>
          )}
        </div>

        {!avatarUrl && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {EMOJI_CHOICES.slice(0, 18).map((e) => (
              <button
                type="button"
                key={e}
                onClick={() => setEmoji(emoji === e ? '' : e)}
                className={`w-9 h-9 rounded-lg text-lg grid place-items-center border ${
                  emoji === e ? 'border-ink bg-ground' : 'border-hair hover:border-ink/25'
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
          <span className="text-ink-faint font-normal">(커뮤니티 홈 맨 위 · 권장 1200×300)</span>
        </p>
        {titleUrl ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={titleUrl}
              alt="타이틀 이미지"
              className="w-full rounded-xl border border-hair object-cover"
              style={{ aspectRatio: '4 / 1' }}
            />
            <button
              type="button"
              onClick={() => setTitleUrl('')}
              className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded"
            >
              지우기
            </button>
          </div>
        ) : (
          <div
            className="rounded-xl border border-dashed border-hair bg-ground grid place-items-center"
            style={{ aspectRatio: '4 / 1' }}
          >
            <UploadButton label="타이틀 이미지 올리기" onUploaded={(f) => setTitleUrl(f[0].url)} />
          </div>
        )}
      </div>

      <div>
        <p className="text-sm font-bold text-ink-soft mb-2">소개</p>
        <textarea
          name="description"
          defaultValue={community.description}
          rows={2}
          className="w-full rounded-lg border border-hair bg-ground px-3 py-2.5 text-sm outline-none focus:border-ink/30 focus:bg-white resize-y"
        />
      </div>

      <div className="flex items-center gap-3">
        <SubmitButton className="bg-ink text-white font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-ink-soft">
          저장
        </SubmitButton>
        {state.ok && <span className="text-sm font-bold text-gold">저장했습니다</span>}
        {state.error && <span className="text-sm text-rose-500">{state.error}</span>}
      </div>
    </form>
  );
}
