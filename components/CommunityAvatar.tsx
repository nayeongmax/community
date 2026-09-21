import { communityEmoji } from '../lib/emoji';

/**
 * 커뮤니티 대표 이미지.
 * 운영자가 사진을 올렸으면 사진을, 아니면 이모지를 보여 준다.
 */
export default function CommunityAvatar({
  slug,
  emoji,
  avatarUrl,
  size = 38,
  className = '',
}: {
  slug: string;
  emoji?: string | null;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
}) {
  const box = `shrink-0 rounded-lg border border-hair bg-ground grid place-items-center overflow-hidden ${className}`;
  const style = { width: size, height: size };

  if (avatarUrl) {
    return (
      <span className={box} style={style}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatarUrl} alt="" className="w-full h-full object-cover" loading="lazy" />
      </span>
    );
  }
  return (
    <span className={box} style={{ ...style, fontSize: Math.round(size * 0.5) }}>
      {emoji || communityEmoji(slug)}
    </span>
  );
}
