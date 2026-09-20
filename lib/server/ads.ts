// 광고 배너 (서버 저장)
//
// 방문자 모두에게 같은 배너가 보여야 하므로 서버에 둔다.
// 이미지는 uploads.ts 를 통해 public/uploads 에 저장된다.

import { promises as fs } from 'fs';
import path from 'path';
import { uid } from '../utils';

import type { AdBanner } from './ads-types';
export type { AdBanner } from './ads-types';
export { BANNER_RATIO } from './ads-types';

const FILE = path.join(process.cwd(), 'data', 'ads.json');

let cache: AdBanner[] | null = null;

export async function readAds(): Promise<AdBanner[]> {
  if (cache) return cache;
  try {
    cache = JSON.parse(await fs.readFile(FILE, 'utf8')) as AdBanner[];
  } catch {
    cache = [];
  }
  return cache;
}

export async function writeAds(list: AdBanner[]): Promise<void> {
  cache = list;
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(list, null, 2), 'utf8');
}

export async function listActiveAds(): Promise<AdBanner[]> {
  return (await readAds()).filter((b) => b.active);
}

export function newBanner(input: { title: string; image: string; link?: string }): AdBanner {
  return {
    id: uid('ad_'),
    title: input.title,
    image: input.image,
    link: input.link,
    active: true,
    createdAt: new Date().toISOString(),
  };
}
