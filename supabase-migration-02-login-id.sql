-- ============================================================
-- 회원 정보 변경 — 이메일 로그인 → 아이디 로그인
-- ------------------------------------------------------------
-- Supabase SQL Editor 에 붙여넣고 한 번 실행하세요.
-- 이미 실행했다면 다시 실행해도 아무 일도 일어나지 않습니다.
-- ============================================================

-- 새 항목
alter table users add column if not exists login_id text;  -- 로그인 아이디
alter table users add column if not exists name     text;  -- 이름 (비공개)
alter table users add column if not exists phone    text;  -- 연락처 (비공개)
alter table users add column if not exists birthday text;  -- 생년월일 (비공개)

-- 이메일은 이제 받지 않는다. 예전 계정에만 남아 있으므로 필수 해제.
alter table users alter column email drop not null;

-- 기존 계정에 아이디를 채워 넣는다 (이메일 앞부분 → 없으면 id 뒷자리)
update users
   set login_id = coalesce(nullif(split_part(email, '@', 1), ''), right(id, 8))
 where login_id is null;

update users set name = nickname where name is null;

-- 아이디는 중복될 수 없다
create unique index if not exists users_login_id_key on users (login_id);

-- 이름은 겹칠 수 있으므로 login_id 만 유일하면 된다
alter table users alter column login_id set not null;
