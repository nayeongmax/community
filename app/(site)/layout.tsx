import Link from 'next/link';
import { site } from '../../lib/site';
import { currentUser, isSiteAdmin } from '../../lib/server/session';
import { logoutAction } from '../../lib/server/actions';
import { userEmoji } from '../../lib/emoji';
import SideNav from '../../components/SideNav';


/** 커뮤니티 화면 공통 껍데기 (게임 랜드는 자체 헤더를 써서 이 밖에 있다) */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [me, admin] = await Promise.all([currentUser(), isSiteAdmin()]);
  return (
    <div className="min-h-screen flex flex-col">
        <header className="bg-white border-b border-hair sticky top-0 z-30">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 font-black text-lg shrink-0">
              <span className="w-8 h-8 rounded-lg bg-ink text-white grid place-items-center text-sm">
                C
              </span>
              <span className="hidden sm:block text-ink">{site.name}</span>
            </Link>
            <nav className="ml-auto flex items-center gap-1 text-sm font-semibold text-ink-mute">
              <Link href="/explore" className="px-3 py-2 rounded-lg hover:bg-ground hover:text-ink">
                탐색
              </Link>
              <Link href="/ranking" className="px-3 py-2 rounded-lg hover:bg-ground hover:text-ink">
                랭킹
              </Link>
              <Link
                href="/create"
                className="hidden sm:inline-block bg-ink text-white px-3.5 py-2 rounded-lg font-bold hover:bg-ink-soft"
              >
                커뮤니티 개설
              </Link>
              {me ? (
                <span className="flex items-center gap-1 ml-1">
                  <Link href="/me" className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-ground">
                    <span className="w-7 h-7 rounded-full bg-ground border border-hair grid place-items-center text-sm">
                      {userEmoji(me.nickname)}
                    </span>
                    <span className="hidden sm:block font-bold text-ink">{me.nickname}</span>
                  </Link>
                  <form action={logoutAction}>
                    <button className="text-xs text-ink-faint hover:text-ink px-2 py-1">
                      로그아웃
                    </button>
                  </form>
                </span>
              ) : (
                <Link
                  href="/login"
                  className="ml-1 px-3 py-2 rounded-lg border border-hair font-bold text-ink hover:border-ink/25"
                >
                  로그인
                </Link>
              )}
            </nav>
          </div>
        </header>

        <div className="flex-1 w-full max-w-6xl mx-auto px-4 py-6 flex gap-6">
          <aside className="hidden lg:block w-[184px] shrink-0">
            <div className="sticky top-[72px]">
              <SideNav />
            </div>
          </aside>
          <main className="min-w-0 flex-1">{children}</main>
        </div>

        <footer className="border-t border-hair bg-white py-7 text-center text-xs text-ink-faint">
          <p>누구나 만드는 오픈 커뮤니티 플랫폼</p>
          <p className="mt-2 flex items-center justify-center gap-3">
            <Link href="/games" className="hover:text-ink-mute">
              게임 랜드
            </Link>
            {admin && (
              <>
                <span>·</span>
                <Link href="/ads" className="hover:text-ink-mute">
                  광고 배너
                </Link>
              </>
            )}
            <span>·</span>
            <a href="/rss.xml" className="hover:text-ink-mute">
              RSS
            </a>
          </p>
        </footer>
    </div>
  );
}
