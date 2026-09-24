import Link from 'next/link';
import { redirect } from 'next/navigation';
import { readAds } from '../../../lib/server/ads';
import { currentUser, isSiteAdmin } from '../../../lib/server/session';
import AdManager from '../../../components/AdManager';

export const metadata = { title: '광고 배너 관리', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function AdsPage() {
  const me = await currentUser();
  if (!me) redirect('/login');

  // 배너는 사이트 전체에 보이므로 운영자만 다룰 수 있다
  if (!(await isSiteAdmin())) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center">
        <p className="text-5xl mb-4">🔒</p>
        <h1 className="text-xl font-black text-ink">운영자만 들어올 수 있는 화면입니다</h1>
        <p className="text-sm text-ink-mute mt-2 leading-relaxed">
          광고 배너는 사이트 전체에 노출되기 때문에 운영자 계정으로만 다룰 수 있어요.
          <br />
          지금 <b className="text-ink">{me.loginId}</b> 아이디로 로그인되어 있습니다.
        </p>
        <Link
          href="/"
          className="inline-block mt-6 bg-ink text-white font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-ink-soft"
        >
          홈으로
        </Link>
      </div>
    );
  }

  const banners = await readAds();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-bold tracking-[0.18em] text-ink-faint">ADS</p>
        <h1 className="text-2xl font-black text-ink mt-1">광고 배너 관리</h1>
        <p className="text-sm text-ink-mute mt-1">
          홈과 게임 랜드에 한 줄에 2개씩 노출됩니다. 목록 순서가 곧 노출 순서예요.
        </p>
      </div>

      <AdManager banners={banners} />

      <p className="text-xs text-ink-faint">
        <Link href="/" className="font-semibold text-ink-mute hover:text-ink">
          홈에서 확인하기 →
        </Link>
        {'  '}
        <Link href="/games" className="font-semibold text-ink-mute hover:text-ink ml-3">
          게임 랜드에서 확인하기 →
        </Link>
      </p>
    </div>
  );
}
