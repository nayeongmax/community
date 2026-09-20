import type { Metadata } from 'next';
import type { BoardCategory, BoardSort } from '../../lib/board-types';
import { listAnonComments, listAnonPosts, myBoardContribution } from '../../lib/server/board';
import { currentUser } from '../../lib/server/session';
import GameLand from '../../components/GameLand';

export const metadata: Metadata = {
  title: '게임 랜드',
  description: '미니게임 12종을 즐기고 익명 게시판에서 수다 떨면 내 랜드가 자랍니다.',
  alternates: { canonical: '/games' },
};

export const dynamic = 'force-dynamic';

export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  const category = (sp.category ?? '전체') as BoardCategory | '전체';
  const sort = (sp.sort ?? 'new') as BoardSort;

  const [posts, contribution, me] = await Promise.all([
    listAnonPosts({ category, sort }),
    myBoardContribution(),
    currentUser(),
  ]);

  // 펼쳤을 때 바로 보이도록 댓글도 함께 내려준다
  const commentEntries = await Promise.all(
    posts.map(async (p) => [p.id, await listAnonComments(p.id)] as const)
  );

  return (
    <GameLand
      posts={posts}
      comments={Object.fromEntries(commentEntries)}
      contribution={contribution}
      category={category}
      sort={sort}
      nickname={me?.nickname}
    />
  );
}
