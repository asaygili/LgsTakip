import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

// UPLOADS_DIR ortam değişkeni Railway gibi platformlarda kalıcı bir disk
// (volume) yoluna işaret etmelidir (ör. /data/uploads). Yerelde ise proje
// klasörü altındaki data/uploads kullanılır.
const BASE_DIR = process.env.UPLOADS_DIR || path.join(process.cwd(), "data", "uploads");
const UPLOAD_DIR = path.join(BASE_DIR, "homework");
export const PUBLIC_PREFIX = "/api/photos";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif", "image/heic"]);
const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
};
const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8MB

export async function savePhotoFiles(files: File[]): Promise<string[]> {
  const validFiles = files.filter(
    (f) => f && f.size > 0 && ALLOWED_TYPES.has(f.type) && f.size <= MAX_SIZE_BYTES
  );
  if (validFiles.length === 0) return [];

  await mkdir(UPLOAD_DIR, { recursive: true });

  const paths: string[] = [];
  for (const file of validFiles) {
    const ext = EXT_BY_TYPE[file.type] ?? "jpg";
    const filename = `${crypto.randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(UPLOAD_DIR, filename), buffer);
    paths.push(`${PUBLIC_PREFIX}/${filename}`);
  }
  return paths;
}

export async function deletePhotoFile(publicPath: string) {
  const filename = filenameFromPublicPath(publicPath);
  if (!filename) return;
  try {
    await unlink(path.join(UPLOAD_DIR, filename));
  } catch {
    // dosya zaten yoksa yoksay
  }
}

export function filenameFromPublicPath(publicPath: string): string | null {
  if (!publicPath.startsWith(PUBLIC_PREFIX + "/")) return null;
  const filename = publicPath.slice(PUBLIC_PREFIX.length + 1);
  if (!filename || filename.includes("/") || filename.includes("..")) return null;
  return filename;
}

export function resolveUploadPath(filename: string) {
  return path.join(UPLOAD_DIR, filename);
}
