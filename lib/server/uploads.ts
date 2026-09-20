// 업로드 파일 저장
//
// 저장 위치는 환경에 따라 둘로 갈린다.
//   - Supabase 가 설정돼 있으면 : Supabase Storage 의 'uploads' 버킷
//   - 아니면                    : public/uploads 폴더 (로컬 개발)
//
// 서버리스(Vercel·Netlify)에서는 폴더 쓰기가 유지되지 않으므로,
// 배포 환경에서는 반드시 Supabase 쪽이 쓰인다.

import { promises as fs } from 'fs';
import path from 'path';
import { hasSupabase, supabase } from './repo/supabase';

const BUCKET = 'uploads';
const LOCAL_DIR = path.join(process.cwd(), 'public', 'uploads');

/** 이미지 최대 용량 */
export const IMAGE_MAX_BYTES = 8 * 1024 * 1024;
/** 동영상 최대 용량 */
export const VIDEO_MAX_BYTES = 50 * 1024 * 1024;

const EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
};

export interface Upload {
  /** 화면에서 그대로 쓰는 주소 */
  url: string;
  type: 'image' | 'video';
  name: string;
  size: number;
}

/** File 하나를 저장하고 주소를 돌려준다 */
export async function saveUpload(file: File): Promise<Upload> {
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  if (!isImage && !isVideo) throw new Error('이미지 또는 동영상만 올릴 수 있습니다.');

  const limit = isVideo ? VIDEO_MAX_BYTES : IMAGE_MAX_BYTES;
  if (file.size > limit) {
    throw new Error(
      `${isVideo ? '동영상' : '이미지'}은 ${Math.round(limit / 1024 / 1024)}MB 까지 올릴 수 있습니다.`
    );
  }

  const ext = EXT[file.type] ?? (isVideo ? 'mp4' : 'jpg');
  const name = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const body = Buffer.from(await file.arrayBuffer());

  let url: string;
  if (hasSupabase()) {
    const { error } = await supabase()
      .storage.from(BUCKET)
      .upload(name, body, { contentType: file.type, upsert: false });
    if (error) throw new Error(`파일을 올리지 못했습니다: ${error.message}`);
    url = supabase().storage.from(BUCKET).getPublicUrl(name).data.publicUrl;
  } else {
    await fs.mkdir(LOCAL_DIR, { recursive: true });
    await fs.writeFile(path.join(LOCAL_DIR, name), body);
    url = `/uploads/${name}`;
  }

  return { url, type: isVideo ? 'video' : 'image', name: file.name, size: file.size };
}

/** 더 이상 쓰지 않는 파일 지우기 (실패해도 조용히 넘어간다) */
export async function removeUpload(url?: string): Promise<void> {
  if (!url) return;

  if (hasSupabase()) {
    const name = url.split('/').pop();
    if (name) await supabase().storage.from(BUCKET).remove([name]).catch(() => undefined);
    return;
  }

  if (!url.startsWith('/uploads/')) return;
  await fs.unlink(path.join(process.cwd(), 'public', url.replace(/^\//, ''))).catch(() => undefined);
}
