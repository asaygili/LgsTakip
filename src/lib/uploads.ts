// Fotoğraflar diskte değil, veritabanında saklanır. Böylece uygulama
// kalıcı disk (volume) yapılandırması gerektirmeden çalışır ve yeniden
// başlatmalarda veri kaybı olmaz.

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic"]);
const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8MB

export type PhotoInput = { mimeType: string; data: Buffer };

export async function readPhotoFiles(files: File[]): Promise<PhotoInput[]> {
  const validFiles = files.filter(
    (f) => f && f.size > 0 && ALLOWED_TYPES.has(f.type) && f.size <= MAX_SIZE_BYTES
  );

  return Promise.all(
    validFiles.map(async (file) => ({
      mimeType: file.type,
      data: Buffer.from(await file.arrayBuffer()),
    }))
  );
}
