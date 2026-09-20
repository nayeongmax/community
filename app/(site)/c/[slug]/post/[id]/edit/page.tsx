import { notFound, redirect } from 'next/navigation';
import { getCommunityBySlug, getPost, listBoards } from '../../../../../../../lib/server/queries';
import { currentUser } from '../../../../../../../lib/server/session';
import PostForm from '../../../../../../../components/PostForm';

export const metadata = { title: '글 수정', robots: { index: false } };

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug, id } = await params;

  const me = await currentUser();
  if (!me) redirect('/login');

  const [post, community] = await Promise.all([getPost(id), getCommunityBySlug(slug)]);
  if (!post || !community) notFound();

  // 수정은 작성자 본인만
  if (post.authorId !== me.id) {
    return (
      <p className="text-center py-16 text-ink-faint">글을 수정할 권한이 없습니다.</p>
    );
  }

  const boards = await listBoards(community.id);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-black text-ink mb-4">글 수정 · {community.name}</h1>
      <PostForm slug={slug} boards={boards} post={post} />
    </div>
  );
}
