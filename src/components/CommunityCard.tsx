import { Link } from 'react-router-dom';
import { CommunityStat } from '../lib/store';
import { formatCount } from '../lib/utils';

const KIND_BADGE: Record<string, { label: string; cls: string }> = {
  fan: { label: '팬', cls: 'bg-ground text-ink-mute border border-hair' },
  featured: { label: '대표', cls: 'bg-gold-wash text-gold' },
};

export default function CommunityCard({ c }: { c: CommunityStat }) {
  const kind = KIND_BADGE[c.kind];
  const topics = c.topics ?? [c.category];
  return (
    <Link
      to={`/c/${c.slug}`}
      className="block bg-white rounded-xl border border-hair p-4 transition-colors hover:border-ink/25"
    >
      <div className="flex items-start gap-3">
        <div
          className="w-11 h-11 rounded-xl grid place-items-center text-white text-lg font-black shrink-0"
          style={{ background: c.themeColor }}
        >
          {c.name.slice(0, 1)}
        </div>
        {c.recentPosts > 0 && (
          <span className="ml-auto text-[10px] font-bold text-gold bg-gold-wash px-2 py-0.5 rounded-full shrink-0 tabular-nums">
            오늘 +{c.recentPosts}
          </span>
        )}
      </div>
      <div>
        <div className="mt-3 flex items-center gap-1.5 flex-wrap">
          <h3 className="font-bold text-ink truncate">{c.name}</h3>
          {kind && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${kind.cls}`}>
              {kind.label}
            </span>
          )}
        </div>
        <div className="mt-1 flex items-center gap-1 flex-wrap">
          {topics.slice(0, 3).map((t) => (
            <span key={t} className="text-[11px] text-ink-faint">
              #{t}
            </span>
          ))}
          {c.region && (
            <span className="text-[11px] text-ink-faint">📍 {c.region}</span>
          )}
        </div>
        <p className="text-sm text-ink-mute mt-2 line-clamp-2 h-10">{c.description}</p>
        <div className="mt-3 flex items-center gap-3 text-xs text-ink-faint tabular-nums">
          <span>멤버 {formatCount(c.members)}</span>
          <span>·</span>
          <span>글 {formatCount(c.posts)}</span>
        </div>
      </div>
    </Link>
  );
}
