// Supabase 연결 확인
//
//   npm run check
//
// 키를 재발급한 뒤 .env.local 을 고치고 이걸 돌리면
// 연결·테이블·스토리지가 한 번에 확인됩니다.

import { createClient } from '@supabase/supabase-js';
import { loadEnv, supabaseKey } from './env.mjs';

loadEnv();

const url = process.env.SUPABASE_URL;
const key = supabaseKey();

if (!url) {
  console.error('❌ SUPABASE_URL 이 없습니다. .env.local 을 확인하세요.');
  process.exit(1);
}
if (!key) {
  console.error('❌ SUPABASE_SECRET_KEY (또는 SUPABASE_SERVICE_ROLE_KEY) 가 없습니다.');
  process.exit(1);
}

const kind = key.startsWith('sb_secret_') ? '새 형식(sb_secret_…)' : 'JWT 형식(eyJ…)';
console.log(`프로젝트 : ${url}`);
console.log(`키       : ${kind} · 끝 4자리 …${key.slice(-4)}\n`);

const sb = createClient(url, key, { auth: { persistSession: false } });

const TABLES = [
  'users', 'communities', 'boards', 'memberships',
  'posts', 'comments', 'anon_posts', 'anon_comments', 'ad_banners',
];

let bad = 0;
for (const t of TABLES) {
  const { count, error } = await sb.from(t).select('*', { count: 'exact', head: true });
  if (error) {
    bad++;
    console.log(`  ❌ ${t.padEnd(15)} ${error.message}`);
  } else {
    console.log(`  ✅ ${t.padEnd(15)} ${count}행`);
  }
}

const { data: buckets, error: bucketError } = await sb.storage.listBuckets();
if (bucketError) {
  bad++;
  console.log(`\n  ❌ 스토리지  ${bucketError.message}`);
} else {
  const up = buckets.find((b) => b.name === 'uploads');
  if (up) {
    console.log(`\n  ✅ 스토리지  uploads (${up.public ? 'public' : '비공개 — public 으로 바꿔야 합니다'})`);
    if (!up.public) bad++;
  } else {
    bad++;
    console.log('\n  ❌ 스토리지  uploads 버킷이 없습니다.');
  }
}

if (bad) {
  console.log(`\n${bad}곳에 문제가 있습니다.`);
  process.exit(1);
}
console.log('\n모두 정상입니다. 키가 잘 연결됐습니다.');
