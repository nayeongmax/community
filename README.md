# 커뮤니티 플랫폼 (Community)

누구나 커뮤니티를 개설하고, 게시판을 열고, 자유롭게 글을 쓰고 소통할 수 있는
**오픈 커뮤니티 플랫폼**입니다. (네이버 카페 + 디시인사이드 / 뽐뿌 / 보배드림 스타일)

## ✨ 주요 기능

- **회원가입 / 로그인** — 이메일 + 닉네임
- **커뮤니티 개설** — 누구나 이름·카테고리·소개를 정해 커뮤니티를 만들 수 있음
- **커뮤니티 탐색** — 카테고리 필터 · 검색 · 인기순/활발한/최신 정렬
- **게시판** — 커뮤니티마다 공지사항·자유게시판 기본 생성, 운영자가 게시판 추가/삭제
- **가입 / 탈퇴** — 멤버 등급(운영자 / 관리자 / 멤버)
- **글쓰기 · 글목록 · 글상세** — 조회수 카운트, 게시판별 목록
- **댓글** — 작성 / 삭제 / 좋아요
- **추천 / 비추천** — 디시 스타일 개추/비추
- **마이페이지** — 내가 가입/개설한 커뮤니티 목록
- **커뮤니티 관리** — 운영자용 게시판·멤버 관리
- **🎮 게임 센터 + 익명 자유게시판** (`/games`) — 아래 참고

## 🎮 게임 센터 · 익명 자유게시판 (`/games`)

한 페이지 위쪽에는 **바로 즐기는 미니게임 10종**, 아래쪽에는 **익명 자유게시판**이 있습니다.
로그인 없이 클릭만으로 플레이할 수 있고, 점수는 XP 로 쌓여 레벨이 올라갑니다.

| 게임 | 조작 | 게임 | 조작 |
| --- | --- | --- | --- |
| 🎯 다트 던지기 | 클릭 (바람 보정) | 🐍 스네이크 | 방향키·WASD·화면 버튼 |
| 🎡 행운 룰렛 | 클릭 | 🧱 브레이크아웃 | 마우스 |
| 🎰 슬롯머신 | 클릭 | 🎈 풍선 터뜨리기 | 클릭 (30초) |
| 🎟 긁는 복권 | 드래그로 긁기 | ⚡ 반응속도 | 클릭 (5라운드) |
| 🐤 파이프 통과 | 클릭·스페이스 | 🃏 짝 맞추기 | 클릭 |

- 점수 → XP 환산과 최고기록은 게임마다 저장되고, 300 XP 마다 레벨이 1 오릅니다.
- 한 판이 끝나면 **게시판에 점수 자랑하기** 버튼으로 결과가 담긴 글을 바로 쓸 수 있습니다.
- 게시판은 **완전 익명**입니다. 글마다 랜덤 닉네임(예: "지나가던 감자")이 붙고,
  카테고리(자유·유머·질문·게임·고민·정보) · 정렬(최신/인기/댓글순) · 검색 · 댓글 · 추천을 지원합니다.
- 삭제는 글 작성 시 정한 **숫자 4자리 비밀번호**로 합니다. (같은 브라우저에서 쓴 글은 비번 없이 삭제)

### 게임 추가하기

`src/games/` 에 `GameProps` 를 받는 컴포넌트를 만들고 `src/games/index.ts` 의 `GAMES` 배열에
`GameDef` 하나만 추가하면 카드·모달·기록·XP 가 자동으로 연결됩니다.

```tsx
// 한 판이 끝나면 점수를 딱 한 번 보고하면 된다
export default function MyGame({ onFinish }: GameProps) { /* ... */ }
```

## 🚀 실행 방법

```bash
cd community
npm install
npm run dev     # http://localhost:5190
```

> 별도 설정 없이 바로 실행됩니다. 최초 실행 시 데모 커뮤니티/글/댓글이 자동으로 채워집니다.
>
> **데모 계정**: `admin@demo.com` / `1234` (닉네임 "운영자")
> 그 외 `gamja@demo.com`, `bung@demo.com` 도 비밀번호 `1234`.

## 🗄 데이터 저장 방식

- **기본(데모) 모드**: 브라우저 `localStorage` 에 저장 — 백엔드 없이 완전 동작.
  단, 데이터는 접속한 브라우저 안에서만 공유됩니다.
- **프로덕션(다중 사용자) 모드**: `supabase-schema.sql` 을 Supabase 에서 실행하고
  `.env` 에 아래 값을 넣으면 여러 사용자가 공유하는 실제 백엔드로 전환할 수 있습니다.

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

데이터 접근 계층은 `src/lib/store.ts` 한 곳에 모여 있고 모든 함수가 `Promise` 를
반환하도록 설계돼 있어, 함수 내부만 Supabase 쿼리로 교체하면 UI 코드 수정 없이
전환됩니다.

## 📁 구조

```
community/
├─ index.html
├─ vite.config.ts
├─ supabase-schema.sql        # 프로덕션 DB 스키마 + RLS
├─ netlify.toml               # 배포 설정
└─ src/
   ├─ main.tsx / App.tsx      # 라우팅
   ├─ lib/
   │  ├─ types.ts             # 도메인 타입
   │  ├─ store.ts             # 데이터 접근 계층 (localStorage ↔ Supabase 교체 지점)
   │  ├─ seed.ts              # 데모 시드 데이터
   │  ├─ auth.tsx             # 인증 컨텍스트
   │  ├─ supabase.ts / utils.ts
   ├─ lib/arcade.ts           # 게임 기록/XP + 익명 게시판 데이터 계층
   ├─ games/                  # 미니게임 10종 + 게임 목록(index.ts)
   ├─ components/             # Layout · Avatar · CommunityCard
                              #  · GameModal · FreeBoard
   └─ pages/                  # Home · Login · Signup · Create · CommunityHome
                              #  · Write · PostDetail · Settings · MyPage · Games
```

## 🛠 기술 스택

React 19 · Vite · TypeScript · Tailwind CSS · React Router v7 · (선택) Supabase
