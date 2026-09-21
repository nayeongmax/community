import Link from 'next/link';
import { listAllPosts, listCommunities } from '../../lib/server/queries';
import { listActiveAds } from '../../lib/server/ads';
import { BANNER_RATIO } from '../../lib/server/ads-types';
import { site } from '../../lib/site';
import { communityEmoji } from '../../lib/emoji';
import { timeAgo } from '../../lib/utils';

/** 홈 — 서버에서 최신 글을 그려 검색로봇이 글 목록을 따라 들어갈 수 있게 한다 */
export default async function HomePage() {
  const [posts, communities, ads] = await Promise.all([
    listAllPosts(),
    listCommunities(),
    listActiveAds(),
  ]);

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: site.name,
            url: site.url,
            description: site.description,
          }),
        }}
      />

      <section className="mb-6 pt-2">
        <p className="text-[11px] font-bold tracking-[0.18em] text-ink-faint">COMMUNITY</p>
        <h1 className="mt-2 text-2xl sm:text-[32px] font-black leading-[1.25] text-ink">
          모든 커뮤니티의 이야기가
          <br />한 곳에서 실시간으로
        </h1>
        <p className="mt-2 text-sm text-ink-mute">{site.description}</p>
      </section>

      <section className="mb-5">
        <h2 className="text-[11px] font-bold tracking-[0.14em] text-ink-faint mb-2">커뮤니티</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {communities.map((c) => (
            <Link
              key={c.id}
              href={`/c/${c.slug}`}
              className="flex items-center gap-2.5 bg-white rounded-xl border border-hair p-3 hover:border-ink/25"
            >
              <span className="w-9 h-9 rounded-lg bg-ground border border-hair grid place-items-center">
                {c.emoji || communityEmoji(c.slug)}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-ink truncate">{c.name}</span>
                <span className="block text-[11px] text-ink-faint tabular-nums">
                  글 {c.postCount} · 멤버 {c.members}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {ads.length > 0 && (
        <section className="mb-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-[11px] font-bold tracking-[0.14em] text-ink-faint">광고</h2>
            <Link href="/ads" className="text-xs font-semibold text-ink-mute hover:text-ink">
              배너 관리 →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ads.map((b) => {
              const inner = (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={b.image}
                    alt={b.title}
                    loading="lazy"
                    className="w-full h-full object-cover"
                    style={{ aspectRatio: BANNER_RATIO }}
                  />
                  <span className="absolute top-2 left-2 text-[10px] font-bold bg-black/55 text-white px-1.5 py-0.5 rounded">
                    AD
                  </span>
                </>
              );
              const cls =
                'relative block overflow-hidden rounded-xl border border-hair bg-white hover:border-ink/25';
              return b.link ? (
                <a
                  key={b.id}
                  href={b.link}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className={cls}
                >
                  {inner}
                </a>
              ) : (
                <div key={b.id} className={cls}>
                  {inner}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-[11px] font-bold tracking-[0.14em] text-ink-faint mb-2">최신 글</h2>
        <ul className="bg-white rounded-2xl border border-hair divide-y divide-hair overflow-hidden">
          {posts.slice(0, 30).map((p) => (
            <li key={p.id}>
              <Link
                href={`/c/${p.communitySlug}/post/${p.id}`}
                className="block px-4 py-3 hover:bg-ground"
              >
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] font-bold text-ink-mute">{p.communityName}</span>
                  <span className="text-[11px] text-ink-faint">· {p.boardName}</span>
                </div>
                <h3 className="font-semibold text-ink mt-1">{p.title}</h3>
                <p className="text-xs text-ink-faint mt-1">
                  {p.authorNickname} · {timeAgo(p.createdAt)} · 조회 {p.views}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
