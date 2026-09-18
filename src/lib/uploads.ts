import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "homework");
const PUBLIC_PREFIX = "/uploads/homework";

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
  if (!publicPath.startsWith(PUBLIC_PREFIX + "/")) return;
  const filename = publicPath.slice(PUBLIC_PREFIX.length + 1);
  if (!filename || filename.includes("/") || filename.includes("..")) return;
  try {
    await unlink(path.join(UPLOAD_DIR, filename));
  } catch {
    // dosya zaten yoksa yoksay
  }
}
