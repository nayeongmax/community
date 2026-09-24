-- ============================================================
-- 커뮤니티 플랫폼 · Supabase 스키마
-- ------------------------------------------------------------
-- 설치 방법
--   1) Supabase 프로젝트 생성
--   2) SQL Editor 에 이 파일 전체를 붙여넣고 실행
--   3) Storage 에 'uploads' 버킷을 만들고 Public 으로 설정
--   4) .env 에 아래 3개를 넣으면 자동으로 Supabase 를 씁니다
--        SUPABASE_URL=https://xxxx.supabase.co
--        SUPABASE_SERVICE_ROLE_KEY=...
--        NEXT_PUBLIC_SITE_URL=https://내도메인
--
-- 이 앱은 서버(Next.js)에서만 DB 에 접근하고, 권한 검사는 서버 코드
-- (lib/server/actions.ts)에서 합니다. 그래서 service_role 키를 쓰고
-- RLS 는 "클라이언트 직접 접근 차단" 용도로만 켜 둡니다.
-- ============================================================

-- ---------- 회원 ----------
create table if not exists users (
  id            text primary key,
  login_id      text unique not null,   -- 로그인 아이디
  name          text,                   -- 이름 (비공개)
  nickname      text unique not null,   -- 화면에 보이는 이름 (가입 시 아이디로 정해진다)
  phone         text,                   -- 연락처 (비공개)
  birthday      text,                   -- 생년월일 YYYY-MM-DD (비공개)
  email         text unique,            -- 예전 계정에만 남아 있다
  password      text not null,          -- scrypt 해시 (lib/server/password.ts)
  avatar_color  text not null default '#6366f1',
  created_at    timestamptz not null default now()
);
create index if not exists users_login_id_idx on users (login_id);

-- ---------- 커뮤니티 ----------
create table if not exists communities (
  id            text primary key,
  slug          text unique not null,
  name          text not null,
  description   text not null default '',
  category      text not null default '기타',
  topics        text[] not null default '{}',
  region        text,
  kind          text not null default 'normal' check (kind in ('normal','fan','featured')),
  theme_color   text not null default '#6366f1',
  emoji         text,
  avatar_url    text,                   -- 대표 이미지 (Storage 주소)
  title_url     text,                   -- 타이틀 이미지 (Storage 주소)
  owner_id      text not null references users(id) on delete cascade,
  is_public     boolean not null default true,
  created_at    timestamptz not null default now()
);
create index if not exists communities_slug_idx on communities (slug);

-- ---------- 게시판 ----------
create table if not exists boards (
  id            text primary key,
  community_id  text not null references communities(id) on delete cascade,
  name          text not null,
  "order"       int not null default 0,
  is_notice     boolean not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists boards_community_idx on boards (community_id);

-- ---------- 멤버십 ----------
create table if not exists memberships (
  id            text primary key,
  community_id  text not null references communities(id) on delete cascade,
  user_id       text not null references users(id) on delete cascade,
  role          text not null default 'member' check (role in ('owner','admin','member')),
  joined_at     timestamptz not null default now(),
  unique (community_id, user_id)
);
create index if not exists memberships_community_idx on memberships (community_id);
create index if not exists memberships_user_idx on memberships (user_id);

-- ---------- 글 ----------
create table if not exists posts (
  id            text primary key,
  community_id  text not null references communities(id) on delete cascade,
  board_id      text not null references boards(id) on delete cascade,
  author_id     text not null references users(id) on delete cascade,
  title         text not null,
  content       text not null default '',
  tags          text[] not null default '{}',
  views         int not null default 0,
  liked_by      text[] not null default '{}',
  disliked_by   text[] not null default '{}',
  attachments   jsonb not null default '[]'::jsonb,   -- 사진·동영상·링크
  pinned        boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz
);
create index if not exists posts_community_idx on posts (community_id, created_at desc);
create index if not exists posts_board_idx on posts (board_id);
create index if not exists posts_created_idx on posts (created_at desc);

-- ---------- 댓글 ----------
create table if not exists comments (
  id            text primary key,
  post_id       text not null references posts(id) on delete cascade,
  author_id     text not null references users(id) on delete cascade,
  content       text not null,
  parent_id     text,
  liked_by      text[] not null default '{}',
  created_at    timestamptz not null default now()
);
create index if not exists comments_post_idx on comments (post_id, created_at);

-- ---------- 익명 자유게시판 ----------
create table if not exists anon_posts (
  id            text primary key,
  category      text not null default '자유',
  nickname      text not null,
  color         text not null,
  title         text not null,
  content       text not null,
  password      text not null,          -- 삭제용 4자리
  author_key    text not null,          -- 브라우저 쿠키로 구분하는 익명 신원
  views         int not null default 0,
  liked_by      text[] not null default '{}',
  score_badge   text,
  created_at    timestamptz not null default now()
);
create index if not exists anon_posts_created_idx on anon_posts (created_at desc);
create index if not exists anon_posts_author_idx on anon_posts (author_key);

create table if not exists anon_comments (
  id            text primary key,
  post_id       text not null references anon_posts(id) on delete cascade,
  nickname      text not null,
  color         text not null,
  content       text not null,
  password      text not null,
  author_key    text not null,
  created_at    timestamptz not null default now()
);
create index if not exists anon_comments_post_idx on anon_comments (post_id, created_at);

-- ---------- 광고 배너 ----------
create table if not exists ad_banners (
  id            text primary key,
  title         text not null,
  image         text not null,          -- Storage 주소
  link          text,
  active        boolean not null default true,
  sort_order    int not null default 0, -- 노출 순서
  created_at    timestamptz not null default now()
);
create index if not exists ad_banners_order_idx on ad_banners (sort_order);

-- ============================================================
-- RLS — 브라우저에서의 직접 접근을 막는다.
-- 서버(Next.js)는 service_role 키를 쓰므로 RLS 를 우회한다.
-- ============================================================
alter table users        enable row level security;
alter table communities  enable row level security;
alter table boards       enable row level security;
alter table memberships  enable row level security;
alter table posts        enable row level security;
alter table comments     enable row level security;
alter table anon_posts   enable row level security;
alter table anon_comments enable row level security;
alter table ad_banners   enable row level security;

-- ============================================================
-- Storage — 업로드 버킷
-- ------------------------------------------------------------
-- 아래 한 줄을 실행하거나, 대시보드에서 'uploads' 버킷을 Public 으로 만드세요.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;
