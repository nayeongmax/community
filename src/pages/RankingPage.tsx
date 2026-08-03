import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as store from '../lib/store';
import { CommunityStat } from '../lib/store';
import { formatCount } from '../lib/utils';

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
    <section className="bg-white rounded-2xl border border-slate-200 p-4">
      <h2 className="font-bold text-slate-800 mb-3">{board.title}</h2>
      {ranked.length === 0 ? (
        <p className="text-sm text-slate-400 py-6 text-center">아직 데이터가 없어요.</p>
      ) : (
        <ol className="space-y-1">
          {ranked.map(({ c, v }, i) => (
            <li key={c.id}>
              <Link
                to={`/c/${c.slug}`}
                className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-50"
              >
                <span className="w-6 text-center font-black text-slate-400">
                  {MEDAL[i] ?? i + 1}
                </span>
                <span
                  className="w-8 h-8 rounded-lg grid place-items-center text-white text-sm font-black shrink-0"
                  style={{ background: c.themeColor }}
                >
                  {c.name.slice(0, 1)}
                </span>
                <span className="font-semibold text-slate-800 truncate flex-1">{c.name}</span>
                <span className="text-sm font-bold text-indigo-600 shrink-0">
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
        <h1 className="text-xl font-black text-slate-800">🏆 커뮤니티 랭킹</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          커뮤니티끼리 실시간으로 경쟁합니다. 우리 커뮤니티를 키워보세요!
        </p>
      </div>
      {loading ? (
        <p className="text-center text-slate-400 py-16">불러오는 중…</p>
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
