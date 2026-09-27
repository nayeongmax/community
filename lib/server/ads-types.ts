// 광고 배너 타입 — 서버와 화면이 함께 쓴다 (서버 전용 모듈을 끌어오지 않도록 분리)

/** 배너 모양 */
export type BannerSize = 'wide' | 'card';

export interface AdBanner {
  id: string;
  title: string;
  /**
   * 배너 모양
   *   wide — 가로로 길게 한 줄 전체 (쿠팡파트너스 같은 제휴 배너용)
   *   card — 한 줄에 2개 들어가는 네모 배너
   */
  size: BannerSize;
  /** 이미지 주소. 임베드 배너면 비어 있다 */
  image: string;
  /** 제휴사에서 받은 iframe 주소. 있으면 이미지 대신 이걸 띄운다 */
  embed?: string;
  /** 클릭 시 이동할 주소 (임베드 배너는 필요 없다) */
  link?: string;
  active: boolean;
  createdAt: string;
}

/** 모양별 권장 비율 */
export const BANNER_RATIO: Record<BannerSize, string> = {
  // 728×90 같은 가로 배너 (리더보드)
  wide: '8 / 1',
  card: '2 / 1',
};

/** 모양별 안내 문구 */
export const BANNER_HINT: Record<BannerSize, string> = {
  wide: '한 줄 전체 · 권장 8:1 (예 1200×150 · 728×90)',
  card: '한 줄에 2개 · 권장 2:1 (예 800×400)',
};

/**
 * 임베드를 허용하는 제휴사.
 *
 * 아무 주소나 iframe 으로 띄우면 그 사이트가 우리 화면 안에서 무엇이든 할 수
 * 있게 된다. 그래서 알고 있는 제휴사만 넣는다. 다른 곳을 쓰려면 여기에 추가.
 */
export const EMBED_HOSTS = [
  'ads-partners.coupang.com', // 쿠팡 파트너스
  'ad.linkprice.com',         // 링크프라이스
  'click.linkprice.com',
  'googleads.g.doubleclick.net',
  'tpc.googlesyndication.com',
];

/**
 * 제휴 배너의 실제 크기.
 *
 * 이미지와 달리 제휴사 위젯은 정해진 픽셀 크기로 그려진다. 비율만 맞춰
 * 늘리면 안쪽이 잘리므로, 주소에 담긴 width·height 를 그대로 쓴다.
 */
export function embedSize(url: string): { width?: number; height?: number } {
  try {
    const q = new URL(url).searchParams;
    const width = Number(q.get('width'));
    const height = Number(q.get('height'));
    return {
      width: width > 0 ? width : undefined,
      height: height > 0 ? height : undefined,
    };
  } catch {
    return {};
  }
}

/** 크기를 모를 때 쓸 높이 */
export const EMBED_FALLBACK_HEIGHT = 140;

/** 이 주소를 iframe 으로 띄워도 되는가 */
export function isAllowedEmbed(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && EMBED_HOSTS.includes(u.hostname);
  } catch {
    return false;
  }
}

/**
 * 쿠팡 파트너스가 주는 <script> 조각에서 iframe 주소를 뽑아낸다.
 *
 * 파트너스 화면에서 복사하면 아래 같은 코드가 나온다.
 *   <script src="https://ads-partners.coupang.com/g.js"></script>
 *   <script>new PartnersCoupang.G({"id":123456,"template":"carousel",
 *     "trackingCode":"AF1234567","width":"680","height":"140"});</script>
 *
 * 이 코드를 그대로 실행시키는 대신, 같은 내용을 가리키는 iframe 주소로 바꾼다.
 * 남이 준 스크립트를 우리 페이지에서 그대로 돌리지 않기 위해서다.
 *
 * 이미 iframe 주소를 붙여넣었으면 그대로 돌려준다.
 */
export function toEmbedUrl(input: string): string | null {
  const text = input.trim();
  if (!text) return null;

  // 이미 주소만 붙여넣은 경우
  if (/^https:\/\//.test(text) && !text.includes('<')) {
    return isAllowedEmbed(text) ? text : null;
  }

  // <iframe src="..."> 에서 뽑기
  const iframe = text.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  if (iframe) return isAllowedEmbed(iframe[1]) ? iframe[1] : null;

  // 쿠팡 파트너스 스크립트에서 뽑기
  const json = text.match(/PartnersCoupang\.G\(\s*(\{[^)]*\})\s*\)/);
  if (json) {
    try {
      const o = JSON.parse(json[1]) as Record<string, string | number>;
      const q = new URLSearchParams();
      for (const key of ['id', 'template', 'trackingCode', 'subId', 'width', 'height']) {
        if (o[key] !== undefined && o[key] !== null && o[key] !== '') {
          q.set(key, String(o[key]));
        }
      }
      if (!q.get('id')) return null;
      return `https://ads-partners.coupang.com/widgets.html?${q.toString()}`;
    } catch {
      return null;
    }
  }

  return null;
}
