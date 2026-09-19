import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import MockExamForm from "./MockExamForm";
import MockExamList from "./MockExamList";

export default async function DenemelerPage() {
  await requireSession();

  const [subjects, exams] = await Promise.all([
    prisma.subject.findMany({ orderBy: { order: "asc" } }),
    prisma.mockExam.findMany({
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      include: {
        results: { include: { subject: true } },
        user: { select: { name: true, role: true } },
      },
      take: 50,
    }),
  ]);

  const items = exams.map((e) => ({ ...e, date: e.date.toISOString() }));

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
