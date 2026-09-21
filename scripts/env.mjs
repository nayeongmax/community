// .env.local / .env 를 읽어 process.env 에 채운다 (스크립트 공용)
import fs from 'node:fs';
import path from 'node:path';

export function loadEnv() {
  for (const file of ['.env.local', '.env']) {
    const p = path.join(process.cwd(), file);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const i = t.indexOf('=');
      if (i < 0) continue;
      const key = t.slice(0, i).trim();
      if (!process.env[key]) process.env[key] = t.slice(i + 1).trim();
    }
  }
}

/** 서버용 비밀 키 — 새 이름(SUPABASE_SECRET_KEY)을 먼저 본다 */
export function supabaseKey() {
  return process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
}
