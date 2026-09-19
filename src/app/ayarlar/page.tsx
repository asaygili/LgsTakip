import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { formatBytes } from "@/lib/compress";
import ChangePasswordForm from "./ChangePasswordForm";
import GoalForm from "./GoalForm";

export default async function AyarlarPage() {
  const session = await requireSession();

  // Yüklenen dosyalar veritabanında tutulduğu için toplam boyut burada
  // görünür olsun; şişmeye başlarsa fark edilir.
  const [goal, storage, photoCount, fileCount] = await Promise.all([
    prisma.goal.findUnique({ where: { id: "default" } }),
    prisma.$queryRaw<{ total: bigint | null }[]>`
      SELECT
        COALESCE((SELECT SUM(octet_length(data)) FROM "HomeworkPhoto"), 0)
        + COALESCE((SELECT SUM(octet_length(data)) FROM "MistakeFile"), 0) AS total
    `,
    prisma.homeworkPhoto.count(),
    prisma.mistakeFile.count(),
  ]);

  const totalBytes = Number(storage[0]?.total ?? 0);
  const totalCount = photoCount + fileCount;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Ayarlar</h1>
        <p className="text-sm text-gray-500">
          {session.user.name} hesabının şifresini ve haftalık hedefinizi buradan
          yönetebilirsiniz.
        </p>
      </div>

      <GoalForm
        weeklyQuestions={goal?.weeklyQuestions ?? null}
        weeklyMinutes={goal?.weeklyMinutes ?? null}
        weeklyExams={goal?.weeklyExams ?? null}
      />

      <ChangePasswordForm />

      <section className="card max-w-sm">
        <h2 className="font-semibold text-gray-900">Depolama</h2>
        <p className="mt-0.5 text-xs text-gray-500">
          Ödev fotoğrafları ve hata kaydı dosyaları veritabanında saklanır.
        </p>
        <p className="mt-2 text-sm text-gray-700">
          {totalCount} dosya ·{" "}
          <span className="font-semibold text-brand-700">{formatBytes(totalBytes)}</span>
        </p>
        {totalCount > 0 && (
          <p className="mt-1 text-xs text-gray-400">
            Dosya başına ortalama {formatBytes(Math.round(totalBytes / totalCount))}.
            Fotoğraflar yüklenmeden önce tarayıcıda küçültülüyor.
          </p>
        )}
      </section>
    </div>
  );
}
