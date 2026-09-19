/** 사이트 기본 정보 — canonical·사이트맵·RSS 에서 공통으로 쓴다 */
export const site = {
  name: process.env.NEXT_PUBLIC_SITE_NAME || '커뮤니티',
  /** 배포 도메인. 없으면 상대 경로로 동작한다 */
  url: (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/+$/, ''),
  description:
    '누구나 커뮤니티를 개설하고 자유롭게 글을 쓰고 소통하는 오픈 커뮤니티 플랫폼.',
};

/** 본문에서 검색 결과에 쓸 요약을 뽑는다 */
export function summarize(text: string, max = 155): string {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length <= max ? flat : flat.slice(0, max - 1) + '…';
}
