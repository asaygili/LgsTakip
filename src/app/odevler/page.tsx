import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import SubjectTopicSelect from "@/components/SubjectTopicSelect";
import HomeworkList from "./HomeworkList";
import { createHomework } from "./actions";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default async function OdevlerPage() {
  await requireSession();

  const [subjects, homeworks] = await Promise.all([
    prisma.subject.findMany({
      orderBy: { order: "asc" },
      include: { topics: { orderBy: { order: "asc" } } },
    }),
    prisma.homework.findMany({
      orderBy: [{ assignedDate: "desc" }, { createdAt: "desc" }],
      include: { subject: true, topic: true, photos: true },
    }),
  ]);

  const items = homeworks.map((hw) => ({
    ...hw,
    assignedDate: hw.assignedDate.toISOString(),
    dueDate: hw.dueDate ? hw.dueDate.toISOString() : null,
    photos: hw.photos.map((p) => ({ ...p, createdAt: p.createdAt.toISOString() })),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Ödevler</h1>
        <p className="text-sm text-gray-500">
          Öğretmenin verdiği ödevleri gün gün, sayfa aralığı ve fotoğrafıyla kaydedin.
        </p>
      </div>

      <form action={createHomework} className="card space-y-3">
        <div>
          <label className="label">Ödev başlığı</label>
          <input name="title" className="input" placeholder="Örn: Test kitabı testleri" required />
        </div>
        <SubjectTopicSelect subjects={subjects} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Sayfa aralığı (opsiyonel)</label>
            <input name="pages" className="input" placeholder="Örn: 45-48" />
          </div>
          <div>
            <label className="label">Son tarih (opsiyonel)</label>
            <input type="date" name="dueDate" className="input" />
          </div>
        </div>
        <div>
          <label className="label">Verildiği tarih</label>
          <input type="date" name="assignedDate" className="input" defaultValue={todayStr()} required />
        </div>
        <div>
          <label className="label">Açıklama (opsiyonel)</label>
          <textarea name="description" className="input" rows={2} />
        </div>
        <div>
          <label className="label">Ders fotoğrafı (opsiyonel, birden fazla seçilebilir)</label>
          <input
            type="file"
            name="photos"
            accept="image/*"
            multiple
            className="input file:mr-3 file:rounded-lg file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-brand-700"
          />
        </div>
        <button type="submit" className="btn-primary">
          Ödev Ekle
        </button>
      </form>

      <HomeworkList items={items} />
    </div>
  );
}
