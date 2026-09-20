import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { read } from '../../../../../lib/server/db';
import { getCommunityBySlug, listBoards } from '../../../../../lib/server/queries';
import { currentUser, isManager, myRole } from '../../../../../lib/server/session';
import { userEmoji } from '../../../../../lib/emoji';
import { timeAgo } from '../../../../../lib/utils';
import CommunityBrandingForm from '../../../../../components/CommunityBrandingForm';
import BoardManager from '../../../../../components/BoardManager';

export const metadata = { title: '커뮤니티 관리', robots: { index: false } };

export default async function SettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const me = await currentUser();
  if (!me) redirect('/login');

  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const role = await myRole(community.id);
  if (!isManager(role)) {
    return (
      <div className="text-center py-16 text-ink-faint">
        이 커뮤니티의 운영자만 들어올 수 있습니다.
        <div className="mt-2">
          <Link href={`/c/${slug}`} className="text-ink font-semibold">
            커뮤니티로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  const [boards, db] = await Promise.all([listBoards(community.id), read()]);
  const members = db.memberships
    .filter((m) => m.communityId === community.id)
    .map((m) => ({ ...m, user: db.users.find((u) => u.id === m.userId) }))
    .filter((m) => m.user);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-ink">커뮤니티 관리</h1>
        <Link href={`/c/${slug}`} className="text-sm text-ink-mute font-semibold hover:text-ink">
          ← {community.name}
        </Link>
      </div>

      <CommunityBrandingForm community={community} />
      <BoardManager communityId={community.id} slug={slug} boards={boards} />

      <section className="bg-white rounded-2xl border border-hair p-5">
        <h2 className="font-bold text-ink mb-3">멤버 {members.length}명</h2>
        <ul className="space-y-1">
          {members.map((m) => (
            <li key={m.id} className="flex items-center gap-2.5 px-3 py-2">
              <span className="w-8 h-8 rounded-full bg-ground border border-hair grid place-items-center text-sm">
                {userEmoji(m.user!.nickname)}
              </span>
              <span className="font-semibold text-ink text-sm">{m.user!.nickname}</span>
              <span className="text-xs text-ink-faint">{timeAgo(m.joinedAt)} 가입</span>
              {m.role !== 'member' && (
                <span className="ml-auto text-[11px] font-bold bg-gold-wash text-gold px-2 py-0.5 rounded-full">
                  {m.role === 'owner' ? '운영자' : '관리자'}
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
