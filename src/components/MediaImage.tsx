import { useEffect, useState } from 'react';
import { mediaUrl } from '../lib/media';

/** IndexedDB 에 저장된 미디어를 보여 준다 (불러오기 전에는 자리만 차지) */
export function useMediaUrl(id?: string): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    if (!id) {
      setUrl(null);
      return;
    }
    mediaUrl(id).then((u) => {
      if (alive) setUrl(u);
    });
    return () => {
      alive = false;
    };
  }, [id]);
  return url;
}

export default function MediaImage({
  id,
  alt,
  className = '',
  style,
}: {
  id?: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const url = useMediaUrl(id);
  if (!url) return <div className={`bg-ground ${className}`} style={style} aria-hidden="true" />;
  return <img src={url} alt={alt} className={className} style={style} loading="lazy" />;
}
