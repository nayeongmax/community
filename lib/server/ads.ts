// 광고 배너
//
// 방문자 모두에게 같은 배너가 보여야 하므로 서버에 저장한다.
// 실제 저장은 lib/server/repo 가 맡는다 (파일 또는 Supabase).

import { uid } from '../utils';
import type { AdBanner, BannerSize } from './ads-types';
import { repo } from './repo';

export type { AdBanner, BannerSize } from './ads-types';
export { BANNER_RATIO, BANNER_HINT } from './ads-types';

export async function readAds(): Promise<AdBanner[]> {
  return repo.listAds();
}

export async function listActiveAds(): Promise<AdBanner[]> {
  return (await repo.listAds()).filter((b) => b.active);
}

export function newBanner(input: {
  title: string;
  size: BannerSize;
  image?: string;
  embed?: string;
  link?: string;
}): AdBanner {
  return {
    id: uid('ad_'),
    title: input.title,
    size: input.size,
    image: input.image ?? '',
    embed: input.embed,
    link: input.link,
    active: true,
    createdAt: new Date().toISOString(),
  };
}
