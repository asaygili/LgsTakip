import type { Goal } from "@prisma/client";

export type GoalMetricKey = "questions" | "minutes" | "exams";

export type GoalMetric = {
  key: GoalMetricKey;
  label: string;
  unit: string;
  target: number;
  done: number;
  /** Hedefin yüzde kaçı gerçekleşti (100'ü aşabilir). */
  percent: number;
  /** Hedefe ulaşmak için kalan miktar; hedef aşıldıysa 0. */
  remaining: number;
  /** Hedefin üzerine çıkılan miktar; aşılmadıysa 0. */
  surplus: number;
  reached: boolean;
};

export type GoalTotals = { questions: number; minutes: number; exams: number };

type GoalTargets = Pick<Goal, "weeklyQuestions" | "weeklyMinutes" | "weeklyExams">;

const METRICS: {
  key: GoalMetricKey;
  label: string;
  unit: string;
  field: keyof GoalTargets;
}[] = [
  { key: "questions", label: "Soru", unit: "soru", field: "weeklyQuestions" },
  { key: "minutes", label: "Çalışma süresi", unit: "dk", field: "weeklyMinutes" },
  { key: "exams", label: "Deneme", unit: "deneme", field: "weeklyExams" },
];

/**
 * Hedefi olan (0'dan büyük) metrikleri, o haftaki gerçekleşme değerleriyle
 * birlikte döndürür. Hedef girilmemiş metrik listeye hiç girmez.
 */
export function buildGoalMetrics(
  goal: GoalTargets | null,
  totals: GoalTotals
): GoalMetric[] {
  if (!goal) return [];

  return METRICS.flatMap(({ key, label, unit, field }) => {
    const target = goal[field];
    if (!target || target <= 0) return [];

    const done = totals[key];
    return [
      {
        key,
        label,
        unit,
        target,
        done,
        percent: Math.round((done / target) * 100),
        remaining: Math.max(0, target - done),
        surplus: Math.max(0, done - target),
        reached: done >= target,
      },
    ];
  });
}
