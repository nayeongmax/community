-- ============================================================
-- 광고 배너 — 가로 배너 · 제휴 배너(쿠팡 파트너스 등)
-- ------------------------------------------------------------
-- Supabase SQL Editor 에 붙여넣고 한 번 실행하세요.
-- 여러 번 실행해도 안전합니다.
-- ============================================================

-- 배너 모양: wide(한 줄 전체) / card(한 줄에 2개)
alter table ad_banners add column if not exists size text not null default 'card';

-- 제휴사에서 받은 배너 주소 (iframe). 이미지 배너는 비어 있다.
alter table ad_banners add column if not exists embed text;

-- 이미지 없이 제휴 코드만으로도 등록할 수 있게 한다
alter table ad_banners alter column image drop not null;
alter table ad_banners alter column image set default '';

update ad_banners set size = 'card' where size is null;
