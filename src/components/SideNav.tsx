import { Link, useLocation } from 'react-router-dom';
import Icon, { IconName } from './Icon';

interface Item {
  icon: IconName;
  label: string;
  to: string;
  /** 현재 경로가 이 항목과 일치하는지 판단 */
  match: (path: string, search: string) => boolean;
  soon?: boolean;
}

const FEED: Item[] = [
  { icon: 'home', label: '홈', to: '/', match: (p, s) => p === '/' && !s },
  { icon: 'live', label: '실시간', to: '/?sort=new', match: (p, s) => p === '/' && s.includes('sort=new') },
  { icon: 'search', label: '탐색', to: '/explore', match: (p) => p.startsWith('/explore') },
  { icon: 'bookmark', label: '구독', to: '/me', match: (p) => p.startsWith('/me') },
  { icon: 'trending', label: '인기', to: '/?sort=hot', match: (p, s) => p === '/' && s.includes('sort=hot') },
  { icon: 'game', label: '게임 랜드', to: '/games', match: (p) => p.startsWith('/games') },
  { icon: 'chat', label: '채팅', to: '#', match: () => false, soon: true },
];

const BROWSE: Item[] = [
  { icon: 'folder', label: '주제별', to: '/browse/topic', match: (p) => p.startsWith('/browse/topic') },
  { icon: 'pin', label: '지역별', to: '/browse/region', match: (p) => p.startsWith('/browse/region') },
  { icon: 'heart', label: '팬커뮤니티', to: '/browse/fan', match: (p) => p.startsWith('/browse/fan') },
  { icon: 'crown', label: '대표커뮤니티', to: '/browse/featured', match: (p) => p.startsWith('/browse/featured') },
  { icon: 'trophy', label: '랭킹', to: '/ranking', match: (p) => p.startsWith('/ranking') },
];

function Row({ item, active }: { item: Item; active: boolean }) {
  const base =
    'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition-colors';
  if (item.soon) {
    return (
      <div className={`${base} text-ink-faint cursor-default`}>
        <Icon name={item.icon} />
        <span>{item.label}</span>
        <span className="ml-auto text-[10px] border border-hair text-ink-faint px-1.5 py-0.5 rounded">
          곧
        </span>
      </div>
    );
  }
  return (
    <Link
      to={item.to}
      className={`${base} ${
        active ? 'bg-ink text-white' : 'text-ink-mute hover:bg-ground hover:text-ink'
      }`}
    >
      <Icon name={item.icon} />
      <span>{item.label}</span>
    </Link>
  );
}

export default function SideNav() {
  const loc = useLocation();
  const path = loc.pathname;
  const search = loc.search;

  return (
    <nav className="w-full space-y-0.5">
      {FEED.map((it) => (
        <Row key={it.label} item={it} active={it.match(path, search)} />
      ))}
      <div className="my-2 border-t border-hair" />
      {BROWSE.map((it) => (
        <Row key={it.label} item={it} active={it.match(path, search)} />
      ))}
      <Link
        to="/create"
        className="flex items-center justify-center gap-1 mt-3 border border-hair bg-white text-ink text-sm font-bold px-3 py-2.5 rounded-lg hover:border-ink/25"
      >
        + 커뮤니티 만들기
      </Link>
    </nav>
  );
}
