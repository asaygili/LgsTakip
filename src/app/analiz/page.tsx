import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";
import { netOf, calculateLgsPuan } from "@/lib/lgs";
import { MISTAKE_REASON_LABELS, TOPIC_STATUS_LABELS } from "@/lib/labels";
import { TOPIC_STATUS_ORDER, TOPIC_STATUS_FILL } from "@/lib/chart";
import { buildGoalMetrics, type GoalMetric } from "@/lib/goals";
import { addWeeks, startOfWeek, endOfWeek, shortDate, weekRangeLabel } from "@/lib/week";
import GoalBar from "@/components/GoalBar";
import ChartCard from "@/components/charts/ChartCard";
import ScoreTrendChart from "@/components/charts/ScoreTrendChart";
import MultiLineChart from "@/components/charts/MultiLineChart";
import HorizontalBarChart from "@/components/charts/HorizontalBarChart";
import AccuracyTrendChart from "@/components/charts/AccuracyTrendChart";
import StackedPercentChart from "@/components/charts/StackedPercentChart";

const HISTORY_WEEKS = 8;

/**
 * Yığılmış bar tam %100 etsin diye tamsayı yüzdeleri en büyük kalan yöntemiyle
 * dağıtır; yuvarlamadan doğan 0.1'lik taşmalar ekseni bozuyordu.
 */
function wholePercents(counts: number[], total: number) {
  const raw = counts.map((c) => (c / total) * 100);
  const result = raw.map(Math.floor);
  let rest = 100 - result.reduce((a, b) => a + b, 0);
  const byFraction = raw
    .map((v, i) => ({ i, fraction: v - Math.floor(v) }))
    .sort((a, b) => b.fraction - a.fraction);
  for (const { i } of byFraction) {
    if (rest <= 0) break;
    result[i] += 1;
    rest -= 1;
  }
  return result;
}

