// 저장소 계약
//
// 화면과 서버 동작은 이 계약만 보고 쓴다. 실제 저장은 두 가지 중 하나다.
//   - file.ts     : data/*.json  (로컬 개발 · 설치 없이 바로 동작)
//   - supabase.ts : Supabase     (배포 · 여러 사람이 함께 쓰는 진짜 서비스)
//
// 서버리스(Vercel·Netlify)에서는 파일 쓰기가 유지되지 않으므로,
// 배포 환경에서는 반드시 Supabase 쪽이 쓰인다.

import { AdBanner } from '../ads-types';
import { AnonComment, AnonPost } from '../../board-types';
import { Board, Comment, Community, Membership, Post, User } from '../../types';

export interface Repo {
  // 회원
  getUserById(id: string): Promise<User | null>;
  getUserByLoginId(loginId: string): Promise<User | null>;
  getUserByNickname(nickname: string): Promise<User | null>;
  updateUser(id: string, patch: Partial<User>): Promise<void>;
  createUser(user: User): Promise<void>;
  listUsersByIds(ids: string[]): Promise<User[]>;

  // 커뮤니티
  getCommunityBySlug(slug: string): Promise<Community | null>;
  getCommunityById(id: string): Promise<Community | null>;
  listCommunities(): Promise<Community[]>;
  createCommunity(c: Community, boards: Board[], membership: Membership): Promise<void>;
  updateCommunity(id: string, patch: Partial<Community>): Promise<void>;
  slugExists(slug: string): Promise<boolean>;

  // 게시판
  listBoards(communityId: string): Promise<Board[]>;
  getBoard(id: string): Promise<Board | null>;
  createBoard(board: Board): Promise<void>;
  deleteBoard(id: string): Promise<void>;

  // 멤버십
  getMembership(communityId: string, userId: string): Promise<Membership | null>;
  listMemberships(communityId: string): Promise<Membership[]>;
  listMembershipsOfUser(userId: string): Promise<Membership[]>;
  createMembership(m: Membership): Promise<void>;
  deleteMembership(id: string): Promise<void>;
  countMembers(communityIds: string[]): Promise<Record<string, number>>;

  // 글
  getPost(id: string): Promise<Post | null>;
  listPosts(opts?: { communityId?: string; boardId?: string; limit?: number }): Promise<Post[]>;
  listPostsOfAuthor(authorId: string): Promise<Post[]>;
  createPost(post: Post): Promise<void>;
  updatePost(id: string, patch: Partial<Post>): Promise<void>;
  deletePost(id: string): Promise<void>;
  countPosts(communityIds: string[]): Promise<Record<string, number>>;

  // 댓글
  listComments(postId: string): Promise<Comment[]>;
  /** since 이후에 달린 댓글 — 홈 통계·'지금 뜨는 커뮤니티' 계산용 */
  listCommentsSince(since: string): Promise<Comment[]>;
  countComments(postIds: string[]): Promise<Record<string, number>>;
  createComment(c: Comment): Promise<void>;
  getComment(id: string): Promise<Comment | null>;
  deleteComment(id: string): Promise<void>;

  // 익명 게시판
  listAnonPosts(): Promise<AnonPost[]>;
  getAnonPost(id: string): Promise<AnonPost | null>;
  createAnonPost(p: AnonPost): Promise<void>;
  updateAnonPost(id: string, patch: Partial<AnonPost>): Promise<void>;
  deleteAnonPost(id: string): Promise<void>;
  listAnonComments(postId?: string): Promise<AnonComment[]>;
  createAnonComment(c: AnonComment): Promise<void>;
  getAnonComment(id: string): Promise<AnonComment | null>;
  deleteAnonComment(id: string): Promise<void>;

  // 광고 배너
  listAds(): Promise<AdBanner[]>;
  createAd(ad: AdBanner, order: number): Promise<void>;
  updateAd(id: string, patch: Partial<AdBanner> & { order?: number }): Promise<void>;
  deleteAd(id: string): Promise<void>;
  reorderAds(ids: string[]): Promise<void>;
}
