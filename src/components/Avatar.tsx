import { userEmoji } from '../lib/emoji';

interface Props {
  nickname: string;
  /** 하위호환용 — 더 이상 배경색으로 쓰지 않는다 */
  color?: string;
  size?: number;
  /** 어두운 배경 위에 올릴 때 */
  tone?: 'light' | 'dark';
}

/** 사용자 아바타 — 닉네임으로 항상 같은 이모지를 배정한다 */
export default function Avatar({ nickname, size = 32, tone = 'light' }: Props) {
  return (
    <span
      style={{ width: size, height: size, fontSize: size * 0.52 }}
      className={`inline-grid place-items-center rounded-full shrink-0 select-none ${
        tone === 'dark' ? 'bg-white/10' : 'bg-ground border border-hair'
      }`}
    >
      {userEmoji(nickname)}
    </span>
  );
}
