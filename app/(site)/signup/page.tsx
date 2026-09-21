'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { signupAction } from '../../../lib/server/actions';
import SubmitButton from '../../../components/SubmitButton';

export default function SignupPage() {
  const [state, action] = useActionState(signupAction, {});
  const field =
    'w-full rounded-lg border border-hair bg-ground px-3 py-2.5 outline-none focus:border-ink/30 focus:bg-white';

  return (
    <div className="max-w-sm mx-auto mt-6">
      <div className="bg-white rounded-2xl border border-hair p-6">
        <h1 className="text-xl font-black text-ink mb-5">회원가입</h1>
        <form action={action} className="space-y-3">
          <input type="email" name="email" placeholder="이메일" required className={field} />
          <input name="nickname" placeholder="닉네임" required maxLength={20} className={field} />
          <input type="password" name="password" placeholder="비밀번호" required className={field} />
          {state.error && <p className="text-sm text-rose-500">{state.error}</p>}
          <SubmitButton
            className="w-full bg-ink text-white font-bold py-2.5 rounded-lg hover:bg-ink-soft"
            pendingLabel="가입 중…"
          >
            가입하기
          </SubmitButton>
        </form>
        <p className="text-sm text-ink-mute mt-4 text-center">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-ink font-semibold">
            로그인
          </Link>
        </p>
      </div>
    </div>
  );
}
