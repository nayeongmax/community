import { communityEmoji } from '../lib/emoji';

interface Props {
  /** 이모지를 정하는 데 쓰는 고유값 (slug) */
  slug: string;
  emoji?: string;
  size?: number;
  className?: string;
}

/** 커뮤니티 대표 이미지 — 직접 정한 이모지가 없으면 slug 로 자동 배정 */
export default function CommunityAvatar({ slug, emoji, size = 44, className = '' }: Props) {
  return (
    <span
      style={{ width: size, height: size, fontSize: size * 0.5 }}
      className={`inline-grid place-items-center rounded-xl bg-ground border border-hair shrink-0 select-none ${className}`}
    >
      {emoji || communityEmoji(slug)}
    </span>
  );
}
