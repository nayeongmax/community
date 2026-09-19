import { notFound, redirect } from 'next/navigation';
import { getCommunityBySlug, listBoards } from '../../../../lib/server/queries';
import { currentUser, isManager, myRole } from '../../../../lib/server/session';
import PostForm from '../../../../components/PostForm';

export const metadata = { title: '글쓰기', robots: { index: false } };

export default async function WritePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ b?: string }>;
}) {
  const { slug } = await params;
  const { b } = await searchParams;

  const me = await currentUser();
  if (!me) redirect('/login');

  const community = await getCommunityBySlug(slug);
  if (!community) notFound();

  const role = await myRole(community.id);
  // 공지 게시판은 운영진만 글을 쓸 수 있다
  const boards = (await listBoards(community.id)).filter((x) => !x.isNotice || isManager(role));

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-black text-ink mb-4">글쓰기 · {community.name}</h1>
      <PostForm slug={slug} boards={boards} defaultBoardId={b} />
    </div>
  );
}
