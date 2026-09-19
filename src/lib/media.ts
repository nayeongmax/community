// 미디어 저장소
//
// 이미지·동영상은 localStorage 에 담기엔 너무 커서 IndexedDB 에 Blob 그대로 넣는다.
// 글·커뮤니티에는 여기서 받은 id 만 저장하고, 화면에서 blob URL 로 바꿔 쓴다.
//
// 실제 서비스로 갈 때는 putMedia/mediaUrl 두 함수만 스토리지 업로드로 바꾸면 된다.

const DB_NAME = 'community-media';
const STORE = 'files';
const VERSION = 1;

/** 이미지 저장 시 줄이는 최대 가로 픽셀 */
const IMAGE_MAX_WIDTH = 1400;
/** 동영상 최대 용량 */
export const VIDEO_MAX_BYTES = 40 * 1024 * 1024;

export interface MediaMeta {
  id: string;
  type: string;
  size: number;
  name: string;
  createdAt: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('미디어 저장소를 열지 못했습니다.'));
  });
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = run(t.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error ?? new Error('미디어 처리에 실패했습니다.'));
        t.oncomplete = () => db.close();
      })
  );
}

function uid(): string {
  return 'm_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

/** 이미지를 캔버스로 줄인다 (원본이 작으면 그대로 둔다) */
async function shrinkImage(file: File): Promise<Blob> {
  const bitmapUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('이미지를 열지 못했습니다.'));
      el.src = bitmapUrl;
    });
    if (img.width <= IMAGE_MAX_WIDTH) return file;

    const scale = IMAGE_MAX_WIDTH / img.width;
    const canvas = document.createElement('canvas');
    canvas.width = IMAGE_MAX_WIDTH;
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const isPng = file.type === 'image/png';
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, isPng ? 'image/png' : 'image/jpeg', 0.85)
    );
    return blob ?? file;
  } finally {
    URL.revokeObjectURL(bitmapUrl);
  }
}

/** 파일을 저장하고 id 를 돌려준다 */
export async function putMedia(file: File): Promise<MediaMeta> {
  const isImage = file.type.startsWith('image/');
  const isVideo = file.type.startsWith('video/');
  if (!isImage && !isVideo) throw new Error('이미지 또는 동영상 파일만 올릴 수 있습니다.');
  if (isVideo && file.size > VIDEO_MAX_BYTES) {
    throw new Error(`동영상은 ${Math.round(VIDEO_MAX_BYTES / 1024 / 1024)}MB 까지 올릴 수 있습니다.`);
  }

  const blob = isImage ? await shrinkImage(file) : file;
  const meta: MediaMeta = {
    id: uid(),
    type: blob.type || file.type,
    size: blob.size,
    name: file.name,
    createdAt: new Date().toISOString(),
  };
  await tx('readwrite', (s) => s.put({ ...meta, blob }));
  return meta;
}

const urlCache = new Map<string, string>();

/** 저장된 미디어를 화면에서 쓸 수 있는 URL 로 바꾼다 */
export async function mediaUrl(id: string): Promise<string | null> {
  const cached = urlCache.get(id);
  if (cached) return cached;

  const row = await tx<{ blob: Blob } | undefined>('readonly', (s) => s.get(id));
  if (!row?.blob) return null;

  const url = URL.createObjectURL(row.blob);
  urlCache.set(id, url);
  return url;
}

export async function deleteMedia(id: string): Promise<void> {
  const url = urlCache.get(id);
  if (url) {
    URL.revokeObjectURL(url);
    urlCache.delete(id);
  }
  await tx('readwrite', (s) => s.delete(id));
}

export function formatBytes(n: number): string {
  if (n >= 1024 * 1024) return (n / 1024 / 1024).toFixed(1) + 'MB';
  return Math.max(1, Math.round(n / 1024)) + 'KB';
}
