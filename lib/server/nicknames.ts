// 익명 닉네임 생성

const HEAD = [
  '지나가던', '배고픈', '잠 못 드는', '오늘도', '뒹굴대는', '심심한', '조용한',
  '신난', '수줍은', '용감한', '느긋한', '반짝이는', '커피 마신', '야근하는',
];
const TAIL = [
  '감자', '고양이', '너구리', '펭귄', '햄스터', '붕어빵', '두더지', '수달',
  '알파카', '토끼', '문어', '다람쥐', '판다', '개구리',
];

/** 글마다 새로 뽑는 익명 닉네임 */
export function randomNickname(): string {
  return `${HEAD[Math.floor(Math.random() * HEAD.length)]} ${TAIL[Math.floor(Math.random() * TAIL.length)]}`;
}
