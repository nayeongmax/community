import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import * as store from '../lib/store';
import { CommunityStat } from '../lib/store';
import { Community, REGIONS, TOPICS } from '../lib/types';
import CommunityCard from '../components/CommunityCard';

type Mode = 'topic' | 'region' | 'fan' | 'featured';

const META: Record<Mode, { icon: string; title: string; desc: string }> = {
  topic: { icon: '📁', title: '주제별 커뮤니티', desc: '관심 주제로 커뮤니티를 찾아보세요.' },
  region: { icon: '📍', title: '지역별 커뮤니티', desc: '내 동네·지역 커뮤니티를 찾아보세요.' },
  fan: { icon: '❤️', title: '인기 팬커뮤니티', desc: '스타·팀·크리에이터 팬들이 모인 곳.' },
  featured: { icon: '👑', title: '대표 커뮤니티', desc: '활발하게 운영되는 대표 커뮤니티.' },
};

const SORTS: [store.CommunitySort, string][] = [
  ['trend', '지금 뜨는'],
  ['members', '멤버순'],
  ['active', '활발한'],
  ['new', '신규'],
];

export default function BrowsePage() {
  const { mode: rawMode } = useParams();
  const mode = (['topic', 'region', 'fan', 'featured'].includes(rawMode ?? '')
    ? rawMode
    : 'topic') as Mode;
  const meta = META[mode];

  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') ?? '';
  const sort = (params.get('sort') as store.CommunitySort) ?? 'trend';

  const [list, setList] = useState<CommunityStat[]>([]);
  const [loading, setLoading] = useState(true);

  // 가로 슬라이드 탭 목록 (지역별이면 지역, 그 외엔 주제)
  const tabs = useMemo<readonly string[]>(
    () => (mode === 'region' ? REGIONS : TOPICS),
    [mode]
  );

  useEffect(() => {
    setLoading(true);
    const kind: Community['kind'] | undefined =
      mode === 'fan' ? 'fan' : mode === 'featured' ? 'featured' : undefined;
    const topic = mode === 'region' ? undefined : tab || undefined;
    const region = mode === 'region' ? tab || undefined : undefined;
    store.listCommunitiesBy({ topic, region, kind, sort }).then((r) => {
      setList(r);
      setLoading(false);
    });
  }, [mode, tab, sort]);

  const setTab = (t: string) => {
    const next = new URLSearchParams(params);
    if (t) next.set('tab', t);
    else next.delete('tab');
    setParams(next);
  };
  const setSort = (s: string) => {
    const next = new URLSearchParams(params);
    next.set('sort', s);
    setParams(next);
  };

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-black text-slate-800">
          {meta.icon} {meta.title}
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">{meta.desc}</p>
      </div>

      {/* 가로 슬라이드 탭 */}
      <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1">
        <button
          onClick={() => setTab('')}
          className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-sm font-semibold border ${
            !tab
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
          }`}
        >
          전체
        </button>
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-sm font-semibold border ${
              tab === t
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* 정렬 */}
      <div className="flex gap-1 text-sm mb-3">
        {SORTS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSort(key)}
            className={`px-3 py-1 rounded-full font-semibold ${
              sort === key ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-slate-400 py-16">불러오는 중…</p>
      ) : list.length === 0 ? (
        <p className="text-center text-slate-400 py-16 text-sm">
          {tab ? `'${tab}' 커뮤니티가 아직 없어요.` : '커뮤니티가 아직 없어요.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((c) => (
            <CommunityCard key={c.id} c={c} />
          ))}
        </div>
      )}
    </div>
  );
}
