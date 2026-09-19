import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import * as store from '../lib/store';
import { CommunityKind, REGIONS, TOPICS } from '../lib/types';
import { EMOJI_CHOICES } from '../lib/emoji';

export default function CreateCommunityPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [topics, setTopics] = useState<string[]>([]);
  const [region, setRegion] = useState<string>('');
  const [kind, setKind] = useState<CommunityKind>('normal');
  const [isPublic, setIsPublic] = useState(true);
  const [emoji, setEmoji] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const toggleTopic = (t: string) => {
    setTopics((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : prev.length >= 3 ? prev : [...prev, t]
    );
  };

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-ink-mute mb-3">커뮤니티를 만들려면 로그인이 필요합니다.</p>
        <button
          onClick={() => navigate('/login')}
          className="bg-ink text-white font-bold px-5 py-2.5 rounded-lg"
        >
          로그인하러 가기
        </button>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (name.trim().length < 2) return setError('커뮤니티 이름은 2자 이상 입력해주세요.');
    if (topics.length === 0) return setError('주제를 1개 이상 선택해주세요.');
    setBusy(true);
    try {
      const c = await store.createCommunity({
        name,
        description,
        topics,
        emoji: emoji || undefined,
        region: region || undefined,
        kind,
        ownerId: user.id,
        isPublic,
      });
      navigate(`/c/${c.slug}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-black text-ink mb-1">커뮤니티 개설</h1>
      <p className="text-sm text-ink-mute mb-6">
        관심사에 맞는 커뮤니티를 만들어보세요. 개설하면 자동으로 운영자가 되고, 공지·자유게시판이
        기본으로 생성됩니다.
      </p>
      <form onSubmit={submit} className="bg-white rounded-2xl border border-hair p-6 space-y-5">
        <div>
          <label className="block text-sm font-bold text-ink-soft mb-1.5">커뮤니티 이름 *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 오늘의 유머"
            maxLength={30}
            className="w-full border border-hair rounded-lg px-3 py-2.5 outline-none focus:ring-2 ring-ink/20"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-ink-soft mb-1.5">
            대표 이모지{' '}
            <span className="text-ink-faint font-normal">(안 고르면 자동으로 배정됩니다)</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {EMOJI_CHOICES.slice(0, 18).map((e) => (
              <button
                type="button"
                key={e}
                onClick={() => setEmoji(emoji === e ? '' : e)}
                className={`w-9 h-9 rounded-lg text-lg grid place-items-center border transition-colors ${
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
            주제 <span className="text-ink-faint font-normal">(최대 3개 · 여러 주제 페이지에 노출됩니다)</span>
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
                    on
                      ? 'bg-ink text-white border-ink'
                      : 'bg-white text-ink-mute border-hair hover:border-ink/25'
                  }`}
                >
                  {on ? '✓ ' : ''}
                  {t}
                </button>
              );
            })}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-bold text-ink-soft mb-1.5">지역 (선택)</label>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full border border-hair rounded-lg px-3 py-2.5 outline-none focus:ring-2 ring-ink/20 bg-white text-sm"
            >
              <option value="">지역 없음</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-ink-soft mb-1.5">유형</label>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as CommunityKind)}
              className="w-full border border-hair rounded-lg px-3 py-2.5 outline-none focus:ring-2 ring-ink/20 bg-white text-sm"
            >
              <option value="normal">일반</option>
              <option value="fan">팬커뮤니티</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-bold text-ink-soft mb-1.5">소개</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="어떤 커뮤니티인지 소개해주세요."
            rows={3}
            maxLength={200}
            className="w-full border border-hair rounded-lg px-3 py-2.5 outline-none focus:ring-2 ring-ink/20 resize-none"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            className="w-4 h-4"
          />
          누구나 검색/열람 가능한 공개 커뮤니티
        </label>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          disabled={busy}
          className="w-full bg-ink text-white font-bold py-3 rounded-lg hover:bg-ink-soft disabled:opacity-60"
        >
          {busy ? '개설 중…' : '커뮤니티 개설하기'}
        </button>
      </form>
    </div>
  );
}
