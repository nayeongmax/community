'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Icon, { IconName } from './Icon';

interface Item {
  icon: IconName;
  label: string;
  href: string;
  /** 현재 경로가 이 항목인지 */
  match: (path: string) => boolean;
  soon?: boolean;
}

const FEED: Item[] = [
  { icon: 'home', label: '홈', href: '/', match: (p) => p === '/' },
  { icon: 'search', label: '탐색', href: '/explore', match: (p) => p.startsWith('/explore') },
  { icon: 'bookmark', label: '구독', href: '/me', match: (p) => p.startsWith('/me') },
  { icon: 'game', label: '게임 랜드', href: '/games', match: (p) => p.startsWith('/games') },
  { icon: 'chat', label: '채팅', href: '#', match: () => false, soon: true },
];

/** 누구나 모임 — 커뮤니티를 찾아다니는 메뉴 */
const GATHER: Item[] = [
  { icon: 'folder', label: '주제별', href: '/browse/topic', match: (p) => p.startsWith('/browse/topic') },
  { icon: 'pin', label: '지역별', href: '/browse/region', match: (p) => p.startsWith('/browse/region') },
  { icon: 'crown', label: '대표커뮤니티', href: '/browse/featured', match: (p) => p.startsWith('/browse/featured') },
  { icon: 'heart', label: '팬클럽', href: '/browse/fan', match: (p) => p.startsWith('/browse/fan') },
  { icon: 'trophy', label: '랭킹', href: '/ranking', match: (p) => p.startsWith('/ranking') },
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
      href={item.href}
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
  const path = usePathname() ?? '/';

  return (
    <nav className="w-full space-y-0.5">
      {FEED.map((it) => (
        <Row key={it.label} item={it} active={it.match(path)} />
      ))}
      <div className="mt-3 mb-1 px-3 pt-3 border-t border-hair">
        <p className="text-[10px] font-bold tracking-[0.16em] text-ink-faint">누구나 모임</p>
      </div>
      {GATHER.map((it) => (
        <Row key={it.label} item={it} active={it.match(path)} />
      ))}
      <Link
        href="/create"
        className="flex items-center justify-center gap-1 mt-3 border border-hair bg-white text-ink text-sm font-bold px-3 py-2.5 rounded-lg hover:border-ink/25"
      >
        + 커뮤니티 만들기
      </Link>
    </nav>
  );
}
