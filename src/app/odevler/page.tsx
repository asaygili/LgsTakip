import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import HomeworkForm from "./HomeworkForm";
import HomeworkList from "./HomeworkList";

export default async function OdevlerPage() {
  await requireSession();

  const [subjects, homeworks] = await Promise.all([
    prisma.subject.findMany({
      orderBy: { order: "asc" },
      include: { topics: { orderBy: { order: "asc" } } },
    }),
    // Girilme sırasına göre eskiden yeniye: yeni eklenen ödev hep en altta olur.
    prisma.homework.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        subject: true,
        topic: true,
        photos: { select: { id: true }, orderBy: { createdAt: "asc" } },
        createdBy: { select: { name: true, role: true } },
      },
    }),
  ]);

  const items = homeworks.map((hw) => ({
    ...hw,
    assignedDate: hw.assignedDate.toISOString(),
    dueDate: hw.dueDate ? hw.dueDate.toISOString() : null,
    createdAt: hw.createdAt.toISOString(),
    photos: hw.photos,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Ödevler</h1>
        <p className="text-sm text-gray-500">
          Öğretmenin verdiği ödevleri gün gün, sayfa aralığı ve fotoğrafıyla kaydedin.
        </p>
      </div>

      <HomeworkForm subjects={subjects} />

      <HomeworkList items={items} subjects={subjects} />
    </div>
  );
}
