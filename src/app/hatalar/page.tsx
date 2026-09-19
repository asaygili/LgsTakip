import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import MistakeForm from "./MistakeForm";
import MistakeList from "./MistakeList";

export default async function HatalarPage() {
  await requireSession();

  const [subjects, mistakes] = await Promise.all([
    prisma.subject.findMany({
      orderBy: { order: "asc" },
      include: { topics: { orderBy: { order: "asc" } } },
    }),
    // En yeni 150 kayıt çekilir, sonra listede eskiden yeniye sıralanır:
    // yeni eklenen kayıt hep en altta olur.
    prisma.mistake.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        subject: true,
        topic: true,
        user: { select: { name: true, role: true } },
      },
      take: 150,
    }),
  ]);

  const items = mistakes
    .map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }))
    .reverse();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Hatalar</h1>
        <p className="text-sm text-gray-500">
          Yanlış yapılan soruları nedeniyle birlikte kaydedin, tekrar aynı hatayı önleyin.
        </p>
      </div>

      <MistakeForm subjects={subjects} />

      <MistakeList items={items} subjects={subjects} />
    </div>
  );
}
