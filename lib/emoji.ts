// 아바타용 이모지
//
// 커뮤니티/사용자가 직접 정하지 않았을 때, 이름에서 항상 같은 이모지를 뽑아 쓴다.
// (이름 첫 글자를 색 배경에 올리던 방식을 대체)

const COMMUNITY_EMOJI = [
  '🌿', '🍀', '🐝', '🦊', '🐧', '🐳', '🌙', '⛰️', '🎏', '🍊',
  '🧩', '🎧', '📚', '🧭', '☕️', '🍜', '🎬', '🚲', '🪴', '🐙',
  '🌵', '🧶', '🛰️', '🎯', '🪄', '🐤', '🦉', '🍥', '🎿', '🛵',
];

const USER_EMOJI = [
  '🦊', '🐼', '🐧', '🐨', '🐯', '🦁', '🐸', '🐵', '🐰', '🐻',
  '🦄', '🐢', '🐬', '🦋', '🐝', '🐙', '🦕', '🦖', '🐳', '🦔',
];

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h);
  return Math.abs(h);
}

/** 커뮤니티 대표 이모지 */
export function communityEmoji(seed: string): string {
  return COMMUNITY_EMOJI[hash(seed) % COMMUNITY_EMOJI.length];
}

/** 사용자 아바타 이모지 */
export function userEmoji(seed: string): string {
  return USER_EMOJI[hash(seed + '_u') % USER_EMOJI.length];
}

/** 커뮤니티 개설 화면에서 고를 수 있는 목록 */
export const EMOJI_CHOICES = COMMUNITY_EMOJI;
