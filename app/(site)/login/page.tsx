'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useFormValues } from '../../../components/useFormValues';
import { loginAction } from '../../../lib/server/actions';
import SubmitButton from '../../../components/SubmitButton';

export default function LoginPage() {
  const [state, action] = useActionState(loginAction, {});
  // 비밀번호를 틀려도 아이디는 남아 있게
  const { bind } = useFormValues({ loginId: '', password: '' });
  const field =
    'w-full rounded-lg border border-hair bg-ground px-3 py-2.5 outline-none focus:border-ink/30 focus:bg-white';

  return (
    <div className="max-w-sm mx-auto mt-6">
      <div className="bg-white rounded-2xl border border-hair p-6">
        <h1 className="text-xl font-black text-ink mb-5">로그인</h1>
        <form action={action} className="space-y-3">
          <input
            {...bind('loginId')}
            placeholder="아이디"
            autoComplete="username"
            required
            className={field}
          />
          <input
            type="password"
            {...bind('password')}
            placeholder="비밀번호"
            autoComplete="current-password"
            required
            className={field}
          />
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
        <p className="text-sm text-ink-faint mt-1.5 text-center">
          <Link href="/find-password" className="hover:text-ink-mute">
            비밀번호를 잊으셨나요?
          </Link>
        </p>
      </div>
    </div>
  );
}
