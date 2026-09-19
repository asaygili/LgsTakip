// Dosyalar diskte değil, veritabanında saklanır. Böylece uygulama kalıcı disk
// (volume) yapılandırması gerektirmeden çalışır ve yeniden başlatmalarda veri
// kaybolmaz. Depolamanın şişmemesi için asıl iş tarayıcıda yapılır
// (src/lib/compress.ts): fotoğraflar yüklenmeden önce küçültülür. Buradaki
// sınırlar son emniyet kemeridir — sıkıştırmayı atlatan bir istek de reddedilir.

const IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);
const PDF_TYPE = "application/pdf";

/** Sıkıştırma sonrası tek dosya için üst sınır. */
export const MAX_FILE_BYTES = 2 * 1024 * 1024;
/** Bir kayda eklenebilecek en fazla dosya. */
export const MAX_FILES_PER_RECORD = 5;

export type UploadInput = {
  mimeType: string;
  fileName: string;
  size: number;
  data: Buffer;
};

function isAllowed(type: string, allowPdf: boolean) {
  return IMAGE_TYPES.has(type) || (allowPdf && type === PDF_TYPE);
}

export async function readUploadFiles(
  files: File[],
  { allowPdf = false }: { allowPdf?: boolean } = {}
): Promise<UploadInput[]> {
  const valid = files
    .filter(
      (f) =>
        f &&
        f.size > 0 &&
        f.size <= MAX_FILE_BYTES &&
        isAllowed(f.type, allowPdf)
    )
    .slice(0, MAX_FILES_PER_RECORD);

  return Promise.all(
    valid.map(async (file) => ({
      mimeType: file.type,
      fileName: file.name || "dosya",
      size: file.size,
      data: Buffer.from(await file.arrayBuffer()),
    }))
  );
}

/** Ödev fotoğrafları yalnızca görsel kabul eder ve ek alan tutmaz. */
export async function readPhotoFiles(files: File[]) {
  const uploads = await readUploadFiles(files);
  return uploads.map(({ mimeType, data }) => ({ mimeType, data }));
}
