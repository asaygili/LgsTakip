import type { GoalMetric } from "@/lib/goals";

/**
 * Tek bir haftalık hedefin ilerleme çubuğu. Hedefin ne kadarı gerçekleşti,
 * ne kadarı eksik kaldı — ikisi de sayı olarak yazılır; çubuk sadece bunu
 * görselleştirir.
 */
export default function GoalBar({ metric }: { metric: GoalMetric }) {
  const width = Math.min(100, metric.percent);

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
        <span className="text-gray-600">{metric.label}</span>
        <span
          className={
            metric.reached ? "font-medium text-emerald-700" : "tabular-nums text-gray-500"
          }
        >
          {metric.done} / {metric.target} {metric.unit} (%{metric.percent})
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full ${
            metric.reached ? "bg-emerald-500" : "bg-brand-600"
          }`}
          style={{ width: `${width}%` }}
        />
      </div>
      <p className="mt-1 text-[11px] text-gray-500">
        {metric.reached
          ? metric.surplus > 0
            ? `Hedef tamam, ${metric.surplus} ${metric.unit} fazlası var.`
            : "Hedef tam tamına tuttu."
          : `${metric.remaining} ${metric.unit} eksik.`}
      </p>
    </div>
  );
}
