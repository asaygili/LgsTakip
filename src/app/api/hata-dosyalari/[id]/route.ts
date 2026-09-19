import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id } = await params;
  const file = await prisma.mistakeFile.findUnique({ where: { id } });
  if (!file) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Dosya adı ASCII dışı karakter içerebildiği için RFC 5987 biçimi kullanılır.
  const encodedName = encodeURIComponent(file.fileName);

  return new NextResponse(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.mimeType,
      "Content-Disposition": `inline; filename*=UTF-8''${encodedName}`,
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