export default async function AnalizPage() {
  await requireSession();

  const thisWeekStart = startOfWeek();
  const thisWeekEnd = endOfWeek();
  const historyStart = addWeeks(thisWeekStart, -(HISTORY_WEEKS - 1));

  const [exams, subjects, mistakes, dailyLogs, targetSchools, goal, topics] =
    await Promise.all([
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
      prisma.goal.findUnique({ where: { id: "default" } }),
      prisma.topic.findMany({ include: { subject: true } }),
    ]);

  // --- Bu haftaki hedef gerçekleşmesi ---
  const thisWeekLogs = dailyLogs.filter(
    (l) => l.date >= thisWeekStart && l.date < thisWeekEnd
  );
  const goalMetrics = buildGoalMetrics(goal, {
    questions: thisWeekLogs.reduce(
      (s, l) => s + l.questionsCorrect + l.questionsWrong + l.questionsBlank,
      0
    ),
    minutes: thisWeekLogs.reduce((s, l) => s + (l.durationMinutes ?? 0), 0),
    exams: exams.filter((e) => e.date >= thisWeekStart && e.date < thisWeekEnd).length,
  });

  // --- Son 8 haftanın hedefe ulaşma oranı ---
  const historyWeeks = Array.from({ length: HISTORY_WEEKS }, (_, i) =>
    addWeeks(historyStart, i)
  );
  const goalHistoryRows = historyWeeks.map((weekStart) => {
    const weekEnd = addWeeks(weekStart, 1);
    const logs = dailyLogs.filter((l) => l.date >= weekStart && l.date < weekEnd);
    const metrics = buildGoalMetrics(goal, {
      questions: logs.reduce(
        (s, l) => s + l.questionsCorrect + l.questionsWrong + l.questionsBlank,
        0
      ),
      minutes: logs.reduce((s, l) => s + (l.durationMinutes ?? 0), 0),
      exams: exams.filter((e) => e.date >= weekStart && e.date < weekEnd).length,
    });
    const row: Record<string, string | number> = { label: shortDate(weekStart) };
    for (const m of metrics) row[m.label] = m.percent;
    return { weekStart, row, metrics };
  });
  const goalSeries = goalMetrics.map((m) => m.label);
  const goalHistoryMax = Math.max(
    120,
    ...goalHistoryRows.flatMap((r) => r.metrics.map((m) => m.percent))
  );

  // --- Ders bazında konu öğrenme durumu ---
  const statusKeys = [...TOPIC_STATUS_ORDER];
  const statusLabels = statusKeys.map((k) => TOPIC_STATUS_LABELS[k]);
  const topicRows = subjects
    .map((subject) => {
      const own = topics.filter((t) => t.subjectId === subject.id);
      if (own.length === 0) return null;

      const counts = Object.fromEntries(
        statusKeys.map((k) => [k, own.filter((t) => t.status === k).length])
      ) as Record<string, number>;

      const percents = wholePercents(
        statusKeys.map((k) => counts[k]),
        own.length
      );
      const row: Record<string, string | number> = { label: subject.name };
      statusKeys.forEach((key, i) => {
        const label = TOPIC_STATUS_LABELS[key];
        row[label] = percents[i];
        row[`${label}__n`] = counts[key];
      });
      // "Tamamlanan" = öğrenildi; tekrar gerekli olanlar henüz bitmiş sayılmaz.
      const donePercent = percents[statusKeys.indexOf("OGRENILDI")];
      return {
        subject: subject.name,
        total: own.length,
        counts,
        percents,
        row,
        donePercent,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  const topicTotal = topicRows.reduce((s, r) => s + r.total, 0);
  const topicDone = topicRows.reduce((s, r) => s + r.counts.OGRENILDI, 0);
  const weakestSubject = [...topicRows].sort((a, b) => a.donePercent - b.donePercent)[0];

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
    .slice(-HISTORY_WEEKS)
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

      {goalMetrics.length > 0 ? (
        <section className="card space-y-3">
          <div>
            <h2 className="font-semibold text-gray-900">Bu Haftaki Hedef</h2>
            <p className="mt-0.5 text-xs text-gray-500">
              {weekRangeLabel(thisWeekStart)} · pazar 23:59&apos;da sıfırlanır
            </p>
          </div>
          {goalMetrics.map((m) => (
            <GoalBar key={m.key} metric={m} />
          ))}
          <GoalSummaryTable metrics={goalMetrics} />
        </section>
      ) : (
        <section className="card">
          <p className="text-sm text-gray-600">
            Haftalık hedef girilmemiş.{" "}
            <Link href="/ayarlar" className="font-medium text-brand-700 underline">
              Ayarlar&apos;dan hedef belirleyin
            </Link>{" "}
            — gerçekleşme oranı burada takip edilir.
          </p>
        </section>
      )}

      {goalSeries.length > 0 && (
        <ChartCard
          title="Son 8 Hafta Hedef Gerçekleşme"
          description="Her hafta hedefin yüzde kaçı tamamlandı. Kesikli çizgi %100, yani hedefin tam karşılığı. En sağdaki hafta hâlâ devam ediyor."
          table={{
            columns: ["Hafta", ...goalSeries.map((s) => `${s} (%)`)],
            rows: goalHistoryRows.map((r) => [
              weekRangeLabel(r.weekStart),
              ...goalSeries.map((s) => {
                const m = r.metrics.find((x) => x.label === s);
                return m ? `${m.done}/${m.target} (%${m.percent})` : "-";
              }),
            ]),
          }}
        >
          <MultiLineChart
            data={goalHistoryRows.map((r) => r.row)}
            series={goalSeries}
            unit="%"
            domain={[0, goalHistoryMax]}
            referenceY={100}
            referenceLabel="Hedef %100"
          />
        </ChartCard>
      )}

      {topicRows.length > 0 && (
        <ChartCard
          title="Ders Bazında Konu Durumu"
          description={
            weakestSubject
              ? `Toplam ${topicTotal} konunun ${topicDone} tanesi öğrenildi (%${Math.round(
                  (topicDone / topicTotal) * 100
                )}). En geride kalan ders: ${weakestSubject.subject}.`
              : undefined
          }
          table={{
            columns: ["Ders", "Konu", ...statusLabels, "Eksik"],
            rows: topicRows.map((r) => [
              r.subject,
              r.total,
              ...statusKeys.map((k, i) => `${r.counts[k]} (%${r.percents[i]})`),
              `%${100 - r.donePercent}`,
            ]),
          }}
        >
          <StackedPercentChart
            data={topicRows.map((r) => r.row)}
            keys={statusLabels}
            colors={statusKeys.map((k) => TOPIC_STATUS_FILL[k])}
            countUnit="konu"
            height={Math.max(220, topicRows.length * 44 + 60)}
          />
        </ChartCard>
      )}

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
          <MultiLineChart data={netRows} series={usedSubjects} />
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

/** Hedeflerin sayısal dökümü: hedef, gerçekleşen, eksik/fazla. */
function GoalSummaryTable({ metrics }: { metrics: GoalMetric[] }) {
  return (
    <div className="-mx-1 overflow-x-auto pt-1">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-500">
            <th className="px-1 py-1.5 font-medium">Hedef</th>
            <th className="px-1 py-1.5 font-medium">Haftalık</th>
            <th className="px-1 py-1.5 font-medium">Gerçekleşen</th>
            <th className="px-1 py-1.5 font-medium">Eksik</th>
            <th className="px-1 py-1.5 font-medium">Oran</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((m) => (
            <tr key={m.key} className="border-b border-gray-100 last:border-0">
              <td className="px-1 py-1.5 text-gray-700">{m.label}</td>
              <td className="px-1 py-1.5 tabular-nums text-gray-700">{m.target}</td>
              <td className="px-1 py-1.5 tabular-nums text-gray-700">{m.done}</td>
              <td
                className={`px-1 py-1.5 tabular-nums ${
                  m.reached ? "text-emerald-700" : "text-red-600"
                }`}
              >
                {m.reached ? `+${m.surplus}` : m.remaining}
              </td>
              <td
                className={`px-1 py-1.5 tabular-nums ${
                  m.reached ? "font-medium text-emerald-700" : "text-gray-700"
                }`}
              >
                %{m.percent}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
