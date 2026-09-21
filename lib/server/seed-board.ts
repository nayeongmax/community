// 익명 게시판 데모 시드

import { colorFromString } from '../utils';
import { randomNickname } from './nicknames';
import type { AnonComment, AnonPost, BoardCategory } from '../board-types';

export function seedAnonBoard(): { posts: AnonPost[]; comments: AnonComment[] } {
  const now = Date.now();
  const at = (min: number) => new Date(now - min * 60000).toISOString();
  const mk = (
    i: number,
    category: BoardCategory,
    title: string,
    content: string,
    min: number,
    likes: number,
    scoreBadge?: string
  ): AnonPost => {
    const nickname = randomNickname();
    return {
      id: 'seed_p' + i,
      category,
      nickname,
      color: colorFromString(nickname + i),
      title,
      content,
      password: '0000',
      authorKey: 'seed',
      views: 20 + ((i * 37) % 400),
      likedBy: Array.from({ length: likes }, (_, k) => 'seed_like_' + i + '_' + k),
      scoreBadge,
      createdAt: at(min),
    };
  };

  const posts = [
    mk(1, '게임', '다트 5발 만점 나온 사람 있음?', '바람 강할 때 조준이 진짜 안 되네요… 저는 218점이 최고입니다.', 6, 12, '🎯 다트 던지기 218점'),
    mk(2, '유머', '스네이크 하다가 자기 꼬리 물고 현타옴', '분명히 왼쪽 눌렀는데 몸이 오른쪽으로 갔어요.', 24, 21),
    mk(3, '자유', '다들 점심 뭐 드셨나요', '저는 편의점 삼각김밥… 오늘도 책상 앞에서 해결했습니다.', 41, 5),
    mk(4, '질문', '브레이크아웃 마지막 벽돌 깨는 팁 있나요', '한 개 남기고 계속 실패 중입니다. 각도 조절 어떻게 하세요?', 78, 8),
    mk(5, '고민', '취미가 없어서 고민입니다', '퇴근하면 누워서 폰만 보다가 하루가 끝나요.', 150, 9),
    mk(6, '정보', '반응속도 200ms 아래로 내리는 법', '화면 전체를 보지 말고 초점을 살짝 흐리게 두면 더 빨리 보입니다.', 220, 14),
  ];

  const cmt = (i: number, postId: string, content: string, min: number): AnonComment => {
    const nickname = randomNickname();
    return {
      id: 'seed_c' + i,
      postId,
      nickname,
      color: colorFromString(nickname + 'c' + i),
      content,
      password: '0000',
      authorKey: 'seed',
      createdAt: at(min),
    };
  };

  return {
    posts,
    comments: [
      cmt(1, 'seed_p1', '저 236점이요. 바람 약할 때만 던지면 됩니다', 4),
      cmt(2, 'seed_p2', '그거 저도 당했습니다 ㅋㅋㅋ', 20),
      cmt(3, 'seed_p4', '벽 튕기는 각도로 위쪽에 넣으면 알아서 깨져요', 60),
      cmt(4, 'seed_p5', '저는 산책이요. 생각보다 머리가 비워집니다', 120),
    ],
  };
}
