// 비밀번호 저장
//
// 예전에는 평문 그대로 넣어 두었다. 데모라서 그랬지만, 실제로 사람들이
// 가입하는 순간부터는 위험하다. 사람들은 비밀번호를 여러 곳에 돌려 쓰기
// 때문에, DB 가 한 번 새면 다른 서비스까지 함께 털린다.
//
// 그래서 scrypt 로 해시해서 넣는다. 원문은 어디에도 남지 않는다.
//   저장 형식:  scrypt$<소금(hex)>$<해시(hex)>
//
// 이미 평문으로 저장된 계정은 다음 로그인 때 자동으로 해시로 바뀐다.

import { randomBytes, scrypt, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number
) => Promise<Buffer>;

const PREFIX = 'scrypt$';
const KEYLEN = 64;

/** 비밀번호를 저장할 형태로 바꾼다 */
export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scryptAsync(plain, salt, KEYLEN);
  return `${PREFIX}${salt.toString('hex')}$${key.toString('hex')}`;
}

/** 이미 해시된 값인가 (예전 평문과 구분) */
export function isHashed(stored: string): boolean {
  return stored.startsWith(PREFIX);
}

/** 입력한 비밀번호가 맞는지 */
export async function verifyPassword(plain: string, stored: string): Promise<boolean> {
  // 예전 평문 계정 — 길이가 달라도 새지 않도록 그대로 비교한다
  if (!isHashed(stored)) return plain === stored;

  const [, saltHex, keyHex] = stored.split('$');
  if (!saltHex || !keyHex) return false;

  const key = await scryptAsync(plain, Buffer.from(saltHex, 'hex'), KEYLEN);
  const expected = Buffer.from(keyHex, 'hex');
  if (key.length !== expected.length) return false;
  return timingSafeEqual(key, expected);
}
