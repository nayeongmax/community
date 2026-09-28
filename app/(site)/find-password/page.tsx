'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useFormValues } from '../../../components/useFormValues';
import { resetPasswordAction } from '../../../lib/server/actions';
import SubmitButton from '../../../components/SubmitButton';

/**
 * 비밀번호 찾기.
 *
 * 문자나 메일로 확인 코드를 보낼 수단이 아직 없어서, 가입할 때 적은
 * 아이디·이름·연락처·생년월일이 모두 맞아야 비밀번호를 다시 정할 수 있다.
 */
export default function FindPasswordPage() {
  const [state, action] = useActionState(resetPasswordAction, {});
  // 잘못 입력해서 되돌아와도 적은 내용이 남아 있도록
  const { bind } = useFormValues({
    loginId: '',
    name: '',
    phone: '',
    birthday: '',
    password: '',
    passwordConfirm: '',
  });
  const field =
    'w-full rounded-lg border border-hair bg-ground px-3 py-2.5 outline-none focus:border-ink/30 focus:bg-white';
  const label = 'block text-[13px] font-bold text-ink-mute mb-1';
  const today = new Date().toISOString().slice(0, 10);

  if (state.ok) {
    return (
      <div className="max-w-sm mx-auto mt-6">
        <div className="bg-white rounded-2xl border border-hair p-6 text-center">
          <p className="text-4xl mb-3">✅</p>
          <h1 className="text-lg font-black text-ink">비밀번호를 바꿨습니다</h1>
          <p className="text-sm text-ink-mute mt-2">새 비밀번호로 로그인해 주세요.</p>
          <Link
            href="/login"
            className="inline-block mt-5 bg-ink text-white font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-ink-soft"
          >
            로그인하러 가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-sm mx-auto mt-6">
      <div className="bg-white rounded-2xl border border-hair p-6">
        <h1 className="text-xl font-black text-ink mb-1">비밀번호 찾기</h1>
        <p className="text-sm text-ink-mute mb-5 leading-relaxed">
          가입할 때 적으신 정보가 모두 맞아야 비밀번호를 다시 정할 수 있습니다.
        </p>

        <form action={action} className="space-y-4">
          <div>
            <label className={label} htmlFor="loginId">
              아이디
            </label>
            <input id="loginId" {...bind('loginId')} required className={field} />
          </div>
          <div>
            <label className={label} htmlFor="name">
              이름
            </label>
            <input id="name" {...bind('name')} required className={field} />
          </div>
          <div>
            <label className={label} htmlFor="phone">
              연락처
            </label>
            <input
              id="phone"
              {...bind('phone')}
              type="tel"
              inputMode="numeric"
              placeholder="01012345678"
              required
              className={field}
            />
          </div>
          <div>
            <label className={label} htmlFor="birthday">
              생년월일
            </label>
            <input id="birthday" type="date" {...bind('birthday')} required max={today} className={field} />
          </div>

          <hr className="border-hair" />

          <div>
            <label className={label} htmlFor="password">
              새 비밀번호
            </label>
            <input
              id="password"
              type="password"
              {...bind('password')}
              placeholder="8자 이상"
              autoComplete="new-password"
              required
              minLength={8}
              className={field}
            />
          </div>
          <div>
            <label className={label} htmlFor="passwordConfirm">
              새 비밀번호 확인
            </label>
            <input
              id="passwordConfirm"
              type="password"
              {...bind('passwordConfirm')}
              autoComplete="new-password"
              required
              minLength={8}
              className={field}
            />
          </div>

          {state.error && <p className="text-sm text-rose-500">{state.error}</p>}

          <SubmitButton
            className="w-full bg-ink text-white font-bold py-2.5 rounded-lg hover:bg-ink-soft"
            pendingLabel="확인 중…"
          >
            비밀번호 다시 정하기
          </SubmitButton>
        </form>

        <p className="text-sm text-ink-mute mt-4 text-center">
          <Link href="/login" className="text-ink font-semibold">
            로그인으로 돌아가기
          </Link>
        </p>
      </div>
    </div>
  );
}
