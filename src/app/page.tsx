import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import WeeklyTrendChart from "@/components/WeeklyTrendChart";
import { HOMEWORK_STATUS_COLORS, HOMEWORK_STATUS_LABELS } from "@/lib/labels";
import { netOf, calculateLgsPuan } from "@/lib/lgs";

function startOfDay(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function dayLabel(d: Date) {
  return d.toLocaleDateString("tr-TR", { weekday: "short", day: "numeric", month: "numeric" });
}

export default async function DashboardPage() {
  await requireSession();

  const today = startOfDay(new Date());
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - 6);

  const [weekLogs, todayLogs, pendingHomeworks, mistakes, topicCounts, lastExam] =
    await Promise.all([
      prisma.dailyLog.findMany({
        where: { date: { gte: weekStart } },
      }),
      prisma.dailyLog.findMany({
        where: { date: { gte: today } },
      }),
      prisma.homework.findMany({
        where: { status: { not: "TAMAMLANDI" } },
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
        include: { subject: true, topic: true },
        take: 5,
      }),
      prisma.mistake.findMany({
        where: { resolved: false },
        include: { topic: true, subject: true },
      }),
      prisma.topic.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.mockExam.findFirst({
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        include: { results: { include: { subject: true } } },
      }),
    ]);

  const days: { label: string; Doğru: number; Yanlış: number; Boş: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const dayLogs = weekLogs.filter((l) => l.date >= d && l.date < next);
    days.push({
      label: dayLabel(d),
      Doğru: dayLogs.reduce((s, l) => s + l.questionsCorrect, 0),
      Yanlış: dayLogs.reduce((s, l) => s + l.questionsWrong, 0),
      Boş: dayLogs.reduce((s, l) => s + l.questionsBlank, 0),
    });
  }

  const weekTotal = weekLogs.reduce(
    (s, l) => s + l.questionsCorrect + l.questionsWrong + l.questionsBlank,
    0
  );
  const todayTotal = todayLogs.reduce(
    (s, l) => s + l.questionsCorrect + l.questionsWrong + l.questionsBlank,
    0
  );

  const mistakeByTopic = new Map<
    string,
    { topicName: string; subjectName: string; count: number }
  >();
  for (const m of mistakes) {
    if (!m.topic) continue;
    const key = m.topic.id;
    const existing = mistakeByTopic.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      mistakeByTopic.set(key, {
        topicName: m.topic.name,
        subjectName: m.subject.name,
        count: 1,
      });
    }
  }
  const topMistakeTopics = Array.from(mistakeByTopic.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const masteredCount = topicCounts.find((t) => t.status === "OGRENILDI")?._count._all ?? 0;
  const totalTopics = topicCounts.reduce((s, t) => s + t._count._all, 0);

  const lastExamNet = lastExam
    ? lastExam.results.reduce((s, r) => s + netOf(r), 0)
    : null;
  const lastExamPuan = lastExam
    ? calculateLgsPuan(
        lastExam.results.map((r) => ({
          subjectName: r.subject.name,
          correct: r.correct,
          wrong: r.wrong,
        }))
      )
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Panel</h1>
        <p className="text-sm text-gray-500">Genel durum özeti</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Bugün Çözülen" value={todayTotal} />
        <StatCard label="Bu Hafta Çözülen" value={weekTotal} />
        <StatCard label="Bekleyen Ödev" value={pendingHomeworks.length} />
        <StatCard
          label="Öğrenilen Konu"
          value={totalTopics > 0 ? `${masteredCount}/${totalTopics}` : "-"}
        />
      </div>

      <div className="card">
        <h2 className="mb-3 font-semibold text-gray-900">Son 7 Gün Soru Trendi</h2>
        <WeeklyTrendChart data={days} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">En Çok Hata Yapılan Konular</h2>
            <Link href="/hatalar" className="text-xs font-medium text-brand-700">
              Tümü
            </Link>
          </div>
          {topMistakeTopics.length === 0 ? (
            <p className="text-sm text-gray-500">Çözülmemiş hata kaydı yok. Harika!</p>
          ) : (
            <ul className="space-y-2">
              {topMistakeTopics.map((t) => (
                <li key={t.topicName} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">
                    {t.topicName} <span className="text-gray-400">· {t.subjectName}</span>
                  </span>
                  <span className="badge bg-red-50 text-red-600">{t.count} hata</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Yaklaşan Ödevler</h2>
            <Link href="/odevler" className="text-xs font-medium text-brand-700">
              Tümü
            </Link>
          </div>
          {pendingHomeworks.length === 0 ? (
            <p className="text-sm text-gray-500">Bekleyen ödev yok.</p>
          ) : (
            <ul className="space-y-2">
              {pendingHomeworks.map((hw) => (
                <li key={hw.id} className="flex items-center justify-between text-sm">
                  <span className="min-w-0 truncate text-gray-700">
                    {hw.title} <span className="text-gray-400">· {hw.subject.name}</span>
                  </span>
                  <span className={`badge shrink-0 ${HOMEWORK_STATUS_COLORS[hw.status]}`}>
                    {HOMEWORK_STATUS_LABELS[hw.status]}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {lastExam && (
        <div className="card">
          <h2 className="mb-1 font-semibold text-gray-900">Son Deneme</h2>
          <p className="text-sm text-gray-600">
            {lastExam.name} · {new Date(lastExam.date).toLocaleDateString("tr-TR")} · Net:{" "}
            <span className="font-semibold text-brand-700">{lastExamNet?.toFixed(2)}</span>
            {lastExamPuan !== null && (
              <>
                {" "}
                · Tahmini Puan:{" "}
                <span className="font-semibold text-brand-700">{lastExamPuan.toFixed(2)}</span>
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
