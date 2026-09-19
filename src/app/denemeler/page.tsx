import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import MockExamForm from "./MockExamForm";
import MockExamList from "./MockExamList";

export default async function DenemelerPage() {
  await requireSession();

  const [subjects, exams] = await Promise.all([
    prisma.subject.findMany({ orderBy: { order: "asc" } }),
    // Sıralama girilme zamanına göre: en son eklenen deneme listenin sonunda
    // çıksın diye en yeni 50 deneme çekilip aşağıda ters çevriliyor.
    prisma.mockExam.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        results: { include: { subject: true } },
        user: { select: { name: true, role: true } },
      },
      take: 50,
    }),
  ]);

  const items = exams
    .map((e) => ({
      ...e,
      date: e.date.toISOString(),
      createdAt: e.createdAt.toISOString(),
    }))
    .reverse();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Denemeler</h1>
        <p className="text-sm text-gray-500">
          Deneme sınavı sonuçlarını kaydedin, net gelişimini takip edin.
        </p>
      </div>

      <MockExamForm subjects={subjects} />
      <MockExamList items={items} subjects={subjects} />
    </div>
  );
}
