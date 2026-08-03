// 커뮤니티 플랫폼 도메인 타입

export type MemberRole = 'owner' | 'admin' | 'member';

/** 커뮤니티 유형: 일반 / 팬커뮤니티 / (운영자 선정) 대표 */
export type CommunityKind = 'normal' | 'fan' | 'featured';

export interface User {
  id: string;
  email: string;
  nickname: string;
  /** 아바타 배경색 (해시로 생성) */
  avatarColor: string;
  createdAt: string;
  /** 데모(localStorage) 모드에서만 사용. 실제 서비스는 Supabase Auth 사용 */
  password?: string;
}

export interface Community {
  id: string;
  slug: string;
  name: string;
  description: string;
  /** 대표 카테고리 (topics[0] 과 동일하게 유지 · 하위호환) */
  category: string;
  /** 이 커뮤니티가 동시에 속하는 주제들. 한 커뮤니티가 여러 주제 페이지에 노출된다. */
  topics: string[];
  /** 지역 (지역별 카페용, 선택) */
  region?: string;
  /** 유형 (일반/팬/대표) */
  kind: CommunityKind;
  /** 커버/테마 색 */
  themeColor: string;
  ownerId: string;
  isPublic: boolean;
  createdAt: string;
}

export interface Board {
  id: string;
  communityId: string;
  name: string;
  /** 정렬 순서 */
  order: number;
  /** 공지 전용 게시판 여부 */
  isNotice?: boolean;
  createdAt: string;
}

export interface Membership {
  id: string;
  communityId: string;
  userId: string;
  role: MemberRole;
  joinedAt: string;
}

export interface Post {
  id: string;
  communityId: string;
  boardId: string;
  authorId: string;
  title: string;
  content: string;
  /** 태그(노출 채널). 글의 소속(community/board)은 하나지만, 태그로 여러 카테고리·메인·검색에 노출된다. */
  tags: string[];
  views: number;
  /** 추천한 유저 id 목록 */
  likedBy: string[];
  /** 비추천한 유저 id 목록 */
  dislikedBy: string[];
  /** 상단 고정 */
  pinned?: boolean;
  createdAt: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  /** 대댓글 부모 (없으면 최상위) */
  parentId: string | null;
  likedBy: string[];
  createdAt: string;
}

export interface DB {
  users: User[];
  communities: Community[];
  boards: Board[];
  memberships: Membership[];
  posts: Post[];
  comments: Comment[];
}

export const CATEGORIES = [
  '유머/일상',
  '게임',
  '스포츠',
  'IT/테크',
  '자동차',
  '재테크/투자',
  '취미/DIY',
  '연예/방송',
  '음식/요리',
  '반려동물',
  '여행',
  '학업/교육',
  '기타',
] as const;

/** 크게 묶은 대주제 (주제별 카페 탐색용) */
export const TOPICS = [
  '생활',
  '취미',
  '게임',
  '자동차',
  '투자',
  '부동산',
  '건강',
  '여행',
  '엔터',
  '스포츠',
  '음식',
  '교육',
  'IT',
] as const;

/** 지역 (지역별 카페 탐색용) */
export const REGIONS = [
  '서울',
  '경기',
  '인천',
  '부산',
  '대구',
  '대전',
  '광주',
  '울산',
  '강원',
  '충청',
  '전라',
  '경상',
  '제주',
] as const;
