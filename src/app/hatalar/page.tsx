import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import SubjectTopicSelect from "@/components/SubjectTopicSelect";
import MistakeList from "./MistakeList";
import { createMistake } from "./actions";
import { MISTAKE_REASON_LABELS } from "@/lib/labels";

export default async function HatalarPage() {
  await requireSession();

  const [subjects, mistakes] = await Promise.all([
    prisma.subject.findMany({
      orderBy: { order: "asc" },
      include: { topics: { orderBy: { order: "asc" } } },
    }),
    prisma.mistake.findMany({
      orderBy: [{ resolved: "asc" }, { createdAt: "desc" }],
      include: { subject: true, topic: true },
      take: 150,
    }),
  ]);

  const items = mistakes.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Hatalar</h1>
        <p className="text-sm text-gray-500">
          Yanlış yapılan soruları nedeniyle birlikte kaydedin, tekrar aynı hatayı önleyin.
        </p>
      </div>

      <form action={createMistake} className="card space-y-3">
        <SubjectTopicSelect subjects={subjects} />
        <div>
          <label className="label">Hata nedeni</label>
          <select name="reason" className="input" required defaultValue="">
            <option value="" disabled>
              Seçin
            </option>
            {Object.entries(MISTAKE_REASON_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Açıklama (opsiyonel)</label>
          <textarea
            name="description"
            className="input"
            rows={2}
            placeholder="Örn: Ondalık sayılarda virgülü kaydırmayı unuttu"
          />
        </div>
        <button type="submit" className="btn-primary">
          Hata Ekle
        </button>
      </form>

      <MistakeList items={items} />
    </div>
  );
}
