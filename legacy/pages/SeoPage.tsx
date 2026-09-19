import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import * as store from '../lib/store';
import {
  DEFAULT_SEO,
  SeoSettings,
  buildRobotsTxt,
  buildRss,
  buildSitemap,
  downloadText,
  getSeoSettings,
  saveSeoSettings,
  siteOrigin,
  summarize,
  useSeo,
} from '../lib/seo';

/** 검색 노출(SEO) 설정과 제출 파일 만들기 */
export default function SeoPage() {
  useSeo({ title: '검색 노출 설정', path: '/seo' });

  const [form, setForm] = useState<SeoSettings>(DEFAULT_SEO);
  const [saved, setSaved] = useState(false);
  const [counts, setCounts] = useState({ communities: 0, posts: 0 });

  useEffect(() => {
    setForm(getSeoSettings());
    (async () => {
      const [cs, ps] = [await store.listCommunities(), await store.listFeed({ limit: 100000 })];
      setCounts({ communities: cs.length, posts: ps.length });
    })();
  }, []);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    saveSeoSettings(form);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  const makeSitemap = async () => {
    const communities = await store.listCommunities();
    const posts = await store.listFeed({ limit: 100000 });
    downloadText(
      'sitemap.xml',
      buildSitemap([
        { path: '/', changefreq: 'hourly', priority: 1 },
        { path: '/explore', changefreq: 'daily', priority: 0.6 },
        { path: '/ranking', changefreq: 'daily', priority: 0.5 },
        ...communities.map((c) => ({
          path: `/c/${c.slug}`,
          changefreq: 'daily' as const,
          priority: 0.8,
        })),
        ...posts.map((p) => ({
          path: `/c/${p.communitySlug}/post/${p.id}`,
          lastmod: p.updatedAt ?? p.createdAt,
          changefreq: 'weekly' as const,
          priority: 0.7,
        })),
      ]),
      'application/xml'
    );
  };

  const makeRss = async () => {
    const posts = (await store.listFeed({ limit: 100000 }))
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      .slice(0, 50);
    downloadText(
      'rss.xml',
      buildRss(
        posts.map((p) => ({
          title: p.title,
          path: `/c/${p.communitySlug}/post/${p.id}`,
          description: summarize(p.content, 300),
          author: p.authorNickname,
          publishedAt: p.createdAt,
          category: p.communityName,
        }))
      ),
      'application/rss+xml'
    );
  };

  const origin = siteOrigin();
  const field = 'w-full rounded-lg border border-hair bg-ground px-3 py-2.5 text-sm outline-none focus:border-ink/30 focus:bg-white';

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-bold tracking-[0.18em] text-ink-faint">SEO</p>
        <h1 className="text-2xl font-black text-ink mt-1">검색 노출 설정</h1>
        <p className="text-sm text-ink-mute mt-1">
          네이버·구글 검색에 <b className="text-ink">글 하나하나가</b> 잡히도록 준비합니다.
        </p>
      </div>

      {/* 가장 중요한 안내 */}
      <section className="rounded-2xl border border-gold/30 bg-gold-wash p-4">
        <p className="font-bold text-ink text-sm">먼저 알아두실 것</p>
        <p className="text-sm text-ink-soft mt-1.5 leading-relaxed">
          지금은 글이 <b>접속한 브라우저에만</b> 저장되는 데모 모드입니다. 검색로봇은 다른 사람의
          브라우저 안을 볼 수 없으니, 이 상태로는 어떤 검색엔진에도 올라가지 않습니다.
          <br />
          네이버에 실제로 노출되려면 <b>① 서버에 글을 저장</b>하고{' '}
          <b>② 글 주소로 접속했을 때 서버가 완성된 HTML을 돌려주도록</b>(SSR) 바꿔야 합니다.
          아래 설정과 파일은 그 준비를 미리 해두는 것으로, 서버를 붙이는 즉시 그대로 쓰입니다.
        </p>
      </section>

      {/* 설정 */}
      <form onSubmit={save} className="bg-white rounded-2xl border border-hair p-5 space-y-4">
        <h2 className="font-bold text-ink">기본 정보</h2>

        <div>
          <label className="block text-sm font-bold text-ink-soft mb-1.5">사이트 이름</label>
          <input
            value={form.siteName}
            onChange={(e) => setForm({ ...form, siteName: e.target.value })}
            className={field}
            placeholder="검색 결과 제목 뒤에 붙습니다"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-ink-soft mb-1.5">
            사이트 주소 <span className="text-ink-faint font-normal">(배포한 도메인)</span>
          </label>
          <input
            value={form.siteUrl}
            onChange={(e) => setForm({ ...form, siteUrl: e.target.value })}
            className={field}
            placeholder="https://example.com"
          />
          <p className="text-[11px] text-ink-faint mt-1">
            canonical 주소와 사이트맵에 쓰입니다. 비워두면 지금 접속한 주소({origin})를 씁니다.
          </p>
        </div>

        <div>
          <label className="block text-sm font-bold text-ink-soft mb-1.5">사이트 설명</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            className={`${field} resize-y`}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-bold text-ink-soft mb-1.5">
              네이버 소유확인 코드
            </label>
            <input
              value={form.naverVerify}
              onChange={(e) => setForm({ ...form, naverVerify: e.target.value })}
              className={field}
              placeholder="서치어드바이저에서 받은 값"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-ink-soft mb-1.5">
              구글 소유확인 코드
            </label>
            <input
              value={form.googleVerify}
              onChange={(e) => setForm({ ...form, googleVerify: e.target.value })}
              className={field}
              placeholder="서치콘솔에서 받은 값"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="bg-ink text-white font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-ink-soft">
            저장
          </button>
          {saved && <span className="text-sm font-bold text-gold">저장했습니다</span>}
        </div>
      </form>

      {/* 제출 파일 */}
      <section className="bg-white rounded-2xl border border-hair p-5">
        <h2 className="font-bold text-ink">검색엔진에 낼 파일</h2>
        <p className="text-sm text-ink-mute mt-1 mb-4">
          지금 이 브라우저에 있는 커뮤니티 {counts.communities}개 · 글 {counts.posts}개로 만듭니다.
        </p>

        <div className="grid sm:grid-cols-3 gap-2">
          <button
            onClick={makeSitemap}
            className="text-left rounded-xl border border-hair p-3 transition-colors hover:border-ink/25"
          >
            <p className="font-bold text-ink text-sm">sitemap.xml</p>
            <p className="text-[11px] text-ink-mute mt-0.5">글 주소 전체 목록 · 내려받기</p>
          </button>
          <button
            onClick={makeRss}
            className="text-left rounded-xl border border-hair p-3 transition-colors hover:border-ink/25"
          >
            <p className="font-bold text-ink text-sm">rss.xml</p>
            <p className="text-[11px] text-ink-mute mt-0.5">최근 글 50개 · 내려받기</p>
          </button>
          <button
            onClick={() => downloadText('robots.txt', buildRobotsTxt())}
            className="text-left rounded-xl border border-hair p-3 transition-colors hover:border-ink/25"
          >
            <p className="font-bold text-ink text-sm">robots.txt</p>
            <p className="text-[11px] text-ink-mute mt-0.5">네이버 Yeti 허용 포함</p>
          </button>
        </div>

        <p className="text-[11px] text-ink-faint mt-3">
          받은 파일을 사이트 최상위에 올리면 {origin}/sitemap.xml 로 열립니다.
        </p>
      </section>

      {/* 절차 */}
      <section className="bg-white rounded-2xl border border-hair p-5">
        <h2 className="font-bold text-ink mb-3">네이버에 글을 올리는 순서</h2>
        <ol className="space-y-3">
          {[
            [
              '서버에 글을 저장하도록 바꾸기',
              '지금은 브라우저에만 저장됩니다. Supabase 같은 백엔드를 붙여 글이 서버에 남아야 검색로봇이 볼 수 있습니다.',
            ],
            [
              '글 주소가 완성된 HTML을 돌려주게 하기',
              '네이버 검색로봇은 자바스크립트를 거의 실행하지 않습니다. Next.js 같은 서버 렌더링으로 옮기거나, 글마다 미리 만든 HTML을 서버가 내려줘야 합니다.',
            ],
            [
              '네이버 서치어드바이저에 사이트 등록',
              'searchadvisor.naver.com 에서 사이트를 추가하고, 위 소유확인 코드를 받아 이 화면에 넣으세요.',
            ],
            [
              'sitemap.xml · rss.xml 제출',
              '서치어드바이저의 [요청 → 사이트맵 제출], [RSS 제출] 에 올립니다. 새 글이 빨리 잡힙니다.',
            ],
            [
              '수집 요청으로 개별 글 밀어넣기',
              '[요청 → 웹페이지 수집] 에 글 주소를 직접 넣으면 그 글만 따로 수집을 요청할 수 있습니다.',
            ],
          ].map(([title, body], i) => (
            <li key={i} className="flex gap-3">
              <span className="w-6 h-6 rounded-full bg-ink text-white text-xs font-black grid place-items-center shrink-0">
                {i + 1}
              </span>
              <div>
                <p className="font-bold text-ink text-sm">{title}</p>
                <p className="text-sm text-ink-mute mt-0.5 leading-relaxed">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* 이미 적용된 것 */}
      <section className="bg-white rounded-2xl border border-hair p-5">
        <h2 className="font-bold text-ink mb-3">이미 적용되어 있는 것</h2>
        <ul className="space-y-1.5 text-sm text-ink-mute">
          {[
            '글마다 고유 주소 (/c/커뮤니티/post/글번호)',
            '글 제목이 그대로 <title> 이 되고, 본문 앞부분이 검색 설명이 됩니다',
            'canonical 주소 — 같은 글이 여러 주소로 중복 색인되지 않습니다',
            '오픈그래프 태그 — 카카오톡·페이스북 공유 시 제목과 설명이 보입니다',
            'schema.org 구조화 데이터 (DiscussionForumPosting · BreadcrumbList)',
            '글에 단 태그가 검색 키워드로 들어갑니다',
          ].map((t) => (
            <li key={t} className="flex gap-2">
              <span className="text-gold">✓</span>
              {t}
            </li>
          ))}
        </ul>
        <p className="text-[11px] text-ink-faint mt-3">
          위 태그는 글을 열었을 때 화면에서 생성됩니다. 자바스크립트를 실행하는 구글 로봇은 읽을 수
          있지만, 네이버 Yeti 는 대부분 읽지 못합니다 — 그래서 2번 단계가 꼭 필요합니다.
        </p>
      </section>

      <p className="text-xs text-ink-faint">
        <Link to="/" className="font-semibold text-ink-mute hover:text-ink">
          ← 홈으로
        </Link>
      </p>
    </div>
  );
}
