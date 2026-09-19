import { Attachment } from '../lib/types';
import { useMediaUrl } from './MediaImage';

/** 글 본문 아래에 붙는 첨부 — 이미지·동영상은 바로 보이고, 링크는 카드로 */
export default function AttachmentView({ items }: { items?: Attachment[] }) {
  if (!items?.length) return null;

  const media = items.filter((a) => a.type !== 'link');
  const links = items.filter((a) => a.type === 'link');

  return (
    <div className="mt-4 space-y-3">
      {media.map((a) => (
        <MediaBlock key={a.id} item={a} />
      ))}

      {links.map((a) => (
        <a
          key={a.id}
          href={a.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-xl border border-hair bg-white px-3.5 py-3 transition-colors hover:border-ink/25"
        >
          <span className="text-base">🔗</span>
          <span className="min-w-0">
            <span className="block text-sm font-bold text-ink truncate">{a.name}</span>
            <span className="block text-[11px] text-ink-faint truncate">{a.url}</span>
          </span>
          <span className="ml-auto text-xs text-ink-faint shrink-0">열기 →</span>
        </a>
      ))}
    </div>
  );
}

function MediaBlock({ item }: { item: Attachment }) {
  const url = useMediaUrl(item.mediaId);
  if (!url) return <div className="w-full h-40 rounded-xl bg-ground" />;

  return item.type === 'video' ? (
    <video src={url} controls className="w-full rounded-xl border border-hair bg-black" />
  ) : (
    <img
      src={url}
      alt={item.name ?? '첨부 이미지'}
      className="w-full rounded-xl border border-hair"
      loading="lazy"
    />
  );
}
