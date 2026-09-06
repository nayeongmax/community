import { useCallback, useState } from 'react';
import { GAMES } from '../games';
import { GameDef } from '../games/types';
import GameModal from '../components/GameModal';
import FreeBoard, { BoardDraft } from '../components/FreeBoard';
import { getProfile, levelOf, levelProgress, resetProfile } from '../lib/arcade';

/** 게임 카드 한 장 */
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
  const dark = game.card.includes('text-white');
  return (
    <button
      onClick={onPlay}
      className={`relative text-left rounded-2xl border p-3 h-[150px] flex flex-col transition-transform hover:-translate-y-0.5 hover:shadow-lg ${game.card}`}
    >
      {game.badge && (
        <span className="absolute top-2 right-2 text-[10px] font-black bg-white/90 text-slate-700 px-1.5 py-0.5 rounded-full shadow-sm">
          {game.badge}
        </span>
      )}

      <div className={`flex items-center gap-1 text-xs font-bold ${dark ? 'text-white/80' : 'text-slate-500'}`}>
        <span>{game.emoji}</span>
        <span>{game.title}</span>
      </div>

      <div className="flex-1 grid place-items-center">
        <span className="text-4xl">{game.emoji}</span>
      </div>

      <div className="text-center">
        <p className={`text-[11px] font-semibold ${dark ? 'text-white/70' : 'text-slate-500'}`}>
          {game.tagline}
        </p>
        <p className={`text-sm font-black ${game.accent}`}>
          {best !== undefined ? `최고 ${best}점` : '기록 없음'}
          {plays ? <span className={`ml-1 font-normal text-[11px] ${dark ? 'text-white/50' : 'text-slate-400'}`}>· {plays}판</span> : null}
        </p>
      </div>
    </button>
  );
}

export default function GamesPage() {
  const [profile, setProfile] = useState(getProfile);
  const [playing, setPlaying] = useState<GameDef | null>(null);
  const [draft, setDraft] = useState<BoardDraft | null>(null);

  const refresh = useCallback(() => setProfile(getProfile()), []);
  const clearDraft = useCallback(() => setDraft(null), []);

  const level = levelOf(profile.xp);
  const { ratio, remain } = levelProgress(profile.xp);
  const totalPlays = Object.values(profile.records).reduce((a, r) => a + r.plays, 0);

  const brag = (game: GameDef, score: number) => {
    setDraft({
      category: '게임',
      title: `${game.emoji} ${game.title} ${score}점 찍었습니다`,
      content: `방금 ${game.title}에서 ${score}점 기록했어요.\n다들 최고 기록이 어떻게 되나요?`,
      scoreBadge: `${game.emoji} ${game.title} ${score}점`,
    });
    setPlaying(null);
  };

  return (
    <div className="space-y-6">
      {/* 게임 센터 */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-4 py-4 text-white">
          <h1 className="text-xl font-black flex items-center gap-2">🎮 게임 센터</h1>
          <p className="text-xs text-white/80 mt-0.5">
            클릭 한 번으로 바로 즐기고, 점수를 올려 XP를 모으세요
          </p>

          <div className="mt-3 bg-white/15 rounded-xl px-3 py-2.5 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-sm font-bold">
              <span className="bg-amber-300 text-slate-900 px-2 py-0.5 rounded-full text-xs">
                Lv.{level}
              </span>
              <span>{profile.xp} XP</span>
              <span className="ml-auto text-xs text-white/80">
                총 {totalPlays}판 · 다음 레벨까지 {remain} XP
              </span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-white/25 overflow-hidden">
              <div
                className="h-full bg-amber-300 transition-all"
                style={{ width: `${Math.round(ratio * 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
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
                if (window.confirm('게임 기록과 XP를 모두 초기화할까요?')) {
                  resetProfile();
                  refresh();
                }
              }}
              className="text-[11px] text-slate-300 hover:text-slate-500 underline"
            >
              기록 초기화
            </button>
          </div>
        )}
      </section>

      {/* 익명 자유게시판 */}
      <FreeBoard draft={draft} onDraftUsed={clearDraft} />

      {playing && (
        <GameModal
          game={playing}
          onClose={() => setPlaying(null)}
          onRecorded={refresh}
          onBrag={brag}
        />
      )}
    </div>
  );
}
