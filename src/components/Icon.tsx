import type { ReactElement } from 'react';

/**
 * 내비게이션용 단색 아이콘.
 * 화면 크롬(내비)은 단색 아이콘, 콘텐츠(주제·커뮤니티)는 이모지로 구분한다.
 */

export type IconName =
  | 'home' | 'live' | 'search' | 'bookmark' | 'trending' | 'game' | 'chat'
  | 'folder' | 'pin' | 'heart' | 'crown' | 'trophy';

const PATHS: Record<IconName, ReactElement> = {
  home: (
    <>
      <path d="M3.5 10.6 12 3.8l8.5 6.8" />
      <path d="M5.8 9.6V20h12.4V9.6" />
      <path d="M10 20v-5h4v5" />
    </>
  ),
  live: <path d="M3 12h3.6l2.2-6 3.4 12 2.4-6H21" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.2" />
      <path d="M15.6 15.6 20.5 20.5" />
    </>
  ),
  bookmark: <path d="M7 4h10a1 1 0 0 1 1 1v15l-6-3.6L6 20V5a1 1 0 0 1 1-1z" />,
  trending: (
    <>
      <path d="M3.5 16.5 9 11l3.5 3.5L20 7" />
      <path d="M15.5 7H20v4.5" />
    </>
  ),
  game: (
    <>
      <path d="M8.2 7.5h7.6a4.2 4.2 0 0 1 4.1 3.3l.8 4a3 3 0 0 1-5.4 2.3l-1-1.3H9.7l-1 1.3a3 3 0 0 1-5.4-2.3l.8-4a4.2 4.2 0 0 1 4.1-3.3z" />
      <path d="M7.4 11.4v2.4M6.2 12.6h2.4" />
      <circle cx="16" cy="12" r=".9" fill="currentColor" stroke="none" />
    </>
  ),
  chat: <path d="M4.5 5h15v9.5h-9L4.5 19V5z" />,
  folder: <path d="M3.5 6.5h5.6l2 2.2h9.4V18H3.5z" />,
  pin: (
    <>
      <path d="M12 20.5s6.4-5.8 6.4-10.2A6.4 6.4 0 0 0 5.6 10.3c0 4.4 6.4 10.2 6.4 10.2z" />
      <circle cx="12" cy="10.2" r="2.2" />
    </>
  ),
  heart: <path d="M12 19.8s-7.3-4.6-7.3-9.5A3.9 3.9 0 0 1 12 7.6a3.9 3.9 0 0 1 7.3 2.7c0 4.9-7.3 9.5-7.3 9.5z" />,
  crown: (
    <>
      <path d="M4 17.5h16" />
      <path d="M4 17.5 3 7.5l5 3.2L12 5l4 5.7 5-3.2-1 10" />
    </>
  ),
  trophy: (
    <>
      <path d="M7.5 4h9v5a4.5 4.5 0 0 1-9 0z" />
      <path d="M7.5 5.5H5a2.3 2.3 0 0 0 2.5 3.8M16.5 5.5H19a2.3 2.3 0 0 1-2.5 3.8" />
      <path d="M12 13.5V17M9 20h6" />
    </>
  ),
};

export default function Icon({ name, className = 'w-[17px] h-[17px]' }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
