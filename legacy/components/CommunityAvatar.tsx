import { communityEmoji } from '../lib/emoji';
import { useMediaUrl } from './MediaImage';

interface Props {
  /** 이모지를 정하는 데 쓰는 고유값 (slug) */
  slug: string;
  emoji?: string;
  /** 운영자가 올린 대표 사진 (있으면 이모지 대신 쓴다) */
  mediaId?: string;
  size?: number;
  className?: string;
}

/** 커뮤니티 대표 이미지 — 사진 > 직접 고른 이모지 > slug 로 자동 배정한 이모지 */
export default function CommunityAvatar({ slug, emoji, mediaId, size = 44, className = '' }: Props) {
  const url = useMediaUrl(mediaId);
  const box = `inline-grid place-items-center rounded-xl bg-ground border border-hair shrink-0 select-none overflow-hidden ${className}`;

  if (url) {
    return (
      <span style={{ width: size, height: size }} className={box}>
        <img src={url} alt="" className="w-full h-full object-cover" />
      </span>
    );
  }
  return (
    <span style={{ width: size, height: size, fontSize: size * 0.5 }} className={box}>
      {emoji || communityEmoji(slug)}
    </span>
  );
}
