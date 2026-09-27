// 운영자 계정 만들기 / 비밀번호 바꾸기
//
//   npm run admin                       .env.local 의 ADMIN_ID · ADMIN_PASSWORD 사용
//   npm run admin -- --id admin --password '비밀번호'
//
// 비밀번호는 scrypt 로 해시해서 넣습니다. 원문은 저장되지 않습니다.
// 이미 있는 아이디면 비밀번호만 바꿉니다.
//
// ⚠️ 비밀번호를 명령줄에 직접 쓰면 셸 기록에 남습니다.
//    되도록 .env.local 에 ADMIN_PASSWORD 를 넣고 인자 없이 실행하세요.

import { createClient } from '@supabase/supabase-js';
import { randomBytes, scrypt } from 'node:crypto';
import { promisify } from 'node:util';
import { loadEnv, supabaseKey } from './env.mjs';

loadEnv();

const scryptAsync = promisify(scrypt);

/** lib/server/password.ts 와 같은 형식이어야 한다 */
async function hashPassword(plain) {
  const salt = randomBytes(16);
  const key = await scryptAsync(plain, salt, 64);
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}

/** --id / --password 읽기 */
function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const url = process.env.SUPABASE_URL;
const key = supabaseKey();
const loginId = (arg('id') ?? process.env.ADMIN_ID ?? 'admin').trim();
const password = arg('password') ?? process.env.ADMIN_PASSWORD;
const name = arg('name') ?? process.env.ADMIN_NAME ?? '운영자';

if (!url || !key) {
  console.error('SUPABASE_URL / SUPABASE_SECRET_KEY 가 없습니다. .env.local 을 확인하세요.');
  process.exit(1);
}
if (!password) {
  console.error(
    '비밀번호가 없습니다.\n' +
      '  .env.local 에 ADMIN_PASSWORD=... 를 넣고 다시 실행하거나,\n' +
      "  npm run admin -- --password '비밀번호' 로 실행하세요."
  );
  process.exit(1);
}
if (password.length < 8) {
  console.error('비밀번호는 8자 이상으로 정해 주세요.');
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

const { data: existing, error: findError } = await sb
  .from('users')
  .select('id, login_id, nickname')
  .ilike('login_id', loginId)
  .maybeSingle();

if (findError) {
  console.error('조회 실패:', findError.message);
  console.error('supabase-migration-02-login-id.sql 을 먼저 실행했는지 확인하세요.');
  process.exit(1);
}

const hashed = await hashPassword(password);

if (existing) {
  const { error } = await sb.from('users').update({ password: hashed }).eq('id', existing.id);
  if (error) {
    console.error('비밀번호 변경 실패:', error.message);
    process.exit(1);
  }
  console.log(`'${existing.login_id}' 계정의 비밀번호를 바꿨습니다.`);
} else {
  const id = `u_${randomBytes(6).toString('hex')}`;
  const { error } = await sb.from('users').insert({
    id,
    login_id: loginId,
    name,
    nickname: loginId,
    password: hashed,
    avatar_color: '#14172b',
    created_at: new Date().toISOString(),
  });
  if (error) {
    console.error('계정 만들기 실패:', error.message);
    process.exit(1);
  }
  console.log(`'${loginId}' 운영자 계정을 만들었습니다.`);
}

console.log(
  `\n이 아이디가 운영자로 인정되려면 SITE_ADMIN_ID 가 '${loginId}' 여야 합니다.` +
    (loginId === 'admin' ? " ('admin' 은 기본값이라 따로 넣지 않아도 됩니다)" : '')
);
