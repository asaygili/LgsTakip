import { prisma } from "@/lib/prisma";

// Tarayıcıda uzun süre açık kalmış bir sayfa, veritabanında artık bulunmayan
// ders/konu kimlikleri gönderebilir (ör. veritabanı yeniden oluşturulduysa).
// Böyle bir durumda foreign key hatasıyla çökmek yerine null döneriz; çağıran
// taraf kaydı atlar ve kullanıcı sayfayı yenileyince güncel seçeneklerle devam
// eder.
export async function resolveSubjectAndTopic(subjectId: string, topicId: string | null) {
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    select: { id: true },
  });
  if (!subject) return null;

  if (!topicId) return { subjectId, topicId: null };

  const topic = await prisma.topic.findFirst({
    where: { id: topicId, subjectId },
    select: { id: true },
  });

  return { subjectId, topicId: topic ? topicId : null };
}
