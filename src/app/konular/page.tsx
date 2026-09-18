import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import TopicStatusPicker from "./TopicStatusPicker";

export default async function KonularPage() {
  await requireSession();

  const subjects = await prisma.subject.findMany({
    orderBy: { order: "asc" },
    include: { topics: { orderBy: { order: "asc" } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Konular</h1>
        <p className="text-sm text-gray-500">
          Her konunun öğrenilme durumunu güncelleyerek eksik konuları görün.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {subjects.map((subject) => {
          const mastered = subject.topics.filter((t) => t.status === "OGRENILDI").length;
          const total = subject.topics.length;
          const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;

          return (
            <div key={subject.id} className="card">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">{subject.name}</h2>
                <span className="text-xs text-gray-500">
                  {mastered}/{total} öğrenildi (%{pct})
                </span>
              </div>
              <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-brand-600"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <ul className="space-y-2">
                {subject.topics.map((topic) => (
                  <li key={topic.id} className="flex items-center justify-between gap-2">
                    <span className="text-sm text-gray-700">{topic.name}</span>
                    <TopicStatusPicker topicId={topic.id} status={topic.status} />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
