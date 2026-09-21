// Supabase 초기 데이터 넣기
//
//   npm run seed                    데모 커뮤니티·글·계정까지 채움 (둘러보기 좋음)
//   npm run seed -- --admin-only    관리자 계정 하나만 만들고 빈 상태로 시작
//   npm run seed -- --reset         기존 데이터를 모두 지우고 다시 넣음
//
// data/db.json · data/board.json · data/ads.json (로컬 파일 모드에서 쓰던 데이터)를
// 그대로 읽어 Supabase 로 옮긴다. public/uploads 의 파일도 Storage 로 함께 올리고
// 주소를 바꿔 준다.
//
// .env.local 의 SUPABASE_URL / SUPABASE_SECRET_KEY 를 씁니다.

import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';
import { loadEnv, supabaseKey } from './env.mjs';

loadEnv();

const url = process.env.SUPABASE_URL;
const key = supabaseKey();
if (!url || !key) {
  console.error('SUPABASE_URL / SUPABASE_SECRET_KEY 가 없습니다. .env.local 을 확인하세요.');
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });
const args = process.argv.slice(2);
const adminOnly = args.includes('--admin-only');
const reset = args.includes('--reset');

const read = (file, fallback) => {
  const p = path.join(process.cwd(), 'data', file);
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : fallback;
};

const db = read('db.json', { users: [], communities: [], boards: [], memberships: [], posts: [], comments: [] });
const board = read('board.json', { posts: [], comments: [] });
const ads = read('ads.json', []);

if (db.users.length === 0) {
  console.error('data/db.json 에 데이터가 없습니다. 먼저 로컬(파일 모드)에서 앱을 한 번 실행하세요.');
  process.exit(1);
}

const TABLES = [
  'anon_comments', 'anon_posts', 'comments', 'posts',
  'memberships', 'boards', 'communities', 'users', 'ad_banners',
];

async function clear() {
  for (const t of TABLES) {
    const { error } = await sb.from(t).delete().neq('id', '___none___');
    if (error) throw new Error(`${t} 비우기 실패: ${error.message}`);
  }
  console.log('기존 데이터를 비웠습니다.');
}

async function insert(table, rows) {
  if (rows.length === 0) return;
  const { error } = await sb.from(table).insert(rows);
  if (error) throw new Error(`${table} 넣기 실패: ${error.message}`);
  console.log(`  ${table.padEnd(14)} ${rows.length}행`);
}

/* ---------- public/uploads → Storage ---------- */
const MIME = {
  svg: 'image/svg+xml', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
  gif: 'image/gif', webp: 'image/webp', mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime',
};
/** '/uploads/x.svg' → Storage 공개 주소 */
const moved = new Map();

async function uploadLocalFiles() {
  const dir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(dir)) return;
  for (const name of fs.readdirSync(dir)) {
    const ext = name.split('.').pop().toLowerCase();
    const body = fs.readFileSync(path.join(dir, name));
    const { error } = await sb.storage.from('uploads')
      .upload(name, body, { contentType: MIME[ext] ?? 'application/octet-stream', upsert: true });
    if (error) throw new Error(`Storage 업로드 실패(${name}): ${error.message}`);
    moved.set(`/uploads/${name}`, sb.storage.from('uploads').getPublicUrl(name).data.publicUrl);
  }
  if (moved.size) console.log(`  Storage        파일 ${moved.size}개`);
}

/** 로컬 업로드 주소를 Storage 주소로 바꾼다 */
const fix = (u) => (u ? moved.get(u) ?? u : u);

/* ---------- 앱 타입 → DB 행 ---------- */
const userRow = (u) => ({
  id: u.id, email: u.email, nickname: u.nickname, password: u.password,
  avatar_color: u.avatarColor, created_at: u.createdAt,
});
const communityRow = (c) => ({
  id: c.id, slug: c.slug, name: c.name, description: c.description ?? '', category: c.category ?? '기타',
  topics: c.topics ?? [], region: c.region ?? null, kind: c.kind ?? 'normal',
  theme_color: c.themeColor ?? '#6366f1', emoji: c.emoji ?? null,
  avatar_url: fix(c.avatarUrl) ?? null, title_url: fix(c.titleUrl) ?? null,
  owner_id: c.ownerId, is_public: c.isPublic !== false, created_at: c.createdAt,
});
const boardRow = (b) => ({
  id: b.id, community_id: b.communityId, name: b.name, order: b.order ?? 0,
  is_notice: !!b.isNotice, created_at: b.createdAt,
});
const membershipRow = (m) => ({
  id: m.id, community_id: m.communityId, user_id: m.userId, role: m.role, joined_at: m.joinedAt,
});
const postRow = (p) => ({
  id: p.id, community_id: p.communityId, board_id: p.boardId, author_id: p.authorId,
  title: p.title, content: p.content ?? '', tags: p.tags ?? [], views: p.views ?? 0,
  liked_by: p.likedBy ?? [], disliked_by: p.dislikedBy ?? [],
  attachments: (p.attachments ?? []).map((a) => ({ ...a, url: fix(a.url) })),
  pinned: !!p.pinned, created_at: p.createdAt, updated_at: p.updatedAt ?? null,
});
const commentRow = (c) => ({
  id: c.id, post_id: c.postId, author_id: c.authorId, content: c.content,
  parent_id: c.parentId ?? null, liked_by: c.likedBy ?? [], created_at: c.createdAt,
});
const anonPostRow = (p) => ({
  id: p.id, category: p.category, nickname: p.nickname, color: p.color, title: p.title,
  content: p.content, password: p.password, author_key: p.authorKey, views: p.views ?? 0,
  liked_by: p.likedBy ?? [], score_badge: p.scoreBadge ?? null, created_at: p.createdAt,
});
const anonCommentRow = (c) => ({
  id: c.id, post_id: c.postId, nickname: c.nickname, color: c.color, content: c.content,
  password: c.password, author_key: c.authorKey, created_at: c.createdAt,
});
const adRow = (a, i) => ({
  id: a.id, title: a.title, image: fix(a.image), link: a.link ?? null,
  active: a.active !== false, sort_order: a.sortOrder ?? i, created_at: a.createdAt,
});

/* ---------- 실행 ---------- */
try {
  if (reset) await clear();

  const { count, error } = await sb.from('users').select('*', { count: 'exact', head: true });
  if (error) throw new Error(`연결 실패: ${error.message}`);
  if (count > 0) {
    console.log(`이미 데이터가 있습니다 (회원 ${count}명). 다시 넣으려면 --reset 을 붙이세요.`);
    process.exit(0);
  }

  if (adminOnly) {
    const admin = db.users.find((u) => u.email === 'admin@demo.com') ?? db.users[0];
    await insert('users', [userRow(admin)]);
    console.log(`\n관리자 계정만 넣었습니다. 로그인: ${admin.email} / ${admin.password}`);
  } else {
    await uploadLocalFiles();
    // 외래 키 순서대로
    await insert('users', db.users.map(userRow));
    await insert('communities', db.communities.map(communityRow));
    await insert('boards', db.boards.map(boardRow));
    await insert('memberships', db.memberships.map(membershipRow));
    await insert('posts', db.posts.map(postRow));
    await insert('comments', db.comments.map(commentRow));
    await insert('anon_posts', board.posts.map(anonPostRow));
    await insert('anon_comments', board.comments.map(anonCommentRow));
    await insert('ad_banners', ads.map(adRow));
    console.log('\n완료했습니다. 로그인: admin@demo.com / 1234');
  }
} catch (err) {
  console.error('\n실패:', err.message);
  process.exit(1);
}
