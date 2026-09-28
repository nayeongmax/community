'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { useFormValues } from '../../../components/useFormValues';
import { signupAction } from '../../../lib/server/actions';
import SubmitButton from '../../../components/SubmitButton';

export default function SignupPage() {
  const [state, action] = useActionState(signupAction, {});
  // 잘못 입력해서 되돌아와도 적은 내용이 남아 있도록 값을 들고 있는다
  const { bind } = useFormValues({ name: '', loginId: '', password: '', phone: '', birthday: '' });
  // 체크박스도 되돌아왔을 때 풀리지 않도록 직접 들고 있는다
  const [agree, setAgree] = useState({ terms: false, privacy: false });
  const check = (key: 'terms' | 'privacy') => ({
    checked: agree[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setAgree((a) => ({ ...a, [key]: e.target.checked })),
  });
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
              {...bind('name')}
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
              {...bind('loginId')}
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
              {...bind('password')}
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
              {...bind('phone')}
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
              {...bind('birthday')}
              required
              max={today}
              className={field}
            />
          </div>

          <p className="text-xs text-ink-faint leading-relaxed bg-ground rounded-lg p-3">
            이름 · 연락처 · 생년월일은 <b className="text-ink-mute">공개되지 않습니다.</b> 다른
            사람에게는 아이디만 보여요.
          </p>

          {/* 동의 — 무엇에 동의하는지 읽을 수 있어야 한다 */}
          <div className="border border-hair rounded-lg divide-y divide-hair">
            <label className="flex items-start gap-2.5 p-3 cursor-pointer">
              <input
                type="checkbox"
                name="agreeTerms"
                {...check('terms')}
                required
                className="mt-0.5 w-4 h-4 accent-ink shrink-0"
              />
              <span className="text-sm text-ink-mute leading-relaxed">
                <b className="text-ink">[필수]</b>{' '}
                <Link
                  href="/terms"
                  target="_blank"
                  className="font-semibold text-ink underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  이용약관
                </Link>
                에 동의합니다
              </span>
            </label>
            <label className="flex items-start gap-2.5 p-3 cursor-pointer">
              <input
                type="checkbox"
                name="agreePrivacy"
                {...check('privacy')}
                required
                className="mt-0.5 w-4 h-4 accent-ink shrink-0"
              />
              <span className="text-sm text-ink-mute leading-relaxed">
                <b className="text-ink">[필수]</b> 개인정보 수집·이용에 동의합니다
                <span className="block text-xs text-ink-faint mt-1">
                  아이디 · 비밀번호 · 이름 · 연락처 · 생년월일을 회원 식별과 본인 확인에 쓰고,
                  탈퇴할 때까지 보관합니다. 동의를 거부할 수 있으나 그 경우 가입이 어렵습니다.{' '}
                  <Link
                    href="/privacy"
                    target="_blank"
                    className="font-semibold text-ink-mute underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    자세히
                  </Link>
                </span>
              </span>
            </label>
          </div>

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
