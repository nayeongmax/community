// 로그인 세션
//
// 쿠키에 사용자 id 만 담는다. 서버에서 화면을 그릴 때 "누가 보고 있는지"를
// 알아야 글쓰기·삭제 버튼을 맞게 그릴 수 있다.
//
// ⚠️ 데모라 비밀번호를 평문으로 비교한다. 실제 서비스에서는
// Supabase Auth 같은 인증 서비스로 바꿔야 한다.

import { cookies } from 'next/headers';
import { User } from '../types';
import { repo } from './repo';

const COOKIE = 'community_session';

export async function setSession(userId: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE, userId, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

/** 지금 로그인한 사용자 (없으면 null) */
export async function currentUser(): Promise<User | null> {
  const id = (await cookies()).get(COOKIE)?.value;
  if (!id) return null;
  return repo.getUserById(id);
}

/** 이 커뮤니티에서 내 역할 */
export async function myRole(
  communityId: string
): Promise<'owner' | 'admin' | 'member' | null> {
  const me = await currentUser();
  if (!me) return null;
  return (await repo.getMembership(communityId, me.id))?.role ?? null;
}

export function isManager(role: string | null): boolean {
  return role === 'owner' || role === 'admin';
}

/**
 * 사이트 운영자
 *
 * 커뮤니티 안에서의 '관리자'(owner/admin)와는 다르다. 이쪽은 사이트 전체를
 * 운영하는 사람으로, 지금은 광고 배너를 다룰 수 있다.
 *
 * 누구인지는 로그인 아이디로 정한다. 쉼표로 여러 명을 넣을 수 있다.
 *   SITE_ADMIN_ID=admin,partner
 * 설정하지 않으면 아이디 'admin' 이 운영자다.
 */
export function siteAdminIds(): string[] {
  const raw = process.env.SITE_ADMIN_ID ?? 'admin';
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/** 지금 보고 있는 사람이 사이트 운영자인가 */
export async function isSiteAdmin(): Promise<boolean> {
  const me = await currentUser();
  return !!me && siteAdminIds().includes((me.loginId ?? '').toLowerCase());
}
