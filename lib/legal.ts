// 약관·개인정보처리방침에 들어가는 운영 정보
//
// 실제 운영자 정보는 사람마다 다르므로 환경변수로 받는다.
// 넣지 않으면 화면에 "미입력" 으로 보이고, 채우라고 안내한다.

export const operator = {
  name: process.env.NEXT_PUBLIC_OPERATOR_NAME || '',
  contact: process.env.NEXT_PUBLIC_OPERATOR_CONTACT || '',
  /** 개인정보 보호책임자 */
  privacyOfficer: process.env.NEXT_PUBLIC_PRIVACY_OFFICER || '',
  /** 시행일 */
  effectiveDate: process.env.NEXT_PUBLIC_POLICY_DATE || '2026-01-01',
};

/** 아직 채우지 않은 항목이 있는가 */
export const operatorMissing =
  !operator.name || !operator.contact || !operator.privacyOfficer;

/** 우리가 모으는 개인정보 — 두 화면과 가입 동의문이 같은 표를 쓴다 */
export const COLLECTED = [
  { item: '아이디', why: '회원 식별과 로그인', keep: '탈퇴할 때까지' },
  { item: '비밀번호', why: '본인 확인 (되돌릴 수 없게 암호화해 보관)', keep: '탈퇴할 때까지' },
  { item: '이름', why: '본인 확인, 비밀번호 찾기', keep: '탈퇴할 때까지' },
  { item: '연락처', why: '본인 확인, 비밀번호 찾기, 중요 공지', keep: '탈퇴할 때까지' },
  { item: '생년월일', why: '본인 확인, 연령 확인', keep: '탈퇴할 때까지' },
  { item: '접속 기록·쿠키', why: '로그인 유지, 부정 이용 방지', keep: '3개월' },
];
