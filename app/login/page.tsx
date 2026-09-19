'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { loginAction } from '../../lib/server/actions';
import SubmitButton from '../../components/SubmitButton';

export default function LoginPage() {
  const [state, action] = useActionState(loginAction, {});
  const field =
    'w-full rounded-lg border border-hair bg-ground px-3 py-2.5 outline-none focus:border-ink/30 focus:bg-white';

  return (
    <div className="max-w-sm mx-auto mt-6">
      <div className="bg-white rounded-2xl border border-hair p-6">
        <h1 className="text-xl font-black text-ink mb-1">로그인</h1>
        <p className="text-sm text-ink-mute mb-5">
          데모 계정: <b className="text-ink">admin@demo.com</b> / <b className="text-ink">1234</b>
        </p>
        <form action={action} className="space-y-3">
          <input type="email" name="email" placeholder="이메일" required className={field} />
          <input type="password" name="password" placeholder="비밀번호" required className={field} />
          {state.error && <p className="text-sm text-rose-500">{state.error}</p>}
          <SubmitButton
            className="w-full bg-ink text-white font-bold py-2.5 rounded-lg hover:bg-ink-soft"
            pendingLabel="로그인 중…"
          >
            로그인
          </SubmitButton>
        </form>
        <p className="text-sm text-ink-mute mt-4 text-center">
          아직 회원이 아니신가요?{' '}
          <Link href="/signup" className="text-ink font-semibold">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}
