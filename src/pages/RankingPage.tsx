import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as store from '../lib/store';
import { CommunityStat } from '../lib/store';
import { formatCount } from '../lib/utils';
import CommunityAvatar from '../components/CommunityAvatar';

interface Board {
  key: string;
  title: string;
  metric: (c: CommunityStat) => number;
  suffix: string;
}

const BOARDS: Board[] = [
  { key: 'trend', title: '🔥 지금 뜨는 커뮤니티', metric: (c) => c.trendScore, suffix: 'pt' },
  { key: 'members', title: '👑 멤버 많은 커뮤니티', metric: (c) => c.members, suffix: '명' },
  { key: 'newmem', title: '🆕 오늘 신규회원 급증', metric: (c) => c.recentMembers, suffix: '명' },
  { key: 'comments', title: '💬 댓글 폭발', metric: (c) => c.recentComments, suffix: '개' },
];

const MEDAL = ['🥇', '🥈', '🥉'];

function RankBoard({ board, data }: { board: Board; data: CommunityStat[] }) {
  const ranked = [...data]
    .map((c) => ({ c, v: board.metric(c) }))
    .filter((x) => x.v > 0)
    .sort((a, b) => b.v - a.v)
    .slice(0, 5);

  return (
    <section className="bg-white rounded-2xl border border-hair p-4">
      <h2 className="font-bold text-ink mb-3">{board.title}</h2>
      {ranked.length === 0 ? (
        <p className="text-sm text-ink-faint py-6 text-center">아직 데이터가 없어요.</p>
      ) : (
        <ol className="space-y-1">
          {ranked.map(({ c, v }, i) => (
            <li key={c.id}>
              <Link
                to={`/c/${c.slug}`}
                className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-ground"
              >
                <span className="w-6 text-center font-black text-ink-faint">
                  {MEDAL[i] ?? i + 1}
                </span>
                <CommunityAvatar slug={c.slug} emoji={c.emoji} mediaId={c.avatarMediaId} size={32} />
                <span className="font-semibold text-ink truncate flex-1">{c.name}</span>
                <span className="text-sm font-bold text-gold shrink-0 tabular-nums">
                  {formatCount(Math.round(v))}
                  {board.suffix}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default function RankingPage() {
  const [data, setData] = useState<CommunityStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    store.listCommunitiesWithStats().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <div className="mb-4">
        <p className="text-[11px] font-bold tracking-[0.18em] text-ink-faint">RANKING</p>
        <h1 className="text-2xl font-black text-ink mt-1">커뮤니티 랭킹</h1>
        <p className="text-sm text-ink-mute mt-1">
          커뮤니티끼리 실시간으로 경쟁합니다. 우리 커뮤니티를 키워보세요!
        </p>
      </div>
      {loading ? (
        <p className="text-center text-ink-faint py-16">불러오는 중…</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {BOARDS.map((b) => (
            <RankBoard key={b.key} board={b} data={data} />
          ))}
        </div>
      )}
    </div>
  );
}
