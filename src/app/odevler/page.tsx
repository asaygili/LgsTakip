import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import SubjectTopicSelect from "@/components/SubjectTopicSelect";
import HomeworkList from "./HomeworkList";
import { createHomework } from "./actions";

export default async function OdevlerPage() {
  await requireSession();

  const [subjects, homeworks] = await Promise.all([
    prisma.subject.findMany({
      orderBy: { order: "asc" },
      include: { topics: { orderBy: { order: "asc" } } },
    }),
    prisma.homework.findMany({
      orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
      include: { subject: true, topic: true },
    }),
  ]);

  const items = homeworks.map((hw) => ({
    ...hw,
    dueDate: hw.dueDate ? hw.dueDate.toISOString() : null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Ödevler</h1>
        <p className="text-sm text-gray-500">
          Verilen ödevleri ekleyin, durumlarını takip edin.
        </p>
      </div>

      <form action={createHomework} className="card space-y-3">
        <div>
          <label className="label">Ödev başlığı</label>
          <input name="title" className="input" placeholder="Örn: Sayfa 45-48 arası test" required />
        </div>
        <SubjectTopicSelect subjects={subjects} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Son tarih (opsiyonel)</label>
            <input type="date" name="dueDate" className="input" />
          </div>
        </div>
        <div>
          <label className="label">Açıklama (opsiyonel)</label>
          <textarea name="description" className="input" rows={2} />
        </div>
        <button type="submit" className="btn-primary">
          Ödev Ekle
        </button>
      </form>

      <HomeworkList items={items} />
    </div>
  );
}
