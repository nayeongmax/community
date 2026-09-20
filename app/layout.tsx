import type { Metadata } from 'next';
import { Noto_Sans_KR } from 'next/font/google';
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
      <body className="font-sans">{children}</body>
    </html>
  );
}
