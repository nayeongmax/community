import { Link } from 'react-router-dom';
import { CommunityStat } from '../lib/store';
import { formatCount } from '../lib/utils';

const KIND_BADGE: Record<string, { label: string; cls: string }> = {
  fan: { label: '❤️ 팬', cls: 'bg-rose-50 text-rose-500' },
  featured: { label: '👑 대표', cls: 'bg-amber-50 text-amber-600' },
};

export default function CommunityCard({ c }: { c: CommunityStat }) {
  const kind = KIND_BADGE[c.kind];
  const topics = c.topics ?? [c.category];
  return (
    <Link
      to={`/c/${c.slug}`}
      className="block bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow"
    >
      <div className="h-16 relative" style={{ background: c.themeColor }}>
        {c.recentPosts > 0 && (
          <span className="absolute top-2 right-2 text-[10px] font-bold bg-white/90 text-rose-500 px-1.5 py-0.5 rounded-full">
            🔥 오늘 +{c.recentPosts}
          </span>
        )}
      </div>
      <div className="p-4 -mt-8">
        <div
          className="w-12 h-12 rounded-xl grid place-items-center text-white text-xl font-black border-2 border-white shadow"
          style={{ background: c.themeColor }}
        >
          {c.name.slice(0, 1)}
        </div>
        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
          <h3 className="font-bold text-slate-800 truncate">{c.name}</h3>
          {kind && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${kind.cls}`}>
              {kind.label}
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-1 flex-wrap">
          {topics.slice(0, 3).map((t) => (
            <span key={t} className="text-[11px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
              {t}
            </span>
          ))}
          {c.region && (
            <span className="text-[11px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded">
              📍 {c.region}
            </span>
          )}
        </div>
        <p className="text-sm text-slate-500 mt-2 line-clamp-2 h-10">{c.description}</p>
        <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
          <span>멤버 {formatCount(c.members)}</span>
          <span>·</span>
          <span>글 {formatCount(c.posts)}</span>
        </div>
      </div>
    </Link>
  );
}
