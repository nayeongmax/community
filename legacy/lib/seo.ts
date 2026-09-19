// 검색 노출(SEO)
//
// 네이버·구글 검색에 글 하나하나가 잡히려면 글마다
//  1) 고유 주소   2) 그 글에 맞는 <title>·설명   3) canonical   4) 구조화 데이터
// 가 필요하다. 이 파일이 그 네 가지를 담당한다.
//
// ⚠️ 한계: 이 앱은 브라우저에서 화면을 그리는 SPA 라서, 자바스크립트를 실행하지 않는
// 검색로봇(특히 네이버 Yeti)은 아래 태그를 읽지 못한다. 실제 색인을 받으려면
// 서버 렌더링(SSR)이나 미리 만든 정적 HTML 이 필요하다. README 의 "검색 노출" 참고.

import { useEffect } from 'react';

export interface SeoSettings {
  /** 검색 결과에 보일 사이트 이름 */
  siteName: string;
  /** 실제 서비스 주소 (canonical·사이트맵에 쓰인다) */
  siteUrl: string;
  /** 사이트 기본 설명 */
  description: string;
  /** 네이버 서치어드바이저 소유확인 코드 */
  naverVerify: string;
  /** 구글 서치콘솔 소유확인 코드 */
  googleVerify: string;
}

const SETTINGS_KEY = 'community-seo-v1';

export const DEFAULT_SEO: SeoSettings = {
  siteName: '커뮤니티',
  siteUrl: '',
  description: '누구나 커뮤니티를 개설하고 자유롭게 글을 쓰고 소통하는 오픈 커뮤니티 플랫폼.',
  naverVerify: '',
  googleVerify: '',
};

export function getSeoSettings(): SeoSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...DEFAULT_SEO, ...(JSON.parse(raw) as SeoSettings) };
  } catch {
    /* ignore */
  }
  return DEFAULT_SEO;
}

