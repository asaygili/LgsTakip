import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import DailyLogForm from "./DailyLogForm";
import DailyLogList from "./DailyLogList";

export default async function SorularPage() {
  await requireSession();

  const [subjects, logs] = await Promise.all([
    prisma.subject.findMany({
      orderBy: { order: "asc" },
      include: { topics: { orderBy: { order: "asc" } } },
    }),
    prisma.dailyLog.findMany({
      orderBy: { date: "desc" },
      include: {
        subject: true,
        topic: true,
        user: { select: { name: true, role: true } },
      },
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

      <DailyLogForm subjects={subjects} />
      <DailyLogList items={items} subjects={subjects} />
    </div>
  );
}
