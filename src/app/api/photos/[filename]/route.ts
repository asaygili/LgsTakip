import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { resolveUploadPath } from "@/lib/uploads";

const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { filename } = await params;
  if (!filename || filename.includes("/") || filename.includes("..")) {
    return new NextResponse("Not found", { status: 404 });
  }

  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const contentType = CONTENT_TYPE_BY_EXT[ext];
  if (!contentType) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const buffer = await readFile(resolveUploadPath(filename));
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
