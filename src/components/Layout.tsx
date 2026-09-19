import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { isSupabaseConfigured } from '../lib/supabase';
import Avatar from './Avatar';
import SideNav from './SideNav';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [q, setQ] = useState('');

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(q.trim() ? `/?q=${encodeURIComponent(q.trim())}` : '/');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-hair sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 font-black text-lg shrink-0">
            <span className="w-8 h-8 rounded-lg bg-ink text-white grid place-items-center text-sm">
              C
            </span>
            <span className="hidden sm:block text-ink">커뮤니티</span>
          </Link>

          <form onSubmit={onSearch} className="flex-1 max-w-md">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="커뮤니티 · 글 · 태그 검색"
              className="w-full bg-ground border border-hair rounded-lg px-4 py-2 text-sm text-ink placeholder-ink-faint outline-none transition-colors focus:border-ink/30 focus:bg-white"
            />
          </form>

          <Link
            to="/create"
            className="hidden sm:inline-block text-sm font-bold bg-ink text-white px-3.5 py-2 rounded-lg hover:bg-ink-soft"
          >
            커뮤니티 개설
          </Link>

          {user ? (
            <div className="flex items-center gap-2">
              <Link to="/me" className="flex items-center gap-2">
                <Avatar nickname={user.nickname} color={user.avatarColor} size={30} />
                <span className="hidden md:block text-sm font-semibold text-ink-soft">
                  {user.nickname}
                </span>
              </Link>
              <button
                onClick={logout}
                className="text-xs text-ink-mute hover:text-ink px-2 py-1"
              >
                로그아웃
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="text-sm font-bold text-ink px-3 py-2 rounded-lg border border-hair hover:border-ink/25"
            >
              로그인
            </Link>
          )}
        </div>
      </header>

      {!isSupabaseConfigured() && (
        <div className="border-b border-hair bg-white text-ink-mute text-[11px] text-center py-1.5 px-4">
          데모 모드 · 데이터는 이 브라우저에만 저장됩니다 · 데모 계정
          <span className="font-semibold text-ink"> admin@demo.com / 1234</span>
        </div>
      )}

      {/* 모바일 상단 가로 내비 */}
      <div className="lg:hidden border-b border-hair bg-white overflow-x-auto">
        <div className="flex gap-1 px-3 py-2 text-sm whitespace-nowrap">
          {[
            ['게임 랜드', '/games'],
            ['탐색', '/explore'],
            ['주제별', '/browse/topic'],
            ['지역별', '/browse/region'],
            ['대표커뮤니티', '/browse/featured'],
            ['팬클럽', '/browse/fan'],
            ['랭킹', '/ranking'],
          ].map(([label, to]) => (
            <Link
              key={to}
              to={to}
              className="px-3 py-1.5 rounded-full font-semibold text-ink-mute border border-hair hover:text-ink hover:border-ink/25"
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex-1 w-full max-w-6xl mx-auto px-4 py-6 flex gap-6">
        {/* 왼쪽 사이드 내비게이션 (데스크톱) */}
        <aside className="hidden lg:block w-52 shrink-0">
          <div className="sticky top-20 bg-white rounded-2xl border border-hair p-2.5">
            <SideNav />
          </div>
        </aside>
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>

      <footer className="border-t border-hair bg-white py-7 text-center text-xs text-ink-faint">
        <p>누구나 만드는 오픈 커뮤니티 플랫폼 · 데모</p>
        <p className="mt-2 flex items-center justify-center gap-3">
          <Link to="/seo" className="hover:text-ink-mute">
            검색 노출 설정
          </Link>
          <span>·</span>
          <Link to="/ads" className="hover:text-ink-mute">
            광고 배너
          </Link>
        </p>
      </footer>
    </div>
  );
}
