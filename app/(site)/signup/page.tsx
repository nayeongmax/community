'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { signupAction } from '../../../lib/server/actions';
import SubmitButton from '../../../components/SubmitButton';

export default function SignupPage() {
  const [state, action] = useActionState(signupAction, {});
  const field =
    'w-full rounded-lg border border-hair bg-ground px-3 py-2.5 outline-none focus:border-ink/30 focus:bg-white';
  const label = 'block text-[13px] font-bold text-ink-mute mb-1';
  const hint = 'text-xs text-ink-faint mt-1';

  // 생년월일은 오늘 이후를 고를 수 없게 한다
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-sm mx-auto mt-6">
      <div className="bg-white rounded-2xl border border-hair p-6">
        <h1 className="text-xl font-black text-ink mb-5">회원가입</h1>

        <form action={action} className="space-y-4">
          <div>
            <label className={label} htmlFor="name">
              이름
            </label>
            <input
              id="name"
              name="name"
              placeholder="홍길동"
              autoComplete="name"
              required
              maxLength={30}
              className={field}
            />
          </div>

          <div>
            <label className={label} htmlFor="loginId">
              아이디
            </label>
            <input
              id="loginId"
              name="loginId"
              placeholder="영문·숫자 4~20자"
              autoComplete="username"
              required
              minLength={4}
              maxLength={20}
              pattern="[a-zA-Z0-9_]{4,20}"
              className={field}
            />
            <p className={hint}>글과 댓글에는 이 아이디가 보입니다.</p>
          </div>

          <div>
            <label className={label} htmlFor="password">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              name="password"
              placeholder="8자 이상"
              autoComplete="new-password"
              required
              minLength={8}
              className={field}
            />
          </div>

          <div>
            <label className={label} htmlFor="phone">
              연락처
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              inputMode="numeric"
              placeholder="01012345678"
              autoComplete="tel"
              required
              className={field}
            />
          </div>

          <div>
            <label className={label} htmlFor="birthday">
              생년월일
            </label>
            <input
              id="birthday"
              type="date"
              name="birthday"
              required
              max={today}
              className={field}
            />
          </div>

          <p className="text-xs text-ink-faint leading-relaxed bg-ground rounded-lg p-3">
            이름 · 연락처 · 생년월일은 <b className="text-ink-mute">공개되지 않습니다.</b> 다른
            사람에게는 아이디만 보여요.
          </p>

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
