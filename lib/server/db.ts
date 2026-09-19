// 서버 데이터 계층
//
// 검색로봇이 글을 읽으려면 글이 "서버에" 있어야 한다.
// 그래서 커뮤니티·게시판·글·댓글·회원은 브라우저가 아니라 여기(서버)에 둔다.
//
// 지금은 파일 한 개(data/db.json)에 담는다. 별도 설치 없이 바로 돌아가고,
// 실제 서비스에서는 아래 read()/write() 두 함수만 Supabase 쿼리로 바꾸면 된다.
// (supabase-schema.sql 에 같은 모양의 테이블이 준비돼 있다)

import { promises as fs } from 'fs';
import path from 'path';
import { DB } from '../types';
import { seedDB } from '../seed';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');

function emptyDB(): DB {
  return { users: [], communities: [], boards: [], memberships: [], posts: [], comments: [] };
}

let cache: DB | null = null;

/** 서버 데이터 읽기 (처음이면 데모 데이터를 만들어 둔다) */
export async function read(): Promise<DB> {
  if (cache) return cache;
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    cache = JSON.parse(raw) as DB;
    return cache;
  } catch {
    const seeded = seedDB(emptyDB());
    await write(seeded);
    return seeded;
  }
}

export async function write(db: DB): Promise<void> {
  cache = db;
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
}

/** 읽고 → 고치고 → 저장 */
export async function mutate<T>(fn: (db: DB) => T | Promise<T>): Promise<T> {
  const db = await read();
  const result = await fn(db);
  await write(db);
  return result;
}

/** 개발 중 파일이 바뀌었을 때 캐시를 버린다 */
export function invalidate(): void {
  cache = null;
}
