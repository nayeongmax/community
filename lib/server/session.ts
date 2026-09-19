// 로그인 세션
//
// 쿠키에 사용자 id 만 담는다. 서버에서 화면을 그릴 때 "누가 보고 있는지"를
// 알아야 글쓰기·삭제 버튼을 맞게 그릴 수 있다.
//
// ⚠️ 데모라 비밀번호를 평문으로 비교한다. 실제 서비스에서는
// Supabase Auth 같은 인증 서비스로 바꿔야 한다.

import { cookies } from 'next/headers';
import { User } from '../types';
import { read } from './db';

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
  const db = await read();
  return db.users.find((u) => u.id === id) ?? null;
}

/** 이 커뮤니티에서 내 역할 */
export async function myRole(
  communityId: string
): Promise<'owner' | 'admin' | 'member' | null> {
  const me = await currentUser();
  if (!me) return null;
  const db = await read();
  return db.memberships.find((m) => m.communityId === communityId && m.userId === me.id)?.role ?? null;
}

export function isManager(role: string | null): boolean {
  return role === 'owner' || role === 'admin';
}
