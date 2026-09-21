// 파일 저장소 — 로컬 개발용 (data/*.json)
//
// 설치 없이 바로 돌아가라고 둔 것이다.
// 서버리스에 올리면 파일 쓰기가 유지되지 않으므로 배포에는 쓰지 않는다.

import { promises as fs } from 'fs';
import path from 'path';
import { AdBanner } from '../ads-types';
import { AnonComment, AnonPost } from '../../board-types';
import { Board, Comment, Community, DB, Membership, Post, User } from '../../types';
import { seedDB } from '../../seed';
import { seedAnonBoard } from '../seed-board';
import { Repo } from './types';

const DIR = path.join(process.cwd(), 'data');
const MAIN = path.join(DIR, 'db.json');
const BOARD = path.join(DIR, 'board.json');
const ADS = path.join(DIR, 'ads.json');

interface BoardFile {
  posts: AnonPost[];
  comments: AnonComment[];
}

let mainCache: DB | null = null;
let boardCache: BoardFile | null = null;
let adsCache: (AdBanner & { order: number })[] | null = null;

async function readMain(): Promise<DB> {
  if (mainCache) return mainCache;
  try {
    mainCache = JSON.parse(await fs.readFile(MAIN, 'utf8')) as DB;
  } catch {
    mainCache = seedDB({ users: [], communities: [], boards: [], memberships: [], posts: [], comments: [] });
    await saveMain();
  }
  return mainCache;
}

async function saveMain(): Promise<void> {
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(MAIN, JSON.stringify(mainCache, null, 2), 'utf8');
}

async function readBoardFile(): Promise<BoardFile> {
  if (boardCache) return boardCache;
  try {
    boardCache = JSON.parse(await fs.readFile(BOARD, 'utf8')) as BoardFile;
  } catch {
    boardCache = seedAnonBoard();
    await saveBoard();
  }
  return boardCache;
}

async function saveBoard(): Promise<void> {
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(BOARD, JSON.stringify(boardCache, null, 2), 'utf8');
}

async function readAdsFile(): Promise<(AdBanner & { order: number })[]> {
  if (adsCache) return adsCache;
  try {
    adsCache = JSON.parse(await fs.readFile(ADS, 'utf8')) as (AdBanner & { order: number })[];
  } catch {
    adsCache = [];
  }
  return adsCache;
}

async function saveAds(): Promise<void> {
  await fs.mkdir(DIR, { recursive: true });
  await fs.writeFile(ADS, JSON.stringify(adsCache, null, 2), 'utf8');
}

const byIds = <T extends { id: string }>(rows: T[], ids: string[]) =>
  rows.filter((r) => ids.includes(r.id));

