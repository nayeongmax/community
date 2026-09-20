# 커뮤니티 플랫폼 (Community)

누구나 커뮤니티를 개설하고, 게시판을 열고, 자유롭게 글을 쓰고 소통할 수 있는
**오픈 커뮤니티 플랫폼**입니다.

**Next.js 서버 렌더링**으로 동작합니다. 글 하나하나가 고유 주소를 갖고,
검색로봇이 요청하면 자바스크립트 없이도 본문이 담긴 HTML 이 나갑니다.

## ✨ 주요 기능

| 기능 | 어디에 저장되나 |
| --- | --- |
| 커뮤니티 개설·가입, 게시판, 글·댓글·추천 | 서버 |
| 사진·동영상·링크 첨부 | 서버 (`public/uploads`) |
| 커뮤니티 꾸미기 (대표 이미지·타이틀 이미지) | 서버 |
| 익명 자유게시판 | 서버 (익명 신원은 쿠키) |
| 광고 배너 | 서버 |
| 미니게임 12종 기록·XP·마이 랜드 | 브라우저 (개인 기록) |

## 🔎 검색 노출 — 무엇이 달라졌나

예전에는 브라우저가 화면을 그리는 SPA 였습니다. 검색로봇이 글 주소를 요청하면
**빈 껍데기 HTML** 만 받아갔고, 특히 자바스크립트를 거의 실행하지 않는
네이버 `Yeti` 는 글을 전혀 읽을 수 없었습니다.

지금은 글 주소를 요청하면 **서버가 완성된 HTML** 을 돌려줍니다.

```bash
curl -A "Yeti" http://localhost:3000/c/tigers/post/<글번호>
```

이 응답 안에 이미 들어 있는 것:

- `<title>` = 글 제목, `description` = 본문 앞 155자
- 글 본문 전체와 댓글 본문
- `canonical` (중복 색인 방지), 오픈그래프/트위터 카드
- `keywords` = 커뮤니티 이름 · 게시판 · 글에 단 태그
- JSON-LD 구조화 데이터
  - `DiscussionForumPosting` — 본문 · 작성자 · 작성일 · 댓글 · 추천수
  - `BreadcrumbList` — 홈 › 커뮤니티 › 글

관련 코드: `app/c/[slug]/post/[id]/page.tsx` 의 `generateMetadata()` 와 본문 렌더링.

**글을 새로 쓰면 그 즉시** 위 HTML 이 만들어지고 `sitemap.xml` · `rss.xml` 에도 함께 올라갑니다.
(사이트맵은 `force-dynamic` 이라 빌드 시점에 고정되지 않습니다)

### 검색엔진에 제출할 것

| 주소 | 내용 |
| --- | --- |
| `/sitemap.xml` | 커뮤니티·글 전체 주소 (글이 늘면 자동 반영) |
| `/rss.xml` | 최근 글 50개 |
| `/robots.txt` | 네이버 `Yeti` 허용 명시 |

### 네이버 등록 순서

