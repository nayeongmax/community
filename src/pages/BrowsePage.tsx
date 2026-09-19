import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import * as store from '../lib/store';
import { CommunityStat } from '../lib/store';
import { Community, REGIONS, TOPICS } from '../lib/types';
import CommunityCard from '../components/CommunityCard';
import { useSeo } from '../lib/seo';

type Mode = 'topic' | 'region' | 'fan' | 'featured';

const META: Record<Mode, { icon: string; title: string; desc: string }> = {
  topic: { icon: '📁', title: '주제별 커뮤니티', desc: '관심 주제로 커뮤니티를 찾아보세요.' },
  region: { icon: '📍', title: '지역별 커뮤니티', desc: '내 동네·지역 커뮤니티를 찾아보세요.' },
  fan: { icon: '❤️', title: '팬클럽', desc: '스타·팀·크리에이터 팬들이 모인 곳.' },
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

  useSeo({
    title: tab ? `${tab} ${meta.title}` : meta.title,
    description: meta.desc,
    path: `/browse/${mode}${tab ? `?tab=${encodeURIComponent(tab)}` : ''}`,
    keywords: [meta.title, tab].filter(Boolean) as string[],
  });

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
        <p className="text-[11px] font-bold tracking-[0.18em] text-ink-faint">BROWSE</p>
        <h1 className="text-2xl font-black text-ink mt-1">{meta.title}</h1>
        <p className="text-sm text-ink-mute mt-1">{meta.desc}</p>
      </div>

      {/* 가로 슬라이드 탭 */}
      <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1">
        <button
          onClick={() => setTab('')}
          className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-sm font-semibold border ${
            !tab
              ? 'bg-ink text-white border-ink'
              : 'bg-white text-ink-mute border-hair hover:border-ink/25'
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
                ? 'bg-ink text-white border-ink'
                : 'bg-white text-ink-mute border-hair hover:border-ink/25'
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
              sort === key ? 'bg-ink text-white' : 'text-ink-mute hover:bg-ground'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-ink-faint py-16">불러오는 중…</p>
      ) : list.length === 0 ? (
        <p className="text-center text-ink-faint py-16 text-sm">
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
