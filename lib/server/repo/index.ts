// 저장소 선택
//
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 가 있으면 Supabase 를,
// 없으면 로컬 파일을 쓴다. 화면과 동작 코드는 어느 쪽인지 알 필요가 없다.

import { fileRepo } from './file';
import { hasSupabase, supabaseRepo } from './supabase';
import { Repo } from './types';

export const repo: Repo = hasSupabase() ? supabaseRepo : fileRepo;

/** 지금 무엇을 쓰고 있는지 (설정 화면 안내용) */
export const storageKind = hasSupabase() ? 'supabase' : 'file';

export type { Repo } from './types';
