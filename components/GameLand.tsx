'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GAMES } from '../games';
import { GameDef } from '../games/types';
import GameModal from './GameModal';
import MyLand from './MyLand';
import NightSky from './NightSky';
import AnonBoard, { BoardDraft } from './AnonBoard';
import { AnonPostView, BoardCategory, BoardSort } from '../lib/board-types';
import { BoardContribution, getLandStats, getProfile, levelOf, levelProgress, resetProfile } from '../lib/arcade';

interface Props {
  posts: AnonPostView[];
  comments: Record<string, { id: string; nickname: string; color: string; content: string; createdAt: string; mine: boolean }[]>;
  contribution: BoardContribution;
  category: BoardCategory | '전체';
  sort: BoardSort;
  /** 로그인한 사용자 이름 (헤더 표시용) */
  nickname?: string;
}

function GameCard({
  game,
  best,
  plays,
  onPlay,
}: {
  game: GameDef;
  best?: number;
  plays?: number;
  onPlay: () => void;
}) {
  return (
    <button
      onClick={onPlay}
      className="group relative text-left rounded-2xl border border-white/10 bg-white/[0.05] p-3 h-[152px] flex flex-col transition-all hover:-translate-y-0.5 hover:border-amber-300/40 hover:bg-white/[0.09]"
    >
      {game.badge && (
        <span className="absolute top-2 right-2 text-[10px] font-black bg-amber-300 text-slate-900 px-1.5 py-0.5 rounded-full">
          {game.badge}
        </span>
      )}
      <div className="flex items-center gap-1 text-xs font-bold text-slate-300">
        <span>{game.emoji}</span>
        <span>{game.title}</span>
      </div>
      <div className="flex-1 grid place-items-center">
        <span className="text-4xl transition-transform group-hover:scale-110">{game.emoji}</span>
      </div>
      <div className="text-center">
        <p className="text-[11px] text-slate-400">{game.tagline}</p>
        <p className="text-sm font-black text-amber-300">
          {best !== undefined ? `최고 ${best}점` : '기록 없음'}
          {plays ? <span className="ml-1 font-normal text-[11px] text-slate-500">· {plays}판</span> : null}
        </p>
      </div>
    </button>
  );
}

