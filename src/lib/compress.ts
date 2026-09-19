// Fotoğraf sıkıştırma (yalnızca tarayıcıda çalışır).
//
// Telefon kamerası 3–8 MB'lık JPEG üretir. Bunları olduğu gibi saklamak
// veritabanını hızla şişirir: günde 3 fotoğraf ≈ ayda 500 MB. Soru fotoğrafının
// okunabilir olması için bu çözünürlük gerekmiyor — uzun kenarı 1600 piksele
// indirip yeniden kodlayınca dosya tipik olarak 10–20 kat küçülüyor ve metin
// hâlâ rahat okunuyor.

/** Uzun kenar için üst sınır (piksel). */
export const MAX_EDGE = 1600;
/** Sıkıştırma sonrası kabul edilen en büyük dosya. */
export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
/** Bir kayda eklenebilecek en fazla dosya. */
export const MAX_FILES = 5;

/** Kalite kademeleri: hedef boyutun altına inene kadar sırayla denenir. */
const QUALITY_STEPS = [0.72, 0.6, 0.5, 0.42];

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isImage(file: File) {
  return file.type.startsWith("image/");
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
}

/**
 * Görseli küçültüp JPEG olarak yeniden kodlar. Sıkıştırılamazsa (tarayıcı
 * desteklemiyor, bozuk dosya, HEIC çözülemedi) dosyayı olduğu gibi döndürür;
 * boyut denetimini sunucu yine yapar.
 */
export async function compressImage(file: File): Promise<File> {
  if (!isImage(file)) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    // Şeffaf PNG'ler JPEG'e çevrilince siyah olmasın diye beyaz zemin.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close?.();

    let best: Blob | null = null;
    for (const quality of QUALITY_STEPS) {
      const blob = await canvasToBlob(canvas, quality);
      if (!blob) break;
      best = blob;
      if (blob.size <= MAX_UPLOAD_BYTES) break;
    }
    if (!best) return file;

    // Sıkıştırma büyüttüyse (çok küçük görseller) orijinali koru.
    if (best.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") || "foto";
    return new File([best], `${name}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    return file;
  }
}
