// 익명 게시판의 타입·상수
//
// 서버(lib/server/board.ts)와 화면(components/AnonBoard.tsx)이 함께 쓴다.
// 서버 전용 모듈(fs·next/headers)을 클라이언트가 끌어오지 않도록 따로 뒀다.

export const BOARD_CATEGORIES = ['자유', '유머', '질문', '게임', '고민', '정보'] as const;
export type BoardCategory = (typeof BOARD_CATEGORIES)[number];
export type BoardSort = 'new' | 'hot' | 'comments';

export interface AnonPost {
  id: string;
  category: BoardCategory;
  nickname: string;
  color: string;
  title: string;
  content: string;
  /** 삭제용 비밀번호 (데모: 평문) */
  password: string;
  /** 작성한 브라우저 식별자 */
  authorKey: string;
  views: number;
  likedBy: string[];
  scoreBadge?: string;
  createdAt: string;
}

export interface AnonComment {
  id: string;
  postId: string;
  nickname: string;
  color: string;
  content: string;
  password: string;
  authorKey: string;
  createdAt: string;
}

export interface AnonPostView extends AnonPost {
  commentCount: number;
  likes: number;
  liked: boolean;
  mine: boolean;
}

export interface AnonCommentView extends AnonComment {
  mine: boolean;
}