export default function GameLand({ posts, comments, contribution, category, sort, nickname }: Props) {
  const router = useRouter();
  const [profile, setProfile] = useState(getProfile);
  const [playing, setPlaying] = useState<GameDef | null>(null);
  const [draft, setDraft] = useState<BoardDraft | null>(null);

  const land = getLandStats(contribution);
  const level = levelOf(profile.xp);
  const { ratio, remain } = levelProgress(profile.xp);
  const totalPlays = Object.values(profile.records).reduce((a, r) => a + r.plays, 0);

  const refresh = useCallback(() => setProfile(getProfile()), []);
  const clearDraft = useCallback(() => setDraft(null), []);

  const brag = (game: GameDef, score: number) => {
    setDraft({
      category: '게임',
      title: `${game.emoji} ${game.title} ${score}점 찍었습니다`,
      content: `방금 ${game.title}에서 ${score}점 기록했어요.\n다들 최고 기록이 어떻게 되나요?`,
      scoreBadge: `${game.emoji} ${game.title} ${score}점`,
    });
    setPlaying(null);
  };

  /** 게시판 필터는 주소로 옮겨 서버가 다시 그리게 한다 */
  const setFilter = (next: { category?: BoardCategory | '전체'; sort?: BoardSort }) => {
    const params = new URLSearchParams();
    const c = next.category ?? category;
    const s = next.sort ?? sort;
    if (c !== '전체') params.set('category', c);
    if (s !== 'new') params.set('sort', s);
    router.push(`/games${params.toString() ? `?${params}` : ''}`);
  };

  return (
    <div className="min-h-screen text-slate-200">
      <NightSky />

      <div className="relative z-10">
        <header className="sticky top-0 z-20 border-b border-white/10 bg-[#080a1c]/80 backdrop-blur-md">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
            <Link href="/games" className="flex items-center gap-2 font-black shrink-0">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-300 to-amber-500 text-slate-900 grid place-items-center">
                🎮
              </span>
              <span className="text-white">게임 랜드</span>
            </Link>
            <nav className="ml-auto flex items-center gap-1 text-sm">
              <Link href="/" className="px-3 py-1.5 rounded-lg text-slate-300 hover:bg-white/10">
                커뮤니티
              </Link>
              <Link href="/ranking" className="px-3 py-1.5 rounded-lg text-slate-300 hover:bg-white/10">
                랭킹
              </Link>
              {nickname ? (
                <Link
                  href="/me"
                  className="px-3 py-1.5 rounded-lg font-bold bg-white/10 text-white hover:bg-white/20"
                >
                  {nickname}
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="px-3 py-1.5 rounded-lg font-bold bg-amber-300 text-slate-900 hover:bg-amber-200"
                >
                  로그인
                </Link>
              )}
            </nav>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-4 py-6 space-y-5">
          <section className="text-center pt-6 pb-2">
            <p className="inline-block text-[11px] font-bold tracking-widest text-amber-300 border border-amber-300/30 rounded-full px-3 py-1">
              GAME LAND
            </p>
            <h1 className="mt-3 text-3xl sm:text-4xl font-black text-white leading-tight">
              놀고 떠들수록
              <br />내 <span className="text-amber-300">랜드</span>가 자랍니다
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              미니게임 {GAMES.length}종을 즐기고, 익명 게시판에서 수다 떨면 포인트가 쌓여요
            </p>

            <div className="mt-4 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-2.5">
              <span className="text-[11px] font-black bg-amber-300 text-slate-900 px-2 py-0.5 rounded-full">
                Lv.{level}
              </span>
              <span className="text-sm font-bold text-white">{profile.xp} XP</span>
              <div className="w-28 h-1.5 rounded-full bg-white/15 overflow-hidden">
                <div className="h-full bg-amber-300" style={{ width: `${Math.round(ratio * 100)}%` }} />
              </div>
              <span className="text-xs text-slate-400">다음 레벨까지 {remain}</span>
            </div>
          </section>

          <MyLand land={land} />

          <section className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-sm overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
              <h2 className="font-black text-white">🕹 게임 센터</h2>
              <span className="text-xs text-slate-400">클릭 한 번으로 바로 플레이</span>
              <span className="ml-auto text-xs text-slate-400">총 {totalPlays}판</span>
            </div>

            <div className="p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2.5">
              {GAMES.map((g) => (
                <GameCard
                  key={g.id}
                  game={g}
                  best={profile.records[g.id]?.best}
                  plays={profile.records[g.id]?.plays}
                  onPlay={() => setPlaying(g)}
                />
              ))}
            </div>

            {totalPlays > 0 && (
              <div className="px-4 pb-3 text-right">
                <button
                  onClick={() => {
                    if (confirm('게임 기록과 XP를 모두 초기화할까요? (랜드 단계도 함께 내려갑니다)')) {
                      resetProfile();
                      refresh();
                    }
                  }}
                  className="text-[11px] text-slate-500 hover:text-slate-300 underline"
                >
                  기록 초기화
                </button>
              </div>
            )}
          </section>

          <AnonBoard
            posts={posts}
            comments={comments}
            category={category}
            sort={sort}
            draft={draft}
            onDraftUsed={clearDraft}
            onFilter={setFilter}
          />
        </main>

        <footer className="border-t border-white/10 py-6 text-center text-xs text-slate-500">
          게임 랜드 · 게임 기록은 이 브라우저에, 게시판 글은 서버에 저장됩니다
        </footer>
      </div>

      {playing && (
        <GameModal game={playing} onClose={() => setPlaying(null)} onRecorded={refresh} onBrag={brag} />
      )}
    </div>
  );
}
