import { storageMisconfigured } from '../lib/server/repo';

/**
 * 배포됐는데 Supabase 설정이 빠졌을 때 띄우는 띠.
 * 이게 보이면 글이 저장되지 않는 상태다.
 */
export default function StorageWarning() {
  if (!storageMisconfigured) return null;
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-xs text-amber-900">
      <strong className="font-bold">임시 저장 상태입니다.</strong> 데이터베이스 설정
      (SUPABASE_URL · SUPABASE_SECRET_KEY)이 없어 지금 쓰는 글은 남지 않습니다.
    </div>
  );
}
