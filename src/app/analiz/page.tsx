import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { netOf, calculateLgsPuan } from "@/lib/lgs";
import { MISTAKE_REASON_LABELS } from "@/lib/labels";
import ChartCard from "@/components/charts/ChartCard";
import ScoreTrendChart from "@/components/charts/ScoreTrendChart";
import SubjectNetTrendChart from "@/components/charts/SubjectNetTrendChart";
import HorizontalBarChart from "@/components/charts/HorizontalBarChart";
import AccuracyTrendChart from "@/components/charts/AccuracyTrendChart";

function shortDate(d: Date) {
  return d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

function startOfWeek(d: Date) {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  const day = (copy.getDay() + 6) % 7; // pazartesi = 0
  copy.setDate(copy.getDate() - day);
  return copy;
}

export default async function AnalizPage() {
  await requireSession();

  const [exams, subjects, mistakes, dailyLogs, targetSchools] = await Promise.all([
    prisma.mockExam.findMany({
      orderBy: [{ date: "asc" }, { createdAt: "asc" }],
      include: { results: { include: { subject: true } } },
      take: 40,
    }),
    prisma.subject.findMany({ orderBy: { order: "asc" } }),
    prisma.mistake.findMany({ include: { subject: true, topic: true } }),
    prisma.dailyLog.findMany({
      orderBy: { date: "asc" },
      include: { topic: true, subject: true },
    }),
    prisma.targetSchool.findMany({
      where: { cutoffScore: { not: null } },
      orderBy: { cutoffScore: "asc" },
    }),
  ]);

  // --- Deneme: tahmini puan gelişimi ---
  const scorePoints = exams
    .map((e) => ({
      label: shortDate(e.date),
      name: e.name,
      puan: calculateLgsPuan(
        e.results.map((r) => ({
          subjectName: r.subject.name,
          correct: r.correct,
          wrong: r.wrong,
        }))
      ),
    }))
    .filter((p): p is { label: string; name: string; puan: number } => p.puan !== null);

  const easiestTarget = targetSchools[0] ?? null;

  // --- Deneme: ders bazında net gelişimi ---
  const subjectNames = subjects.map((s) => s.name);
  const netRows = exams.map((e) => {
    const row: Record<string, string | number> = { label: shortDate(e.date) };
    for (const r of e.results) {
      row[r.subject.name] = Number(netOf(r).toFixed(2));
    }
    return row;
  });
  const usedSubjects = subjectNames.filter((n) => netRows.some((r) => r[n] !== undefined));

  // --- Son denemede ders bazlı net ---
  const lastExam = exams[exams.length - 1] ?? null;
  const lastExamBars = lastExam
    ? lastExam.results
        .map((r) => ({ label: r.subject.name, value: Number(netOf(r).toFixed(2)) }))
        .sort((a, b) => b.value - a.value)
    : [];

  // --- Hata nedeni dağılımı ---
  const reasonCounts = new Map<string, number>();
  for (const m of mistakes) {
    reasonCounts.set(m.reason, (reasonCounts.get(m.reason) ?? 0) + 1);
  }
  const reasonBars = Array.from(reasonCounts.entries())
    .map(([reason, count]) => ({ label: MISTAKE_REASON_LABELS[reason] ?? reason, value: count }))
    .sort((a, b) => b.value - a.value);

  // --- Konu bazlı hata sayısı (ilk 10) ---
  const topicMistakes = new Map<string, { label: string; value: number }>();
  for (const m of mistakes) {
    if (!m.topic) continue;
    const entry = topicMistakes.get(m.topic.id);
    if (entry) entry.value += 1;
    else topicMistakes.set(m.topic.id, { label: m.topic.name, value: 1 });
  }
  const topicMistakeBars = Array.from(topicMistakes.values())
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  // --- Haftalık doğruluk oranı ---
  const weekBuckets = new Map<number, { correct: number; wrong: number; total: number }>();
  for (const log of dailyLogs) {
    const key = startOfWeek(log.date).getTime();
    const b = weekBuckets.get(key) ?? { correct: 0, wrong: 0, total: 0 };
    b.correct += log.questionsCorrect;
    b.wrong += log.questionsWrong;
    b.total += log.questionsCorrect + log.questionsWrong + log.questionsBlank;
    weekBuckets.set(key, b);
  }
  const accuracyPoints = Array.from(weekBuckets.entries())
    .sort((a, b) => a[0] - b[0])
    .slice(-8)
    .filter(([, b]) => b.correct + b.wrong > 0)
    .map(([week, b]) => ({
      label: shortDate(new Date(week)),
      oran: Number(((b.correct / (b.correct + b.wrong)) * 100).toFixed(1)),
      soru: b.total,
    }));

  // --- Zayıf konu radarı ---
  const weakness = new Map<
    string,
    { topic: string; subject: string; wrong: number; correct: number; mistakes: number }
  >();
  for (const log of dailyLogs) {
    if (!log.topic) continue;
    const e = weakness.get(log.topic.id) ?? {
      topic: log.topic.name,
      subject: log.subject.name,
      wrong: 0,
      correct: 0,
      mistakes: 0,
    };
    e.wrong += log.questionsWrong;
    e.correct += log.questionsCorrect;
    weakness.set(log.topic.id, e);
  }
  for (const m of mistakes) {
    if (!m.topic) continue;
    const e = weakness.get(m.topic.id) ?? {
      topic: m.topic.name,
      subject: m.subject.name,
      wrong: 0,
      correct: 0,
      mistakes: 0,
    };
    if (!m.resolved) e.mistakes += 1;
    weakness.set(m.topic.id, e);
  }
  const weakTopics = Array.from(weakness.values())
    .map((e) => {
      const attempted = e.correct + e.wrong;
      const accuracy = attempted > 0 ? e.correct / attempted : null;
      // Çözülmemiş hatalar daha ağır basar; yanlış sayısı hacmi temsil eder.
      const score = e.mistakes * 3 + e.wrong;
      return { ...e, attempted, accuracy, score };
    })
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const hasExams = scorePoints.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Analiz</h1>
        <p className="text-sm text-gray-500">
          Kaydettiğiniz verilerden çıkan gelişim ve zayıf nokta özeti.
        </p>
      </div>

      {weakTopics.length > 0 && (
        <section className="card">
          <h2 className="font-semibold text-gray-900">Zayıf Konu Radarı</h2>
          <p className="mt-0.5 text-xs text-gray-500">
            Yanlış sayısı ve çözülmemiş hata kayıtlarına göre en çok puan kaybettiren
            konular.
          </p>
          <ol className="mt-3 space-y-2">
            {weakTopics.map((t, i) => (
              <li key={t.topic} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {i + 1}. {t.topic}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t.subject}
                    {t.attempted > 0 && ` · ${t.attempted} soru`}
                    {t.accuracy !== null && ` · %${(t.accuracy * 100).toFixed(0)} doğruluk`}
                  </p>
                </div>
                <div className="shrink-0 text-right text-xs">
                  {t.wrong > 0 && <span className="text-red-600">{t.wrong} yanlış</span>}
                  {t.mistakes > 0 && (
                    <span className="ml-2 text-amber-600">{t.mistakes} hata kaydı</span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {hasExams ? (
        <ChartCard
          title="Tahmini Puan Gelişimi"
          description={
            easiestTarget
              ? `Yatay çizgi, en düşük taban puanlı hedefiniz (${easiestTarget.name}).`
              : "Denemelerdeki tahmini LGS puanınız."
          }
          table={{
            columns: ["Deneme", "Tarih", "Tahmini puan"],
            rows: scorePoints.map((p) => [p.name, p.label, p.puan.toFixed(1)]),
          }}
        >
          <ScoreTrendChart
            data={scorePoints.map((p) => ({ label: p.label, puan: Number(p.puan.toFixed(1)) }))}
            targetScore={easiestTarget?.cutoffScore ?? null}
            targetLabel={easiestTarget?.name}
          />
        </ChartCard>
      ) : (
        <section className="card">
          <p className="text-sm text-gray-600">
            Gelişim grafikleri için en az bir denemede 6 dersin tamamını girmeniz gerekiyor.
          </p>
        </section>
      )}

      {usedSubjects.length > 0 && netRows.length > 1 && (
        <ChartCard
          title="Ders Bazında Net Gelişimi"
          description="Hangi ders yükseliyor, hangisi tıkandı."
          table={{
            columns: ["Tarih", ...usedSubjects],
            rows: netRows.map((r) => [
              String(r.label),
              ...usedSubjects.map((s) => (r[s] === undefined ? "-" : String(r[s]))),
            ]),
          }}
        >
          <SubjectNetTrendChart data={netRows} subjects={usedSubjects} />
        </ChartCard>
      )}

      {lastExamBars.length > 0 && (
        <ChartCard
          title="Son Denemede Ders Bazlı Net"
          description={lastExam ? `${lastExam.name} · ${shortDate(lastExam.date)}` : undefined}
          table={{
            columns: ["Ders", "Net"],
            rows: lastExamBars.map((b) => [b.label, b.value.toFixed(2)]),
          }}
        >
          <HorizontalBarChart
            data={lastExamBars}
            valueName="Net"
            height={Math.max(180, lastExamBars.length * 34)}
            decimals={2}
          />
        </ChartCard>
      )}

      {accuracyPoints.length > 1 && (
        <ChartCard
          title="Haftalık Doğruluk Oranı"
          description="Doğru ÷ (doğru + yanlış). Soru sayısından bağımsız kalite göstergesi."
          table={{
            columns: ["Hafta", "Doğruluk", "Soru"],
            rows: accuracyPoints.map((p) => [p.label, `%${p.oran}`, p.soru]),
          }}
        >
          <AccuracyTrendChart data={accuracyPoints} />
        </ChartCard>
      )}

      {reasonBars.length > 0 && (
        <ChartCard
          title="Hata Nedeni Dağılımı"
          description="Dikkatsizlik mi bilgi eksiği mi baskın? İkisinin çözümü farklıdır."
          table={{
            columns: ["Neden", "Adet"],
            rows: reasonBars.map((b) => [b.label, b.value]),
          }}
        >
          <HorizontalBarChart
            data={reasonBars}
            valueName="Hata"
            height={Math.max(160, reasonBars.length * 34)}
          />
        </ChartCard>
      )}

      {topicMistakeBars.length > 0 && (
        <ChartCard
          title="Konu Bazlı Hata Sayısı"
          description="En çok hata kaydı girilen ilk 10 konu."
          table={{
            columns: ["Konu", "Adet"],
            rows: topicMistakeBars.map((b) => [b.label, b.value]),
          }}
        >
          <HorizontalBarChart
            data={topicMistakeBars}
            valueName="Hata"
            height={Math.max(180, topicMistakeBars.length * 32)}
          />
        </ChartCard>
      )}
    </div>
  );
}
