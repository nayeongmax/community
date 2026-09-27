'use client';

import { useState } from 'react';

/**
 * 폼 입력값을 기억한다.
 *
 * React 19 는 form action 이 끝나면 입력칸을 비운다. 저장에 성공했을 때는
 * 맞는 동작이지만, 잘못 입력해서 되돌아온 경우에는 적은 내용이 통째로
 * 날아가 버린다. 가입처럼 칸이 많은 화면에서는 특히 답답하다.
 * 그래서 값을 우리가 들고 있는다.
 */
export function useFormValues<T extends Record<string, string>>(initial: T) {
  const [values, setValues] = useState<T>(initial);

  /** <input {...bind('name')} /> */
  const bind = (key: keyof T & string) => ({
    name: key,
    value: values[key],
    onChange: (e: { target: { value: string } }) =>
      setValues((v) => ({ ...v, [key]: e.target.value })),
  });

  return { values, setValues, bind };
}
