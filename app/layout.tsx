import type { Metadata } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
import Link from 'next/link';
import { site } from '../lib/site';
import './globals.css';

const noto = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  variable: '--font-noto',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s - ${site.name}` },
  description: site.description,
  robots: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  openGraph: { siteName: site.name, locale: 'ko_KR', type: 'website' },
  twitter: { card: 'summary_large_image' },
  alternates: { types: { 'application/rss+xml': '/rss.xml' } },
  verification: {
    other: {
      // 네이버 서치어드바이저 소유확인 — .env 에 값을 넣으면 붙는다
      ...(process.env.NEXT_PUBLIC_NAVER_VERIFY
        ? { 'naver-site-verification': process.env.NEXT_PUBLIC_NAVER_VERIFY }
        : {}),
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={noto.variable}>
      <body className="font-sans min-h-screen flex flex-col">
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
            </nav>
          </div>
        </header>

        <div className="flex-1 w-full max-w-6xl mx-auto px-4 py-6">{children}</div>

        <footer className="border-t border-hair bg-white py-7 text-center text-xs text-ink-faint">
          누구나 만드는 오픈 커뮤니티 플랫폼
        </footer>
      </body>
    </html>
  );
}
