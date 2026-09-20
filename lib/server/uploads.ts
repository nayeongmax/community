// 업로드 파일 저장
//
// 예전에는 이미지를 브라우저(IndexedDB)에 담아서, 올린 사람 본인에게만 보이고
// 검색로봇도 볼 수 없었다. 이제 서버에 저장해 모두에게 보이고 og:image 로도 쓴다.
//
// 지금은 public/uploads 에 파일로 둔다. 실제 서비스에서는 saveUpload() 안쪽만
// S3·Supabase Storage 업로드로 바꾸면 된다.

import { promises as fs } from 'fs';
import path from 'path';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

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
  /** 화면에서 그대로 쓰는 주소 (/uploads/xxx.jpg) */
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
    throw new Error(`${isVideo ? '동영상' : '이미지'}은 ${Math.round(limit / 1024 / 1024)}MB 까지 올릴 수 있습니다.`);
  }

  const ext = EXT[file.type] ?? (isVideo ? 'mp4' : 'jpg');
  const name = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}.${ext}`;

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));

  return {
    url: `/uploads/${name}`,
    type: isVideo ? 'video' : 'image',
    name: file.name,
    size: file.size,
  };
}

/** 더 이상 쓰지 않는 파일 지우기 (실패해도 조용히 넘어간다) */
export async function removeUpload(url?: string): Promise<void> {
  if (!url?.startsWith('/uploads/')) return;
  await fs.unlink(path.join(process.cwd(), 'public', url.replace(/^\//, ''))).catch(() => undefined);
}
