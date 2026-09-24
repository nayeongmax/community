import Link from 'next/link';
import { redirect } from 'next/navigation';
import { repo } from '../../../lib/server/repo';
import { listCommunities } from '../../../lib/server/queries';
import { currentUser } from '../../../lib/server/session';
import { communityEmoji, userEmoji } from '../../../lib/emoji';

export const metadata = { title: '내 정보', robots: { index: false } };

export default async function MyPage() {
  const me = await currentUser();
  if (!me) redirect('/login');

  const [all, memberships, myPosts] = await Promise.all([
    listCommunities(),
    repo.listMembershipsOfUser(me.id),
    repo.listPostsOfAuthor(me.id),
  ]);
  const mine = memberships
    .map((m) => ({ role: m.role, community: all.find((c) => c.id === m.communityId)! }))
    .filter((x) => x.community);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl border border-hair p-5 flex items-center gap-3">
        <span className="w-14 h-14 rounded-full bg-ground border border-hair grid place-items-center text-2xl">
          {userEmoji(me.nickname)}
        </span>
        <div>
          <h1 className="text-xl font-black text-ink">{me.nickname}</h1>
          <p className="text-sm text-ink-mute">@{me.loginId}</p>
          <p className="text-xs text-ink-faint mt-1 tabular-nums">
            가입한 커뮤니티 {mine.length} · 쓴 글 {myPosts.length}
          </p>
        </div>
      </div>

      <h2 className="text-[11px] font-bold tracking-[0.14em] text-ink-faint mt-6 mb-2">
        내 커뮤니티
      </h2>
      {mine.length === 0 ? (
        <p className="bg-white border border-hair rounded-xl py-10 text-center text-sm text-ink-mute">
          아직 가입한 커뮤니티가 없습니다.
        </p>
      ) : (
        <ul className="space-y-2">
          {mine.map(({ community: c, role }) => (
            <li key={c.id}>
              <Link
                href={`/c/${c.slug}`}
                className="flex items-center gap-3 bg-white rounded-xl border border-hair p-3 hover:border-ink/25"
              >
                <span className="w-10 h-10 rounded-xl bg-ground border border-hair grid place-items-center">
                  {c.emoji || communityEmoji(c.slug)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-bold text-ink truncate">{c.name}</span>
                  <span className="block text-xs text-ink-faint tabular-nums">
                    멤버 {c.members} · 글 {c.postCount}
                  </span>
                </span>
                {role === 'owner' && (
                  <span className="text-[11px] font-bold bg-gold-wash text-gold px-2 py-0.5 rounded-full">
                    운영자
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
