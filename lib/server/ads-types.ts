// 광고 배너 타입 — 서버와 화면이 함께 쓴다 (서버 전용 모듈을 끌어오지 않도록 분리)

export interface AdBanner {
  id: string;
  title: string;
  /** 이미지 주소 (/uploads/...) */
  image: string;
  /** 클릭 시 이동할 주소 */
  link?: string;
  active: boolean;
  createdAt: string;
}

/** 권장 배너 비율 */
export const BANNER_RATIO = '2 / 1';
