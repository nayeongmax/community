'use client';

import { useActionState, useState } from 'react';
import { createCommunityAction } from '../../../lib/server/actions';
import { REGIONS, TOPICS } from '../../../lib/types';
import { EMOJI_CHOICES } from '../../../lib/emoji';
import SubmitButton from '../../../components/SubmitButton';

export default function CreateCommunityPage() {
  const [state, action] = useActionState(createCommunityAction, {});
  const [topics, setTopics] = useState<string[]>([]);
  const [emoji, setEmoji] = useState('');

  const field =
    'w-full rounded-lg border border-hair bg-ground px-3 py-2.5 outline-none focus:border-ink/30 focus:bg-white';

  const toggleTopic = (t: string) =>
    setTopics((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : prev.length >= 3 ? prev : [...prev, t]
    );

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-black text-ink mb-1">커뮤니티 개설</h1>
      <p className="text-sm text-ink-mute mb-6">
        개설하면 자동으로 운영자가 되고, 공지·자유게시판이 함께 만들어집니다.
      </p>

      <form action={action} className="bg-white rounded-2xl border border-hair p-6 space-y-5">
        {topics.map((t) => (
          <input key={t} type="hidden" name="topics" value={t} />
        ))}
        <input type="hidden" name="emoji" value={emoji} />

        <div>
          <label className="block text-sm font-bold text-ink-soft mb-1.5">커뮤니티 이름 *</label>
          <input name="name" placeholder="예: 오늘의 유머" maxLength={30} className={field} />
        </div>

        <div>
          <label className="block text-sm font-bold text-ink-soft mb-1.5">
            대표 이모지 <span className="text-ink-faint font-normal">(안 고르면 자동 배정)</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
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
        </div>

        <div>
          <label className="block text-sm font-bold text-ink-soft mb-1.5">
            주제 <span className="text-ink-faint font-normal">(최대 3개)</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {TOPICS.map((t) => {
              const on = topics.includes(t);
              return (
                <button
                  type="button"
                  key={t}
                  onClick={() => toggleTopic(t)}
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${
                    on ? 'bg-ink text-white border-ink' : 'bg-white text-ink-mute border-hair'
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-ink-soft mb-1.5">
            지역 <span className="text-ink-faint font-normal">(선택)</span>
          </label>
          <select name="region" className={`${field} text-sm`} defaultValue="">
            <option value="">선택 안 함</option>
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-bold text-ink-soft mb-1.5">소개</label>
          <textarea
            name="description"
            rows={3}
            placeholder="어떤 커뮤니티인지 알려주세요."
            className={`${field} resize-y`}
          />
        </div>

        {state.error && <p className="text-sm text-rose-500">{state.error}</p>}

        <SubmitButton
          className="w-full bg-ink text-white font-bold py-3 rounded-lg hover:bg-ink-soft"
          pendingLabel="만드는 중…"
        >
          커뮤니티 만들기
        </SubmitButton>
      </form>
    </div>
  );
}
