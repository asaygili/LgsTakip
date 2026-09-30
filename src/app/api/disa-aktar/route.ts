import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getValidSession } from "@/lib/session";
import { createZipStream, type ZipEntry } from "@/lib/zip";
import { startOfToday } from "@/lib/week";

export const dynamic = "force-dynamic";

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
  "application/pdf": "pdf",
};

function extensionFor(mimeType: string) {
  return EXTENSIONS[mimeType] ?? "bin";
}

const OKUBENI = `LGS Takip - veri yedeği
========================

veriler.json  : Tüm kayıtlar (ödevler, soru kayıtları, hatalar, denemeler,
                hedef okullar, konu durumları, haftalık hedef, kullanıcılar).
dosyalar/     : Ödev fotoğrafları ve hata kaydı dosyaları. veriler.json
                içindeki her kayıt kendi dosyasını "dosya" alanıyla gösterir.

Şifreler yedeğe dahil edilmez.

Bu dosyayı telefonunuzda veya bilgisayarınızda saklayın. Uygulamaya bir şey
olursa kayıtlar buradan geri yüklenebilir.
`;

export async function GET() {
  const session = await getValidSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const [
    users,
    subjects,
    homeworks,
    dailyLogs,
    mistakes,
    mockExams,
    targetSchools,
    goal,
  ] = await Promise.all([
    // Şifre özetleri kasten dışarıda bırakılır.
    prisma.user.findMany({
      select: { id: true, username: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.subject.findMany({
      include: { topics: { orderBy: { order: "asc" } } },
      orderBy: { order: "asc" },
    }),
    prisma.homework.findMany({
      include: {
        photos: { select: { id: true, mimeType: true, createdAt: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.dailyLog.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.mistake.findMany({
      include: {
        files: { select: { id: true, mimeType: true, fileName: true, size: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.mockExam.findMany({
      include: { results: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.targetSchool.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.goal.findUnique({ where: { id: "default" } }),
  ]);

  // Dosya adları JSON içinde de geçsin ki yedekten geri yükleme eşleştirebilsin.
  const homeworksOut = homeworks.map((hw) => ({
    ...hw,
    photos: hw.photos.map((p) => ({
      ...p,
      dosya: `dosyalar/odev-${p.id}.${extensionFor(p.mimeType)}`,
    })),
  }));
  const mistakesOut = mistakes.map((m) => ({
    ...m,
    files: m.files.map((f) => ({
      ...f,
      dosya: `dosyalar/hata-${f.id}.${extensionFor(f.mimeType)}`,
    })),
  }));

  const payload = {
    uygulama: "LGS Takip",
    surum: 1,
    olusturulma: new Date().toISOString(),
    kullanicilar: users,
    dersler: subjects,
    odevler: homeworksOut,
    soruKayitlari: dailyLogs,
    hatalar: mistakesOut,
    denemeler: mockExams,
    hedefOkullar: targetSchools,
    haftalikHedef: goal,
  };

  const photoIds = homeworks.flatMap((hw) => hw.photos.map((p) => p.id));
  const fileIds = mistakes.flatMap((m) => m.files.map((f) => f.id));

  async function* entries(): AsyncGenerator<ZipEntry> {
    const encoder = new TextEncoder();
    yield { name: "OKUBENI.txt", data: encoder.encode(OKUBENI) };
    yield {
      name: "veriler.json",
      data: encoder.encode(JSON.stringify(payload, null, 2)),
    };

    // Dosyalar tek tek çekilir: hepsini birden belleğe almak sunucuyu şişirirdi.
    for (const id of photoIds) {
      const photo = await prisma.homeworkPhoto.findUnique({ where: { id } });
      if (!photo) continue;
      yield {
        name: `dosyalar/odev-${photo.id}.${extensionFor(photo.mimeType)}`,
        data: new Uint8Array(photo.data),
      };
    }
    for (const id of fileIds) {
      const file = await prisma.mistakeFile.findUnique({ where: { id } });
      if (!file) continue;
      yield {
        name: `dosyalar/hata-${file.id}.${extensionFor(file.mimeType)}`,
        data: new Uint8Array(file.data),
      };
    }
  }

  const stamp = startOfToday().toISOString().slice(0, 10);

  return new NextResponse(createZipStream(entries()), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="lgs-takip-yedek-${stamp}.zip"`,
      "Cache-Control": "no-store",
    },
  });
}
