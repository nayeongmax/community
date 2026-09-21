// 저장소 선택
//
// SUPABASE_URL 과 비밀 키가 있으면 Supabase 를, 없으면 로컬 파일을 쓴다.
// 화면과 동작 코드는 어느 쪽인지 알 필요가 없다.

import { fileRepo } from './file';
import { hasSupabase, supabaseRepo } from './supabase';
import { Repo } from './types';

export const repo: Repo = hasSupabase() ? supabaseRepo : fileRepo;

/** 지금 무엇을 쓰고 있는지 */
export const storageKind: 'supabase' | 'file' = hasSupabase() ? 'supabase' : 'file';

/**
 * 파일 저장은 로컬 개발용이다. 서버리스(Netlify·Vercel)에 올라가면
 * 디스크가 요청마다 초기화되므로 글이 사라진다.
 *
 * 설정이 빠진 채로 배포되면 데모 데이터가 진짜처럼 보여서 알아채기
 * 어렵다. 그래서 배포 환경에서 파일 저장이 걸리면 화면에 띠를 띄우고
 * 서버 로그에도 남긴다.
 */
export const storageMisconfigured =
  storageKind === 'file' && process.env.NODE_ENV === 'production';

if (storageMisconfigured) {
  console.warn(
    '[저장소] Supabase 설정이 없어 임시 저장으로 돌아갑니다. ' +
      '배포 환경변수에 SUPABASE_URL 과 SUPABASE_SECRET_KEY 를 넣어 주세요. ' +
      '지금 쓰는 글은 저장되지 않습니다.'
  );
}

export type { Repo } from './types';