1. 도메인에 배포하고 `.env` 에 `NEXT_PUBLIC_SITE_URL` 을 넣습니다.
2. [네이버 서치어드바이저](https://searchadvisor.naver.com) 에 사이트 등록
3. 소유확인 코드를 `.env` 의 `NEXT_PUBLIC_NAVER_VERIFY` 에 넣고 재배포
4. **요청 → 사이트맵 제출** 에 `https://도메인/sitemap.xml`
5. **요청 → RSS 제출** 에 `https://도메인/rss.xml`
6. 급한 글은 **요청 → 웹페이지 수집** 에 글 주소를 직접 넣습니다

## ✍️ 쓰기 동작 (Server Actions)

글·댓글·추천은 브라우저가 아니라 **서버에서** 처리합니다.
버튼을 숨기는 것만으로는 막히지 않기 때문에, 권한 검사도 서버에서 합니다.

| 동작 | 누가 | 코드 |
| --- | --- | --- |
| 로그인 · 회원가입 · 로그아웃 | 누구나 | `loginAction` · `signupAction` · `logoutAction` |
| 커뮤니티 개설 · 가입/탈퇴 | 로그인 사용자 | `createCommunityAction` · `toggleJoinAction` |
| 글쓰기 | 로그인 사용자 (자동 가입) | `writePostAction` |
| 글 수정 | **작성자만** | `writePostAction` |
| 글 삭제 | **작성자 또는 운영진** | `deletePostAction` |
| 댓글 작성 | 로그인 사용자 | `writeCommentAction` |
| 댓글 삭제 | 작성자 또는 운영진 | `deleteCommentAction` |
| 추천 · 비추천 | 로그인 사용자 | `reactAction` |

모두 `lib/server/actions.ts` 에 있고, 로그인 세션은 쿠키 한 개입니다
(`lib/server/session.ts`). 데모라 비밀번호를 평문 비교하므로, 실제 서비스에서는
Supabase Auth 같은 인증 서비스로 바꿔야 합니다.

## 🚀 실행 방법

```bash
npm install
npm run dev              # http://localhost:3000
npm run build && npm start
```

데모 계정: `admin@demo.com` / `1234`

## 🗄 데이터 저장 방식

검색로봇이 읽어야 하는 데이터(커뮤니티·게시판·글·댓글·회원)는 **서버** 에 둡니다.

- 지금: `data/db.json` 파일 한 개 (`lib/server/db.ts`) — 설치 없이 바로 동작
- 실제 서비스: `read()` / `write()` 두 함수만 Supabase 쿼리로 바꾸면 됩니다.
  같은 모양의 테이블이 `supabase-schema.sql` 에 준비돼 있습니다.

게임 기록·익명 게시판·광고 배너처럼 검색과 무관하고 개인적인 데이터는
브라우저(localStorage / IndexedDB)에 그대로 둡니다.

## 🔧 환경 변수

```
NEXT_PUBLIC_SITE_URL=https://example.com   # canonical · 사이트맵에 쓰임
NEXT_PUBLIC_SITE_NAME=커뮤니티
NEXT_PUBLIC_NAVER_VERIFY=...               # 네이버 소유확인 코드
```

## 📁 구조

```
app/                      # Next.js App Router (서버 렌더링)
├─ layout.tsx             #  공통 레이아웃 · 기본 메타
├─ page.tsx               #  홈 (최신 글 목록)
├─ c/[slug]/page.tsx      #  커뮤니티 홈
├─ c/[slug]/post/[id]/    #  ★ 글 상세 — 검색 노출의 핵심
├─ explore · ranking · browse/[mode]
├─ sitemap.ts · robots.ts · rss.xml/route.ts
lib/
├─ server/db.ts           # 서버 데이터 (Supabase 교체 지점)
├─ server/queries.ts      # 화면용 조회 함수
├─ site.ts · types.ts · seed.ts · utils.ts · emoji.ts
├─ games/ · ads/ · me/ · login · signup · create
components/               # 화면 조각 (client)
games/                    # 미니게임 12종
lib/
├─ server/actions.ts      # 쓰기 동작 (Server Actions) · 권한 검사
├─ server/uploads.ts      # 파일 저장 (S3 교체 지점)
├─ server/board.ts        # 익명 게시판
└─ server/ads.ts          # 광고 배너
```

## 🛠 기술 스택

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · (선택) Supabase

## 🎮 게임 랜드 (`/games`)

미니게임 12종(다트·룰렛·슬롯·복권·파이프·스네이크·브레이크아웃·풍선·반응속도·
짝 맞추기·일반상식 퀴즈·카지노 OX 퀴즈)과 익명 자유게시판이 한 화면에 있습니다.
게임 XP와 게시판 활동을 합쳐 **마이 랜드**가 6단계로 자랍니다.

게임 기록은 개인적인 데이터라 브라우저에 두고, 익명 게시판 글은 서로 보여야 하므로
서버에 저장합니다.
