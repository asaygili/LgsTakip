import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import SubjectTopicSelect from "@/components/SubjectTopicSelect";
import DailyLogList from "./DailyLogList";
import { createDailyLog } from "./actions";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default async function SorularPage() {
  await requireSession();

  const [subjects, logs] = await Promise.all([
    prisma.subject.findMany({
      orderBy: { order: "asc" },
      include: { topics: { orderBy: { order: "asc" } } },
    }),
    prisma.dailyLog.findMany({
      orderBy: { date: "desc" },
      include: { subject: true, topic: true },
      take: 100,
    }),
  ]);

  const items = logs.map((log) => ({ ...log, date: log.date.toISOString() }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Sorular</h1>
        <p className="text-sm text-gray-500">
          Günlük çözülen soruları ders ve konu bazında kaydedin.
        </p>
      </div>

      <form action={createDailyLog} className="card space-y-3">
        <SubjectTopicSelect subjects={subjects} />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Tarih</label>
            <input type="date" name="date" className="input" defaultValue={todayStr()} required />
          </div>
          <div>
            <label className="label">Süre (dk, opsiyonel)</label>
            <input type="number" min={0} name="duration" className="input" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label">Doğru</label>
            <input type="number" min={0} name="correct" className="input" defaultValue={0} required />
          </div>
          <div>
            <label className="label">Yanlış</label>
            <input type="number" min={0} name="wrong" className="input" defaultValue={0} required />
          </div>
          <div>
            <label className="label">Boş</label>
            <input type="number" min={0} name="blank" className="input" defaultValue={0} required />
          </div>
        </div>
        <div>
          <label className="label">Not (opsiyonel)</label>
          <textarea name="notes" className="input" rows={2} />
        </div>
        <button type="submit" className="btn-primary">
          Kaydet
        </button>
      </form>

      <DailyLogList items={items} />
    </div>
  );
}