export const fileRepo: Repo = {
  // 회원
  async getUserById(id) {
    return (await readMain()).users.find((u) => u.id === id) ?? null;
  },
  async getUserByEmail(email) {
    return (
      (await readMain()).users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null
    );
  },
  async getUserByNickname(nickname) {
    return (await readMain()).users.find((u) => u.nickname === nickname) ?? null;
  },
  async createUser(user) {
    (await readMain()).users.push(user);
    await saveMain();
  },
  async listUsersByIds(ids) {
    return byIds((await readMain()).users, ids);
  },

  // 커뮤니티
  async getCommunityBySlug(slug) {
    return (await readMain()).communities.find((c) => c.slug === slug) ?? null;
  },
  async getCommunityById(id) {
    return (await readMain()).communities.find((c) => c.id === id) ?? null;
  },
  async listCommunities() {
    return [...(await readMain()).communities];
  },
  async createCommunity(c, boards, membership) {
    const db = await readMain();
    db.communities.push(c);
    db.boards.push(...boards);
    db.memberships.push(membership);
    await saveMain();
  },
  async updateCommunity(id, patch) {
    const db = await readMain();
    const c = db.communities.find((x) => x.id === id);
    if (c) Object.assign(c, patch);
    await saveMain();
  },
  async slugExists(slug) {
    return (await readMain()).communities.some((c) => c.slug === slug);
  },

  // 게시판
  async listBoards(communityId) {
    return (await readMain()).boards
      .filter((b) => b.communityId === communityId)
      .sort((a, b) => a.order - b.order);
  },
  async getBoard(id) {
    return (await readMain()).boards.find((b) => b.id === id) ?? null;
  },
  async createBoard(board) {
    (await readMain()).boards.push(board);
    await saveMain();
  },
  async deleteBoard(id) {
    const db = await readMain();
    db.boards = db.boards.filter((b) => b.id !== id);
    const postIds = db.posts.filter((p) => p.boardId === id).map((p) => p.id);
    db.posts = db.posts.filter((p) => p.boardId !== id);
    db.comments = db.comments.filter((c) => !postIds.includes(c.postId));
    await saveMain();
  },

  // 멤버십
  async getMembership(communityId, userId) {
    return (
      (await readMain()).memberships.find(
        (m) => m.communityId === communityId && m.userId === userId
      ) ?? null
    );
  },
  async listMemberships(communityId) {
    return (await readMain()).memberships.filter((m) => m.communityId === communityId);
  },
  async listMembershipsOfUser(userId) {
    return (await readMain()).memberships.filter((m) => m.userId === userId);
  },
  async createMembership(m) {
    (await readMain()).memberships.push(m);
    await saveMain();
  },
  async deleteMembership(id) {
    const db = await readMain();
    db.memberships = db.memberships.filter((m) => m.id !== id);
    await saveMain();
  },
  async countMembers(communityIds) {
    const db = await readMain();
    return Object.fromEntries(
      communityIds.map((id) => [id, db.memberships.filter((m) => m.communityId === id).length])
    );
  },

  // 글
  async getPost(id) {
    return (await readMain()).posts.find((p) => p.id === id) ?? null;
  },
  async listPosts(opts = {}) {
    let rows = [...(await readMain()).posts];
    if (opts.communityId) rows = rows.filter((p) => p.communityId === opts.communityId);
    if (opts.boardId) rows = rows.filter((p) => p.boardId === opts.boardId);
    rows.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    return opts.limit ? rows.slice(0, opts.limit) : rows;
  },
  async listPostsOfAuthor(authorId) {
    return (await readMain()).posts.filter((p) => p.authorId === authorId);
  },
  async createPost(post) {
    (await readMain()).posts.push(post);
    await saveMain();
  },
  async updatePost(id, patch) {
    const db = await readMain();
    const p = db.posts.find((x) => x.id === id);
    if (p) Object.assign(p, patch);
    await saveMain();
  },
  async deletePost(id) {
    const db = await readMain();
    db.posts = db.posts.filter((p) => p.id !== id);
    db.comments = db.comments.filter((c) => c.postId !== id);
    await saveMain();
  },
  async countPosts(communityIds) {
    const db = await readMain();
    return Object.fromEntries(
      communityIds.map((id) => [id, db.posts.filter((p) => p.communityId === id).length])
    );
  },

  // 댓글
  async listComments(postId) {
    return (await readMain()).comments
      .filter((c) => c.postId === postId)
      .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
  },
  async listCommentsSince(since) {
    return (await readMain()).comments.filter((c) => c.createdAt >= since);
  },
  async countComments(postIds) {
    const db = await readMain();
    return Object.fromEntries(
      postIds.map((id) => [id, db.comments.filter((c) => c.postId === id).length])
    );
  },
  async createComment(c) {
    (await readMain()).comments.push(c);
    await saveMain();
  },
  async getComment(id) {
    return (await readMain()).comments.find((c) => c.id === id) ?? null;
  },
  async deleteComment(id) {
    const db = await readMain();
    db.comments = db.comments.filter((c) => c.id !== id);
    await saveMain();
  },

  // 익명 게시판
  async listAnonPosts() {
    return [...(await readBoardFile()).posts];
  },
  async getAnonPost(id) {
    return (await readBoardFile()).posts.find((p) => p.id === id) ?? null;
  },
  async createAnonPost(p) {
    (await readBoardFile()).posts.unshift(p);
    await saveBoard();
  },
  async updateAnonPost(id, patch) {
    const db = await readBoardFile();
    const p = db.posts.find((x) => x.id === id);
    if (p) Object.assign(p, patch);
    await saveBoard();
  },
  async deleteAnonPost(id) {
    const db = await readBoardFile();
    db.posts = db.posts.filter((p) => p.id !== id);
    db.comments = db.comments.filter((c) => c.postId !== id);
    await saveBoard();
  },
  async listAnonComments(postId) {
    const db = await readBoardFile();
    return postId ? db.comments.filter((c) => c.postId === postId) : [...db.comments];
  },
  async createAnonComment(c) {
    (await readBoardFile()).comments.push(c);
    await saveBoard();
  },
  async getAnonComment(id) {
    return (await readBoardFile()).comments.find((c) => c.id === id) ?? null;
  },
  async deleteAnonComment(id) {
    const db = await readBoardFile();
    db.comments = db.comments.filter((c) => c.id !== id);
    await saveBoard();
  },

  // 광고 배너
  async listAds() {
    return (await readAdsFile()).sort((a, b) => a.order - b.order).map(({ order, ...b }) => b);
  },
  async createAd(ad, order) {
    (await readAdsFile()).push({ ...ad, order });
    await saveAds();
  },
  async updateAd(id, patch) {
    const list = await readAdsFile();
    const b = list.find((x) => x.id === id);
    if (b) Object.assign(b, patch);
    await saveAds();
  },
  async deleteAd(id) {
    adsCache = (await readAdsFile()).filter((b) => b.id !== id);
    await saveAds();
  },
  async reorderAds(ids) {
    const list = await readAdsFile();
    ids.forEach((id, i) => {
      const b = list.find((x) => x.id === id);
      if (b) b.order = i;
    });
    await saveAds();
  },
};
