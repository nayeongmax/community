import type { Metadata } from 'next';
import Link from 'next/link';
import { listCommunities } from '../../../../lib/server/queries';
import { REGIONS, TOPICS } from '../../../../lib/types';
import { communityEmoji } from '../../../../lib/emoji';

type Mode = 'topic' | 'region' | 'fan' | 'featured';

const META: Record<Mode, { title: string; desc: string }> = {
  topic: { title: '주제별 커뮤니티', desc: '관심 주제로 커뮤니티를 찾아보세요.' },
  region: { title: '지역별 커뮤니티', desc: '내 동네·지역 커뮤니티를 찾아보세요.' },
  fan: { title: '팬클럽', desc: '스타·팀·크리에이터 팬들이 모인 곳.' },
  featured: { title: '대표 커뮤니티', desc: '활발하게 운영되는 대표 커뮤니티.' },
};

interface Props {
  params: Promise<{ mode: string }>;
  searchParams: Promise<{ tab?: string }>;
}

function toMode(m: string): Mode {
  return (['topic', 'region', 'fan', 'featured'] as const).includes(m as Mode)
    ? (m as Mode)
    : 'topic';
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const mode = toMode((await params).mode);
  const tab = (await searchParams).tab;
  const meta = META[mode];
  const title = tab ? `${tab} ${meta.title}` : meta.title;
  return {
    title,
    description: meta.desc,
    keywords: [meta.title, tab].filter(Boolean) as string[],
    alternates: { canonical: `/browse/${mode}${tab ? `?tab=${encodeURIComponent(tab)}` : ''}` },
  };
}

export default async function BrowsePage({ params, searchParams }: Props) {
  const mode = toMode((await params).mode);
  const tab = (await searchParams).tab ?? '';
  const meta = META[mode];
  const all = await listCommunities();
  const tabs: readonly string[] = mode === 'region' ? REGIONS : TOPICS;

  const list = all.filter((c) => {
    if (mode === 'fan') return c.kind === 'fan';
    if (mode === 'featured') return c.kind === 'featured';
    if (mode === 'region') return !tab || c.region === tab;
    return !tab || (c.topics ?? []).includes(tab);
  });

  return (
    <div>
      <p className="text-[11px] font-bold tracking-[0.18em] text-ink-faint">BROWSE</p>
      <h1 className="text-2xl font-black text-ink mt-1">{meta.title}</h1>
      <p className="text-sm text-ink-mute mt-1 mb-4">{meta.desc}</p>

      {(mode === 'topic' || mode === 'region') && (
        <div className="flex gap-2 overflow-x-auto pb-3">
          <Link
            href={`/browse/${mode}`}
            className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-semibold border ${
              !tab ? 'bg-ink text-white border-ink' : 'bg-white text-ink-mute border-hair'
            }`}
          >
            전체
          </Link>
          {tabs.map((t) => (
            <Link
              key={t}
              href={`/browse/${mode}?tab=${encodeURIComponent(t)}`}
              className={`whitespace-nowrap px-3 py-1.5 rounded-full text-sm font-semibold border ${
                tab === t ? 'bg-ink text-white border-ink' : 'bg-white text-ink-mute border-hair'
              }`}
            >
              {t}
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {list.map((c) => (
          <Link
            key={c.id}
            href={`/c/${c.slug}`}
            className="bg-white rounded-xl border border-hair p-4 hover:border-ink/25"
          >
            <span className="w-11 h-11 rounded-xl bg-ground border border-hair grid place-items-center text-lg">
              {c.emoji || communityEmoji(c.slug)}
            </span>
            <h2 className="font-bold text-ink mt-3">{c.name}</h2>
            <p className="text-sm text-ink-mute mt-1 line-clamp-2">{c.description}</p>
            <p className="text-xs text-ink-faint mt-3 tabular-nums">
              멤버 {c.members} · 글 {c.postCount}
            </p>
          </Link>
        ))}
        {list.length === 0 && (
          <p className="col-span-full text-center text-sm text-ink-faint py-12">
            아직 커뮤니티가 없습니다.
          </p>
        )}
      </div>
    </div>
  );
}