export function saveSeoSettings(s: SeoSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

/** 설정된 주소가 없으면 지금 접속한 주소를 쓴다 */
export function siteOrigin(): string {
  const s = getSeoSettings();
  const url = s.siteUrl.trim().replace(/\/+$/, '');
  if (url) return url;
  return typeof window === 'undefined' ? '' : window.location.origin;
}

// ---------------- 태그 심기 ----------------

function setTag(selector: string, create: () => HTMLElement, apply: (el: HTMLElement) => void): void {
  let el = document.head.querySelector<HTMLElement>(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  apply(el);
}

function setMeta(name: string, content: string, attr: 'name' | 'property' = 'name'): void {
  if (!content) return;
  setTag(
    `meta[${attr}="${name}"]`,
    () => {
      const m = document.createElement('meta');
      m.setAttribute(attr, name);
      return m;
    },
    (el) => el.setAttribute('content', content)
  );
}

/** 본문에서 검색 결과에 쓸 요약을 뽑는다 */
export function summarize(text: string, max = 155): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length <= max ? flat : flat.slice(0, max - 1) + '…';
}

export interface SeoInput {
  title: string;
  description?: string;
  /** '/c/foo/post/123' 처럼 앞에 / 를 붙인 경로 */
  path?: string;
  type?: 'website' | 'article';
  publishedAt?: string;
  modifiedAt?: string;
  author?: string;
  keywords?: string[];
  /** schema.org 구조화 데이터 */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const JSONLD_ID = 'seo-jsonld';

/** 화면이 바뀔 때마다 그 화면에 맞는 검색용 태그를 심는다 */
export function useSeo(input: SeoInput | null): void {
  const key = JSON.stringify(input);

  useEffect(() => {
    if (!input) return;
    const s = getSeoSettings();
    // 제목이 이미 사이트 이름으로 끝나면 중복해서 붙이지 않는다
    const fullTitle = input.title.endsWith(s.siteName)
      ? input.title
      : `${input.title} - ${s.siteName}`;
    const desc = input.description || s.description;
    const url = siteOrigin() + (input.path ?? window.location.pathname);

    document.title = fullTitle;
    setMeta('description', desc);
    if (input.keywords?.length) setMeta('keywords', input.keywords.join(', '));
    setMeta('author', input.author ?? s.siteName);

    // 검색로봇 안내 — 네이버 Yeti 도 같은 규칙을 따른다
    setMeta('robots', 'index, follow, max-image-preview:large, max-snippet:-1');

    // 소유확인
    if (s.naverVerify) setMeta('naver-site-verification', s.naverVerify);
    if (s.googleVerify) setMeta('google-site-verification', s.googleVerify);

    // 같은 글이 여러 주소로 잡히지 않도록
    setTag(
      'link[rel="canonical"]',
      () => {
        const l = document.createElement('link');
        l.setAttribute('rel', 'canonical');
        return l;
      },
      (el) => el.setAttribute('href', url)
    );

    // 공유 카드 (오픈그래프)
    setMeta('og:site_name', s.siteName, 'property');
    setMeta('og:title', input.title, 'property');
    setMeta('og:description', desc, 'property');
    setMeta('og:type', input.type ?? 'website', 'property');
    setMeta('og:url', url, 'property');
    setMeta('og:locale', 'ko_KR', 'property');
    if (input.publishedAt) setMeta('article:published_time', input.publishedAt, 'property');
    if (input.modifiedAt) setMeta('article:modified_time', input.modifiedAt, 'property');
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', input.title);
    setMeta('twitter:description', desc);

    // 구조화 데이터
    document.getElementById(JSONLD_ID)?.remove();
    if (input.jsonLd) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.id = JSONLD_ID;
      script.textContent = JSON.stringify(input.jsonLd);
      document.head.appendChild(script);
    }

    return () => {
      document.getElementById(JSONLD_ID)?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

// ---------------- 사이트맵 · RSS ----------------

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  priority?: number;
}

export function buildSitemap(entries: SitemapEntry[]): string {
  const origin = siteOrigin();
  const rows = entries
    .map((e) => {
      const parts = [`    <loc>${xmlEscape(origin + e.path)}</loc>`];
      if (e.lastmod) parts.push(`    <lastmod>${e.lastmod.slice(0, 10)}</lastmod>`);
      if (e.changefreq) parts.push(`    <changefreq>${e.changefreq}</changefreq>`);
      if (e.priority !== undefined) parts.push(`    <priority>${e.priority.toFixed(1)}</priority>`);
      return `  <url>\n${parts.join('\n')}\n  </url>`;
    })
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows}\n</urlset>\n`;
}

export interface FeedItem {
  title: string;
  path: string;
  description: string;
  author: string;
  publishedAt: string;
  category?: string;
}

/** 네이버 서치어드바이저에 제출할 수 있는 RSS 2.0 */
export function buildRss(items: FeedItem[]): string {
  const s = getSeoSettings();
  const origin = siteOrigin();
  const rows = items
    .map(
      (it) => `    <item>
      <title>${xmlEscape(it.title)}</title>
      <link>${xmlEscape(origin + it.path)}</link>
      <guid isPermaLink="true">${xmlEscape(origin + it.path)}</guid>
      <description>${xmlEscape(it.description)}</description>
      <author>${xmlEscape(it.author)}</author>${
        it.category ? `\n      <category>${xmlEscape(it.category)}</category>` : ''
      }
      <pubDate>${new Date(it.publishedAt).toUTCString()}</pubDate>
    </item>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${xmlEscape(s.siteName)}</title>
    <link>${xmlEscape(origin)}</link>
    <description>${xmlEscape(s.description)}</description>
    <language>ko</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${rows}
  </channel>
</rss>
`;
}

export function buildRobotsTxt(): string {
  const origin = siteOrigin();
  return `# 검색로봇 안내
User-agent: *
Allow: /

# 네이버
User-agent: Yeti
Allow: /

# 관리·작성 화면은 색인하지 않는다
Disallow: /ads
Disallow: /seo
Disallow: /login
Disallow: /signup
Disallow: /*/write
Disallow: /*/settings

Sitemap: ${origin}/sitemap.xml
`;
}

/** 만든 파일을 내려받게 한다 */
export function downloadText(filename: string, text: string, mime = 'text/plain'): void {
  const blob = new Blob([text], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
