import Link from 'next/link';
import { redirect } from 'next/navigation';
import { readAds } from '../../../lib/server/ads';
import { currentUser } from '../../../lib/server/session';
import AdManager from '../../../components/AdManager';

export const metadata = { title: '광고 배너 관리', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default async function AdsPage() {
  const me = await currentUser();
  if (!me) redirect('/login');

  const banners = await readAds();

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-bold tracking-[0.18em] text-ink-faint">ADS</p>
        <h1 className="text-2xl font-black text-ink mt-1">광고 배너 관리</h1>
        <p className="text-sm text-ink-mute mt-1">
          홈에 한 줄에 2개씩 노출됩니다. 목록 순서가 곧 노출 순서예요.
        </p>
      </div>

      <AdManager banners={banners} />

      <p className="text-xs text-ink-faint">
        <Link href="/" className="font-semibold text-ink-mute hover:text-ink">
          홈에서 확인하기 →
        </Link>
      </p>
    </div>
  );
}
