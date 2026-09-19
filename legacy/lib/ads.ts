// 광고 배너
//
// 배너는 2개씩 한 줄로 노출되고, 목록 순서가 곧 노출 순서다.
// 이미지는 브라우저에서 줄여 data URL 로 저장한다 (데모: localStorage).

import { uid } from './utils';

export interface AdBanner {
  id: string;
  /** 관리용 이름 · 이미지 대체 텍스트 */
  title: string;
  /** data URL */
  image: string;
  /** 클릭 시 이동할 주소 (없으면 클릭 불가) */
  link?: string;
  /** 꺼두면 화면에 나오지 않는다 */
  active: boolean;
  createdAt: string;
}

const KEY = 'community-ads-v1';

/** 권장 배너 비율 (가로:세로) */
export const BANNER_RATIO = '2 / 1';
/** 저장 시 줄이는 최대 가로 픽셀 */
const MAX_WIDTH = 900;

function read(): AdBanner[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as AdBanner[];
  } catch {
    /* ignore */
  }
  return [];
}

function write(list: AdBanner[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    throw new Error(
      '저장 공간이 가득 찼습니다. 오래된 배너를 지우거나 더 작은 이미지를 올려 주세요.'
    );
  }
}

export async function listBanners(): Promise<AdBanner[]> {
  return read();
}

/** 실제 화면에 노출할 배너만 */
export async function listActiveBanners(): Promise<AdBanner[]> {
  return read().filter((b) => b.active);
}

export async function createBanner(input: {
  title: string;
  image: string;
  link?: string;
}): Promise<AdBanner> {
  const title = input.title.trim();
  if (!title) throw new Error('배너 이름을 입력해 주세요.');
  if (!input.image) throw new Error('이미지를 선택해 주세요.');

  const banner: AdBanner = {
    id: uid('ad_'),
    title,
    image: input.image,
    link: input.link?.trim() || undefined,
    active: true,
    createdAt: new Date().toISOString(),
  };
  const list = read();
  list.push(banner);
  write(list);
  return banner;
}

export async function updateBanner(
  id: string,
  patch: Partial<Pick<AdBanner, 'title' | 'link' | 'active' | 'image'>>
): Promise<void> {
  const list = read().map((b) => (b.id === id ? { ...b, ...patch } : b));
  write(list);
}

export async function deleteBanner(id: string): Promise<void> {
  write(read().filter((b) => b.id !== id));
}

/** 목록에서의 위치를 앞(-1)/뒤(+1)로 한 칸 옮긴다 */
export async function moveBanner(id: string, dir: -1 | 1): Promise<void> {
  const list = read();
  const i = list.findIndex((b) => b.id === id);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  write(list);
}

/**
 * 이미지 파일을 캔버스로 줄여 data URL 로 바꾼다.
 * (원본을 그대로 저장하면 localStorage 가 금방 가득 찬다)
 */
export function fileToImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('이미지 파일만 올릴 수 있습니다.'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('이미지를 읽지 못했습니다.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('이미지를 열지 못했습니다.'));
      img.onload = () => {
        const scale = Math.min(1, MAX_WIDTH / img.width);
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('이미지를 변환하지 못했습니다.'));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        // 투명 배경이 필요한 PNG 는 그대로, 사진은 JPEG 로 압축
        const isPng = file.type === 'image/png';
        resolve(canvas.toDataURL(isPng ? 'image/png' : 'image/jpeg', 0.82));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

/** data URL 의 대략적인 바이트 크기 */
export function approxBytes(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1] ?? '';
  return Math.round((base64.length * 3) / 4);
}

export function formatBytes(n: number): string {
  if (n >= 1024 * 1024) return (n / 1024 / 1024).toFixed(1) + 'MB';
  return Math.max(1, Math.round(n / 1024)) + 'KB';
}
